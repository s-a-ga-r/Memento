"""
Read-only record endpoints for the Memento API.

Exposed endpoints:
- get_doctype_records
- get_doctype_record
- get_doctype_count

All endpoints require authentication, enforce the central DocType allowlist,
and rely on Frappe's permission-aware record access.
"""

import frappe
from frappe import _

from memento.api_endpoints.doctype_config import get_doctype_config
from memento.api_endpoints.permissions import (
	get_permitted_fields,
	require_doctype_permission,
)
from memento.api_endpoints.utils import (
	get_pagination,
	success_response,
	validate_filters,
	validate_order_by,
	validate_search_term,
)

# Fields that are not ordinary columns on the parent DocType table.
# Table values are handled when retrieving a single document instead.
NON_QUERYABLE_FIELD_TYPES = {
	"Table",
	"Table MultiSelect",
	"Section Break",
	"Column Break",
	"Tab Break",
	"HTML",
	"Button",
	"Fold",
	"Heading",
	"Password",
}


def _get_queryable_fields(
	doctype: str,
	field_group: str,
) -> list[str]:
	"""Return permitted, queryable fields from the configured field group."""
	configured_fields = get_permitted_fields(
		doctype,
		field_group=field_group,
	)
	meta = frappe.get_meta(doctype)

	queryable_fields = []

	for fieldname in configured_fields:
		field = meta.get_field(fieldname)

		if not field:
			continue

		if field.fieldtype in NON_QUERYABLE_FIELD_TYPES:
			continue

		if getattr(field, "is_virtual", False):
			continue

		queryable_fields.append(fieldname)

	return queryable_fields


def _prepare_filters_and_search(
	doctype: str,
	filters=None,
	search=None,
) -> tuple[dict | list, list | None]:
	"""Validate filters and prepare an optional multi-field search."""
	list_fields = _get_queryable_fields(
		doctype,
		field_group="list_fields",
	)

	# Record names are supported for exact filtering.
	filter_fields = list(dict.fromkeys(["name", *list_fields]))

	validated_filters = validate_filters(
		filters,
		allowed_fields=filter_fields,
	)

	search_term = validate_search_term(search)

	if not search_term:
		return validated_filters, None

	search_fields = _get_queryable_fields(
		doctype,
		field_group="search_fields",
	)

	if not search_fields:
		frappe.throw(
			_("Search is not configured for {0}.").format(doctype),
			frappe.ValidationError,
		)

	# Frappe combines these OR conditions with the regular filters.
	or_filters = [[fieldname, "like", f"%{search_term}%"] for fieldname in search_fields]

	return validated_filters, or_filters


@frappe.whitelist(methods=["GET"])
def get_doctype_records(
	doctype: str,
	filters=None,
	search=None,
	start=0,
	page_length=20,
	order_by=None,
) -> dict:
	"""Return a permission-filtered, paginated list of records.

	API path:
	/api/method/memento.api_endpoints.records.get_doctype_records
	"""
	require_doctype_permission(
		doctype,
		permission_type="read",
	)

	config = get_doctype_config(doctype)

	pagination = get_pagination(
		start=start,
		page_length=page_length,
	)

	query_fields = _get_queryable_fields(
		doctype,
		field_group="list_fields",
	)

	# Always include the record identifier for frontend navigation.
	fields = list(dict.fromkeys(["name", *query_fields]))

	validated_filters, or_filters = _prepare_filters_and_search(
		doctype,
		filters=filters,
		search=search,
	)

	allowed_order_fields = fields

	validated_order_by = validate_order_by(
		order_by=order_by,
		allowed_fields=allowed_order_fields,
		default_order_by=config.get(
			"default_order_by",
			"modified desc",
		),
	)

	# Fetch one extra result so we can determine whether another page exists.
	query_page_length = pagination["page_length"] + 1

	rows = frappe.get_list(
		doctype,
		fields=fields,
		filters=validated_filters,
		or_filters=or_filters,
		order_by=validated_order_by,
		start=pagination["start"],
		page_length=query_page_length,
	)

	has_more = len(rows) > pagination["page_length"]
	records = rows[: pagination["page_length"]]

	response_pagination = {
		"start": pagination["start"],
		"page_length": pagination["page_length"],
		"returned": len(records),
		"has_more": has_more,
		"next_start": (pagination["start"] + pagination["page_length"] if has_more else None),
	}

	return success_response(
		data=records,
		message=f"{config['label']} retrieved successfully.",
		pagination=response_pagination,
	)


@frappe.whitelist(methods=["GET"])
def get_doctype_record(
	doctype: str,
	name: str,
) -> dict:
	"""Return one record after checking its document-level permission.

	API path:
	/api/method/memento.api_endpoints.records.get_doctype_record
	"""
	require_doctype_permission(
		doctype,
		permission_type="read",
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

	doc = frappe.get_doc(doctype, name)

	# Check permissions for this specific document, not just the DocType.
	require_doctype_permission(
		doctype,
		permission_type="read",
		doc=doc,
	)

	# Apply Frappe's field-level read restrictions before extracting values.
	doc.apply_fieldlevel_read_permissions()

	permitted_fields = get_permitted_fields(
		doctype,
		field_group="form_fields",
	)

	data = {"name": doc.name}

	# Only return fields explicitly configured for this form and allowed
	# by the current user's field permissions.
	for fieldname in permitted_fields:
		if fieldname == "name":
			continue

		data[fieldname] = doc.get(fieldname)

	config = get_doctype_config(doctype)

	return success_response(
		data=data,
		message=f"{config['label']} record retrieved successfully.",
	)


@frappe.whitelist(methods=["GET"])
def get_doctype_count(
	doctype: str,
	filters=None,
	search=None,
) -> dict:
	"""Return the count of records visible to the current user.

	The filters and search term follow the same allowlist rules as the
	list endpoint.

	API path:
	/api/method/memento.api_endpoints.records.get_doctype_count
	"""
	require_doctype_permission(
		doctype,
		permission_type="read",
	)

	config = get_doctype_config(doctype)

	validated_filters, or_filters = _prepare_filters_and_search(
		doctype,
		filters=filters,
		search=search,
	)

	# Use the permission-aware list query for the count aggregation.
	rows = frappe.get_list(
		doctype,
		fields=["count(name) as total"],
		filters=validated_filters,
		or_filters=or_filters,
		page_length=1,
	)

	total = int(rows[0].get("total") or 0) if rows else 0

	return success_response(
		data={
			"doctype": doctype,
			"label": config["label"],
			"count": total,
		},
		message=f"{config['label']} count retrieved successfully.",
	)
