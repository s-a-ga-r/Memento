"""
Reusable validation and response helpers for the Memento API.

This module does not perform database operations or grant permissions.
Call permission helpers before accessing records, and use Frappe's
permission-aware APIs when querying or modifying documents.
"""

import json
import re
from typing import Any

import frappe
from frappe import _

# Pagination limits
DEFAULT_PAGE_LENGTH = 20
MAX_PAGE_LENGTH = 100
MAX_START = 1_000_000

# Input limits
MAX_SEARCH_LENGTH = 100
MAX_FILTER_VALUE_LENGTH = 2_000
MAX_FILTER_ITEMS = 100

# Operators accepted by the filter validator.
ALLOWED_FILTER_OPERATORS = {
	"=",
	"!=",
	">",
	">=",
	"<",
	"<=",
	"like",
	"not like",
	"in",
	"not in",
	"between",
	"is",
}

# These fields can be used for ordering even when not displayed in a list.
SYSTEM_ORDER_FIELDS = {
	"name",
	"creation",
	"modified",
}


def parse_json_input(
	value: Any,
	field_name: str,
	expected_type: type | tuple[type, ...],
	default: Any = None,
) -> Any:
	"""Parse JSON string input and validate its resulting Python type.

	Already-parsed values of the expected type are returned unchanged.
	None or an empty string returns the provided default.
	"""
	if value is None or value == "":
		return default

	if isinstance(value, str):
		try:
			value = json.loads(value)
		except json.JSONDecodeError:
			frappe.throw(
				_("{0} must contain valid JSON.").format(field_name),
				frappe.ValidationError,
			)

	if not isinstance(value, expected_type):
		if isinstance(expected_type, tuple):
			expected_name = " or ".join(item.__name__ for item in expected_type)
		else:
			expected_name = expected_type.__name__

		frappe.throw(
			_("{0} must be of type {1}.").format(
				field_name,
				expected_name,
			),
			frappe.ValidationError,
		)

	return value


def _validate_integer(
	value: Any,
	field_name: str,
	minimum: int,
	maximum: int,
) -> int:
	"""Accept a bounded integer or a string containing integer digits."""
	if isinstance(value, bool):
		frappe.throw(
			_("{0} must be an integer.").format(field_name),
			frappe.ValidationError,
		)

	if isinstance(value, int):
		number = value
	elif isinstance(value, str) and re.fullmatch(r"\d+", value.strip()):
		number = int(value.strip())
	else:
		frappe.throw(
			_("{0} must be an integer.").format(field_name),
			frappe.ValidationError,
		)

	if not minimum <= number <= maximum:
		frappe.throw(
			_("{0} must be between {1} and {2}.").format(
				field_name,
				minimum,
				maximum,
			),
			frappe.ValidationError,
		)

	return number


def get_pagination(
	start: Any = 0,
	page_length: Any = DEFAULT_PAGE_LENGTH,
) -> dict[str, int]:
	"""Validate and return pagination arguments for Frappe list queries.

	Returns:
	    {"start": 0, "page_length": 20}
	"""
	validated_start = _validate_integer(
		start,
		field_name="start",
		minimum=0,
		maximum=MAX_START,
	)

	validated_page_length = _validate_integer(
		page_length,
		field_name="page_length",
		minimum=1,
		maximum=MAX_PAGE_LENGTH,
	)

	return {
		"start": validated_start,
		"page_length": validated_page_length,
	}


def _validate_filter_field(
	fieldname: Any,
	allowed_fields: list[str] | set[str] | tuple[str, ...],
) -> str:
	"""Ensure a filter refers to a field explicitly allowed by the caller."""
	if not isinstance(fieldname, str) or fieldname not in allowed_fields:
		frappe.throw(
			_("Filtering by this field is not allowed: {0}").format(fieldname),
			frappe.ValidationError,
		)

	return fieldname


def _validate_filter_value(
	operator: str,
	value: Any,
) -> Any:
	"""Validate filter operators and their operands."""
	operator = operator.lower().strip()

	if operator not in ALLOWED_FILTER_OPERATORS:
		frappe.throw(
			_("Unsupported filter operator: {0}").format(operator),
			frappe.ValidationError,
		)

	if operator in {"in", "not in", "between"}:
		if not isinstance(value, list | tuple):
			frappe.throw(
				_("The {0} operator requires a list of values.").format(operator),
				frappe.ValidationError,
			)

		if operator == "between" and len(value) != 2:
			frappe.throw(
				_("The between operator requires exactly two values."),
				frappe.ValidationError,
			)

		if operator != "between" and not 1 <= len(value) <= MAX_FILTER_ITEMS:
			frappe.throw(
				_("The {0} operator requires between 1 and {1} values.").format(
					operator,
					MAX_FILTER_ITEMS,
				),
				frappe.ValidationError,
			)

		for item in value:
			_validate_scalar_filter_value(item)

		return list(value)

	if operator == "is":
		if not isinstance(value, str) or value.lower() not in {
			"set",
			"not set",
		}:
			frappe.throw(
				_("The is operator requires 'set' or 'not set'."),
				frappe.ValidationError,
			)
		return value.lower()

	_validate_scalar_filter_value(value)

	if operator in {"like", "not like"} and not isinstance(value, str):
		frappe.throw(
			_("The {0} operator requires a string value.").format(operator),
			frappe.ValidationError,
		)

	return value


