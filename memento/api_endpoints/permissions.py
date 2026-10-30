from typing import Any

import frappe
from frappe import _

from memento.api_endpoints.doctype_config import get_allowed_fields, get_doctype_config

ALLOWED_PERMISSION_TYPES = {"read", "create", "write", "delete", "submit", "cancel"}


FIELD_GROUP_PERMISSIONS = {
	"list_fields": "read",
	"form_fields": "read",
	"search_fields": "read",
	"create_fields": "create",
	"update_fields": "write",
}


def require_authenticated_user() -> str:
	user = getattr(frappe.session, "user", None)
	if not user or user == "Guest":
		frappe.throw(
			_("Authentication is required to access the Memento API."),
			frappe.AuthenticationError,
		)
	return user


def _get_configured_doctype(doctype: str) -> dict:
	if not isinstance(doctype, str) or not doctype.strip():
		frappe.throw(
			_("A valid doctype name is required"),
			frappe.ValidationError,
		)

	try:
		config = get_doctype_config(doctype)

	except ValueError:
		frappe.throw(
			_("Doctype is not allowed in the Memento API: {0}").format(doctype),
			frappe.PermissionError,
		)

	if not frappe.db.exists("DocType", doctype):
		frappe.throw(
			_("The configured Doctype does not exist : {0}").format(doctype),
			frappe.DoesNotExistError,
		)

	return config


def require_doctype_permission(
	doctype: str,
	permission_type: str = "read",
	doc: Any = None,
) -> bool:
	user = require_authenticated_user()
	_get_configured_doctype(doctype)

	if permission_type not in ALLOWED_PERMISSION_TYPES:
		frappe.throw(
			_("Unsupported permission type : {0}").format(permission_type),
			frappe.ValidationError,
		)

	if doc is not None:
		if getattr(doc, "doctype", None) != doctype:
			frappe.throw(_("The document does not match the requested doctype."), frappe.PermissionError)

	allowed = frappe.has_permission(doctype, ptype=permission_type, doc=doc, user=user)

	if not allowed:
		frappe.throw(
			_("You do not have {0} permission for {1}.").format(
				permission_type,
				doctype,
			),
			frappe.PermissionError,
		)
	return True


def get_permitted_fields(
	doctype: str,
	field_group: str = "list-fields",
) -> list[str]:
	permission_type = FIELD_GROUP_PERMISSIONS.get(field_group)
	if not permission_type:
		frappe.throw(
			_("Unsupported field group: {0}").format(field_group),
			frappe.ValidationError,
		)

	user = require_authenticated_user()
	_get_configured_doctype(doctype)

	# Check DocType-level permission before exposing its configured fields.
	require_doctype_permission(
		doctype,
		permission_type=permission_type,
	)

	try:
		configured_fields = get_allowed_fields(doctype, field_group)
	except ValueError:
		frappe.throw(
			_("Invalid field group: {0}").format(field_group),
			frappe.ValidationError,
		)

	meta = frappe.get_meta(doctype)

	# Frappe calculates field access from the user's roles and permission levels.
	permitted_meta_fields = set(
		meta.get_permitted_fieldnames(
			user=user,
			permission_type=permission_type,
			with_virtual_fields=False,
		)
	)

	# Table fields may be omitted by the metadata helper because they are not
	# ordinary value fields. Include them only when their permission level
	# is allowed for this operation.
	if meta.get_permissions():
		permitted_levels = set(
			meta.get_permlevel_access(
				permission_type=permission_type,
				user=user,
			)
		)

		for field in meta.fields:
			if field.fieldtype in {"Table", "Table MultiSelect"}:
				if (field.permlevel or 0) in permitted_levels:
					permitted_meta_fields.add(field.fieldname)
	else:
		# The DocType has no configured permission levels. The central
		# field allowlist still limits the fields this API can expose.
		permitted_meta_fields.update(field.fieldname for field in meta.fields)

	# Preserve the order defined in doctype_config.py.
	return [fieldname for fieldname in configured_fields if fieldname in permitted_meta_fields]


def validate_field_payload(
	doctype: str,
	payload: dict,
	operation: str,
) -> dict:
	"""Reject payload fields that are not allowed for create or update.

	This function validates field names only. Frappe document validation
	must still validate values, links, mandatory fields, and child tables.
	"""
	operation_to_group = {
		"create": "create_fields",
		"update": "update_fields",
	}

	field_group = operation_to_group.get(operation)

	if not field_group:
		frappe.throw(
			_("Operation must be 'create' or 'update'."),
			frappe.ValidationError,
		)

	if not isinstance(payload, dict):
		frappe.throw(
			_("The request payload must be a JSON object."),
			frappe.ValidationError,
		)

	permitted_fields = set(
		get_permitted_fields(
			doctype,
			field_group=field_group,
		)
	)

	invalid_fields = sorted(
		str(fieldname)
		for fieldname in payload
		if not isinstance(fieldname, str) or fieldname not in permitted_fields
	)

	if invalid_fields:
		frappe.throw(
			_("Fields are not allowed for this operation: {0}").format(", ".join(invalid_fields)),
			frappe.PermissionError,
		)

	return dict(payload)
