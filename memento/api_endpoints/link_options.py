import frappe
from frappe import _

from memento.api_endpoints.permissions import (
	get_permitted_fields,
	require_authenticated_user,
)
from memento.api_endpoints.utils import success_response

MAX_PAGE_LENGTH = 20

OPERATION_FIELD_GROUPS = {
	"create": "create_fields",
	"update": "update_fields",
}


@frappe.whitelist(methods=["GET"])
def search_link_options(
	source_doctype: str,
	fieldname: str,
	search: str | None = None,
	operation: str = "create",
	reference_doctype: str | None = None,
	page_length: int = MAX_PAGE_LENGTH,
) -> dict:
	"""
	Search records for a configured Link or Dynamic Link field.

	Link targets are not required to be Memento page DocTypes.
	Target record access is checked separately using Frappe permissions.

	API:
	/api/method/memento.api_endpoints.link_options.search_link_options
	"""
	user = require_authenticated_user()

	# Validate the operation and apply the source DocType's existing
	# configuration and field-level permission rules.
	field_group = OPERATION_FIELD_GROUPS.get(operation)

	if not field_group:
		frappe.throw(
			_("Operation must be 'create' or 'update'."),
			frappe.ValidationError,
		)

	permitted_fields = get_permitted_fields(
		source_doctype,
		field_group=field_group,
	)

	if fieldname not in permitted_fields:
		frappe.throw(
			_("You cannot access Link field {0}.").format(fieldname),
			frappe.PermissionError,
		)

	source_meta = frappe.get_meta(source_doctype)
	link_field = source_meta.get_field(fieldname)

	if not link_field:
		frappe.throw(
			_("Field {0} does not exist.").format(fieldname),
			frappe.ValidationError,
		)

	# A normal Link has a fixed target DocType.
	if link_field.fieldtype == "Link":
		target_doctype = (link_field.options or "").strip()

	# A Dynamic Link gets its target DocType from another field.
	elif link_field.fieldtype == "Dynamic Link":
		options_fieldname = (link_field.options or "").strip()

		if options_fieldname not in permitted_fields:
			frappe.throw(
				_("The Dynamic Link controller field is not accessible."),
				frappe.PermissionError,
			)

		controller_field = source_meta.get_field(options_fieldname)

		if not controller_field:
			frappe.throw(
				_("The Dynamic Link controller field does not exist."),
				frappe.ValidationError,
			)

		target_doctype = (reference_doctype or "").strip()

		# The user has not selected the target DocType yet.
		if not target_doctype:
			return success_response(
				data=[],
				message=_("Select a document type first."),
			)

		# Validate the chosen target against the controller field.
		if controller_field.fieldtype == "Select":
			allowed_types = {
				option.strip() for option in (controller_field.options or "").splitlines() if option.strip()
			}

			if target_doctype not in allowed_types:
				frappe.throw(
					_("The selected document type is not an allowed option."),
					frappe.ValidationError,
				)

		elif controller_field.fieldtype == "Link" and controller_field.options != "DocType":
			frappe.throw(
				_("The Dynamic Link controller must link to DocType."),
				frappe.ValidationError,
			)

	else:
		frappe.throw(
			_("Field {0} is not a Link or Dynamic Link field.").format(fieldname),
			frappe.ValidationError,
		)

	if not target_doctype or not frappe.db.exists("DocType", target_doctype):
		frappe.throw(
			_("The linked DocType is invalid."),
			frappe.ValidationError,
		)

	# Do not use get_doctype_config() for the target:
	# linked targets may legitimately be User, Role, Assignment Rule, etc.
	if not frappe.has_permission(
		target_doctype,
		ptype="read",
		user=user,
	):
		frappe.throw(
			_("You do not have read permission for {0}.").format(target_doctype),
			frappe.PermissionError,
		)

	target_meta = frappe.get_meta(target_doctype)

	# Include the title only when the current user is allowed to read it.
	permitted_target_fields = set(
		target_meta.get_permitted_fieldnames(
			user=user,
			permission_type="read",
			with_virtual_fields=False,
		)
	)

	title_field = getattr(target_meta, "title_field", None)

	if title_field == "name" or (
		title_field and title_field in permitted_target_fields and target_meta.get_field(title_field)
	):
		display_field = title_field
	else:
		display_field = None

	try:
		result_limit = int(page_length)
	except (TypeError, ValueError):
		result_limit = MAX_PAGE_LENGTH

	result_limit = max(1, min(result_limit, MAX_PAGE_LENGTH))

	search_text = (search or "").strip()[:100]

	# Search by document name and, where permitted, its title field.
	or_filters = []

	if search_text:
		pattern = f"%{search_text}%"

		or_filters.append(["name", "like", pattern])

		if display_field and display_field != "name":
			or_filters.append([display_field, "like", pattern])

	fields = ["name"]

	if display_field and display_field != "name":
		fields.append(display_field)

	# frappe.get_list applies Frappe's record permission rules.
	rows = frappe.get_list(
		target_doctype,
		fields=fields,
		or_filters=or_filters or None,
		order_by="name asc",
		page_length=result_limit,
	)

	options = []

	for row in rows:
		record_name = row.get("name")

		if not record_name:
			continue

		label = (row.get(display_field) if display_field else None) or record_name

		options.append(
			{
				"value": record_name,
				"label": str(label),
				"name": record_name,
			}
		)

	return success_response(
		data=options,
		message=_("Link options retrieved successfully."),
	)