def _validate_scalar_filter_value(value: Any) -> None:
	"""Reject complex or excessively large filter values."""
	if isinstance(value, bool) or value is None:
		return

	if isinstance(value, int | float):
		return

	if isinstance(value, str):
		if len(value) > MAX_FILTER_VALUE_LENGTH:
			frappe.throw(
				_("A filter value exceeds the maximum allowed length."),
				frappe.ValidationError,
			)
		return

	frappe.throw(
		_("Filter values must be strings, numbers, booleans, or null."),
		frappe.ValidationError,
	)


def validate_filters(
	filters: Any,
	allowed_fields: list[str] | set[str] | tuple[str, ...],
) -> dict | list:
	"""Validate filter input before passing it to frappe.get_list().

	Accepted examples:

	    {"status": "Open"}

	    {"priority": [">=", 2]}

	    [["status", "=", "Open"]]

	    [["start_date", "between", ["2026-01-01", "2026-12-31"]]]

	The caller must pass fields that are already permitted for the user.
	"""
	filters = parse_json_input(
		filters,
		field_name="filters",
		expected_type=(dict, list),
		default={},
	)

	if isinstance(filters, dict):
		validated_filters = {}

		for fieldname, value in filters.items():
			fieldname = _validate_filter_field(
				fieldname,
				allowed_fields,
			)

			if isinstance(value, list | tuple):
				if len(value) != 2 or not isinstance(value[0], str):
					frappe.throw(
						_("A filter value list must contain " "an operator and its operand."),
						frappe.ValidationError,
					)

				operator = value[0]
				operand = _validate_filter_value(operator, value[1])

				if operator.lower().strip() == "=":
					validated_filters[fieldname] = operand
				else:
					validated_filters[fieldname] = [operator, operand]
			else:
				validated_filters[fieldname] = _validate_filter_value(
					"=",
					value,
				)

		return validated_filters

	validated_filters = []

	for item in filters:
		if not isinstance(item, list | tuple) or len(item) != 3:
			frappe.throw(
				_("Each filter must contain exactly " "a field, operator, and value."),
				frappe.ValidationError,
			)

		fieldname, operator, value = item

		fieldname = _validate_filter_field(
			fieldname,
			allowed_fields,
		)

		if not isinstance(operator, str):
			frappe.throw(
				_("Filter operators must be strings."),
				frappe.ValidationError,
			)

		operator = operator.lower().strip()
		value = _validate_filter_value(operator, value)

		validated_filters.append([fieldname, operator, value])

	return validated_filters


def validate_order_by(
	order_by: Any = None,
	allowed_fields: list[str] | set[str] | tuple[str, ...] = (),
	default_order_by: str = "modified desc",
) -> str:
	"""Validate a single-field sort expression.

	Only explicitly allowed fields and the configured system fields
	can be used. Multiple-field sort expressions are intentionally
	not accepted by this helper.
	"""
	if order_by is None or order_by == "":
		order_by = default_order_by

	if not isinstance(order_by, str):
		frappe.throw(
			_("order_by must be a string."),
			frappe.ValidationError,
		)

	match = re.fullmatch(
		r"\s*([A-Za-z_][A-Za-z0-9_]*)" r"(?:\s+(asc|desc))?\s*",
		order_by,
		flags=re.IGNORECASE,
	)

	if not match:
		frappe.throw(
			_("Invalid sort expression."),
			frappe.ValidationError,
		)

	fieldname = match.group(1)
	direction = (match.group(2) or "asc").lower()

	allowed_order_fields = set(allowed_fields) | SYSTEM_ORDER_FIELDS

	if fieldname not in allowed_order_fields:
		frappe.throw(
			_("Sorting by this field is not allowed: {0}").format(fieldname),
			frappe.ValidationError,
		)

	return f"{fieldname} {direction}"


def validate_search_term(value: Any) -> str | None:
	"""Normalize a search term and enforce its maximum length."""
	if value is None or value == "":
		return None

	if not isinstance(value, str):
		frappe.throw(
			_("Search term must be a string."),
			frappe.ValidationError,
		)

	value = value.strip()

	if not value:
		return None

	if len(value) > MAX_SEARCH_LENGTH:
		frappe.throw(
			_("Search term cannot exceed {0} characters.").format(MAX_SEARCH_LENGTH),
			frappe.ValidationError,
		)

	return value


def success_response(
	data: Any,
	message: str | None = None,
	pagination: dict | None = None,
) -> dict:
	"""Build a consistent success response for Memento API methods."""
	response = {
		"success": True,
		"data": data,
	}

	if message is not None:
		response["message"] = message

	if pagination is not None:
		response["pagination"] = pagination

	return response
