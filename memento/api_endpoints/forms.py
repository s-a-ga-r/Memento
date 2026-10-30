"""
Create and update endpoints for Memento records.

These endpoints:
- Require an authenticated user.
- Restrict access to configured DocTypes and fields.
- Check Frappe DocType and document permissions.
- Use normal Frappe document validation and save operations.
"""

import frappe
from frappe import _

from memento.api_endpoints.doctype_config import get_doctype_config
from memento.api_endpoints.permissions import (
	require_doctype_permission,
	validate_field_payload,
)
from memento.api_endpoints.utils import (
	parse_json_input,
	success_response,
)

# Defense-in-depth protection for framework-managed fields.
PROTECTED_FIELDS = {
	"name",
	"owner",
	"creation",
	"modified",
	"modified_by",
	"docstatus",
	"parent",
	"parentfield",
	"parenttype",
	"idx",
}


def _parse_and_validate_payload(
	doctype: str,
	data,
	operation: str,
) -> dict:
	"""Parse a JSON object and validate its field names."""
	payload = parse_json_input(
		data,
		field_name="data",
		expected_type=dict,
	)

	if not payload:
		frappe.throw(
			_("The data payload cannot be empty."),
			frappe.ValidationError,
		)

	protected = sorted(PROTECTED_FIELDS.intersection(payload.keys()))

	if protected:
		frappe.throw(
			_("System-managed fields cannot be supplied: {0}").format(", ".join(protected)),
			frappe.PermissionError,
		)

	return validate_field_payload(
		doctype=doctype,
		payload=payload,
		operation=operation,
	)


def _apply_payload(doc, payload: dict) -> None:
	"""Assign validated values through the Frappe Document API."""
	for fieldname, value in payload.items():
		doc.set(fieldname, value)


@frappe.whitelist(methods=["POST"])
def create_doctype_record(
	doctype: str,
	data,
) -> dict:
	"""Create a record in an approved DocType.

	API path:
	/api/method/memento.api_endpoints.forms.create_doctype_record

	The data argument may be a JSON object or a JSON-encoded string.
	"""
	require_doctype_permission(
		doctype,
		permission_type="create",
	)

	config = get_doctype_config(doctype)

	payload = _parse_and_validate_payload(
		doctype=doctype,
		data=data,
		operation="create",
	)

	doc = frappe.new_doc(doctype)
	_apply_payload(doc, payload)

	# Normal Frappe insert: validation and permission checks remain enabled.
	doc.insert()

	return success_response(
		data={
			"doctype": doctype,
			"name": doc.name,
		},
		message=f"{config['label']} record created successfully.",
	)


@frappe.whitelist(methods=["POST"])
def update_doctype_record(
	doctype: str,
	name: str,
	data,
) -> dict:
	"""Update an existing record in an approved DocType.

	API path:
	/api/method/memento.api_endpoints.forms.update_doctype_record

	The data argument may be a JSON object or a JSON-encoded string.
	"""
	require_doctype_permission(
		doctype,
		permission_type="write",
	)

	if not isinstance(name, str) or not name.strip():
		frappe.throw(
			_("A valid record name is required."),
			frappe.ValidationError,
		)

	name = name.strip()

	if not frappe.db.exists(doctype, name):
		frappe.throw(
			_("Record not found."),
			frappe.DoesNotExistError,
		)

	# Load the document and check permission for this specific record.
	doc = frappe.get_doc(doctype, name)

	require_doctype_permission(
		doctype,
		permission_type="write",
		doc=doc,
	)

	payload = _parse_and_validate_payload(
		doctype=doctype,
		data=data,
		operation="update",
	)

	_apply_payload(doc, payload)

	# Normal Frappe save: validation and permission checks remain enabled.
	doc.save()

	config = get_doctype_config(doctype)

	return success_response(
		data={
			"doctype": doctype,
			"name": doc.name,
		},
		message=f"{config['label']} record updated successfully.",
	)
