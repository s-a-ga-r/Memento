import frappe
from frappe import _

from memento.api_endpoints.doctype_config import get_allowed_doctypes, get_doctype_config
from memento.api_endpoints.permissions import (
	get_permitted_fields,
	require_authenticated_user,
	require_doctype_permission,
)
from memento.api_endpoints.utils import success_response

# API purposes map to the field groups defined in doctype_config.py.
PURPOSE_FIELD_GROUPS = {
	"list": "list_fields",
	"form": "form_fields",
	"create": "create_fields",
	"update": "update_fields",
	"search": "search_fields",
}
LINK_FIELD_TYPES = {"Link"}
DYNAMIC_LINK_FIELD_TYPES = {"Dynamic Link"}
CHILD_TABLE_FIELD_TYPES = {"Table", "Table MultiSelect"}


def _get_operation_capabilities(doctype: str, user: str) -> dict:
	return {
		"can_read": bool(
			frappe.has_permission(
				doctype,
				ptype="read",
				user=user,
			)
		),
		"can_create": bool(frappe.has_permission(doctype, ptype="create", user=user)),
		"can_update": bool(frappe.has_permission(doctype, ptype="write", user=user)),
		"can_delete": bool(frappe.has_permission(doctype, ptype="delete", user=user)),
	}


def _get_field_metadata(doctype: str, fieldname: str) -> dict | None:
	meta = frappe.get_meta(doctype)
	field = meta.get_field(fieldname)

	if not field:
		return None

	result = {
		"fieldname": field.fieldname,
		"label": field.label or field.fieldname.replace("_", " ").title(),
		"fieldtype": field.fieldtype,
		"required": bool(field.reqd),
		"read_only": bool(field.read_only),
		"hidden": bool(field.hidden),
	}
	# Expose Select options so the frontend can build filter dropdowns.
	if field.fieldtype == "Select":
		result["options"] = field.options or ""

	if field.description:
		result["description"] = field.description
	if field.default is not None and field.default != "":
		result["default"] = field.default

	if field.length:
		result["length"] = field.length

	if field.precision is not None:
		result["precision"] = field.precision

	if field.fieldtype == "Select":
		result["select_options"] = [
			option.strip() for option in (field.options or "").splitlines() if option.strip()
		]

	elif field.fieldtype in LINK_FIELD_TYPES:
		result["link_doctypes"] = field.options

	elif field.fieldtype in DYNAMIC_LINK_FIELD_TYPES:
		result["options_field"] = field.options

	elif field.fieldtype in CHILD_TABLE_FIELD_TYPES:
		result["child_doctype"] = field.options

	return result


@frappe.whitelist(methods=["GET"])
def get_available_doctypes() -> dict:
	user = require_authenticated_user()

	available = []

	for doctype in get_allowed_doctypes():
		config = get_doctype_config(doctype)
		if not frappe.has_permission(doctype, ptype="read", user=user):
			continue

		capabilities = _get_operation_capabilities(doctype, user)

		available.append({"doctype": doctype, "label": config["label"], "capabilities": capabilities})

	return success_response(data=available, message="Available Memento pages reatrived successfully.")


@frappe.whitelist(methods=["GET"])
def get_doctype_metadata(
	doctype: str,
	purpose: str = "form",
) -> dict:
	if purpose not in PURPOSE_FIELD_GROUPS:
		frappe.throw(_("Unsupported metadata purpose : {0}").format(purpose), frappe.ValidationError)

	group = PURPOSE_FIELD_GROUPS[purpose]
	fields = get_permitted_fields(doctype, field_group=group)

	config = get_doctype_config(doctype)
	field_metadata = []
	for fieldname in fields:
		item = _get_field_metadata(doctype, fieldname)
		if item is not None:
			field_metadata.append(item)
	user = frappe.session.user
	return success_response(
		data={
			"doctype": doctype,
			"label": config["label"],
			"purpose": purpose,
			"fields": field_metadata,
			"capabilities": _get_operation_capabilities(doctype, user),
		},
		message=f"{config['label']} metadata retreived successfully",
	)
