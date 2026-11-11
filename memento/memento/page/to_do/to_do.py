import html
import re

import frappe
from frappe import _
from frappe.utils import cint, get_fullname, now_datetime


def _check(doctype, name):
	# default anchor is the user's own User record, always allowed
	if doctype == "User" and name == frappe.session.user:
		return
	frappe.has_permission(doctype, "read", doc=name, throw=True)


def _plain(content):
	"""Comment content is HTML (quill). Reduce it to plain text for the page."""
	text = re.sub(r"<br\s*/?>|</p>|</div>", "\n", content or "")
	text = re.sub(r"<[^>]+>", "", text)
	return html.unescape(text).strip()


def _row(c):
	return {
		"name": c.name,
		"text": _plain(c.content),
		"owner": c.owner,
		"full_name": get_fullname(c.owner),
		"creation": c.creation,
		"todo_done": cint(c.get("todo_done")),
		"todo_done_on": c.get("todo_done_on"),
	}


def _load(name):
	c = frappe.db.get_value(
		"Comment",
		name,
		["name", "owner", "comment_type", "reference_doctype", "reference_name"],
		as_dict=True,
	)
	if not c or c.comment_type != "Comment":
		frappe.throw(_("Todo not found"), frappe.DoesNotExistError)
	_check(c.reference_doctype, c.reference_name)
	return c


@frappe.whitelist()
def get_todos(reference_doctype, reference_name):
	_check(reference_doctype, reference_name)
	rows = frappe.get_all(
		"Comment",
		filters={
			"comment_type": "Comment",
			"reference_doctype": reference_doctype,
			"reference_name": reference_name,
		},
		fields=["name", "content", "owner", "creation", "todo_done", "todo_done_on"],
		order_by="creation asc",
	)
	return [_row(r) for r in rows]


@frappe.whitelist()
def add_todo(reference_doctype, reference_name, text):
	_check(reference_doctype, reference_name)
	text = (text or "").strip()
	if not text:
		frappe.throw(_("Todo cannot be empty"))

	body = html.escape(text).replace("\n", "<br>")
	doc = frappe.get_doc(
		{
			"doctype": "Comment",
			"comment_type": "Comment",
			"reference_doctype": reference_doctype,
			"reference_name": reference_name,
			"comment_email": frappe.session.user,
			"comment_by": get_fullname(frappe.session.user),
			# same wrapper the standard comment box uses, so it also
			# renders correctly in the form's Activity timeline
			"content": f'<div class="ql-editor read-mode"><p>{body}</p></div>',
			"todo_done": 0,
		}
	)
	doc.insert(ignore_permissions=True)
	return _row(doc)


@frappe.whitelist()
def set_done(name, done):
	_load(name)
	done = cint(done)
	on = now_datetime() if done else None
	frappe.db.set_value("Comment", name, {"todo_done": done, "todo_done_on": on})
	return {"todo_done": done, "todo_done_on": on}


@frappe.whitelist()
def delete_todo(name):
	c = _load(name)
	if c.owner != frappe.session.user and "System Manager" not in frappe.get_roles():
		frappe.throw(_("You can only delete your own todos"), frappe.PermissionError)
	frappe.delete_doc("Comment", name, ignore_permissions=True, force=True)