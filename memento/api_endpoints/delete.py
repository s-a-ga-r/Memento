import frappe
from frappe import _

from memento.api_endpoints.permissions import (
	require_doctype_permission,
)
from memento.api_endpoints.utils import success_response


@frappe.whitelist(methods=["POST"])
def delete_doctype_record(doctype, name):
	"""
	Delete a record from an allowlisted DocType.

	Deletion is permitted only when the current user has
	the required DocType-level and document-level permission.
	"""

	# Validate authentication, allowlist, and DocType-level permission.
	require_doctype_permission(
		doctype,
		permission_type="delete",
	)

	# Validate the record name.
	if not isinstance(name, str) or not name.strip():
		frappe.throw(_("A valid record name is required."))

	name = name.strip()

	# Confirm that the record exists.
	if not frappe.db.exists(doctype, name):
		frappe.throw(
			_("Record {0} does not exist in {1}.").format(
				name,
				doctype,
			),
			frappe.DoesNotExistError,
		)

	# Load the document and verify document-level permission.
	doc = frappe.get_doc(doctype, name)

	require_doctype_permission(
		doctype,
		permission_type="delete",
		doc=doc,
	)

	# Let Frappe execute its normal deletion checks and hooks.
	doc.delete()

	return success_response(
		message=_("Record deleted successfully."),
		data={
			"doctype": doctype,
			"name": name,
		},
	)
