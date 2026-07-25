import frappe


@frappe.whitelist()
def get_theme():
    standerd = frappe.db.get_single_value("Memento Settings", "standerd")
    light = frappe.db.get_single_value("Memento Settings", "light")
    darker = frappe.db.get_single_value("Memento Settings", "darker")

    theme = None

    if standerd:
        theme = "standerd"
    if light:
        theme = "theme"
    if darker:
        theme = "darker"


    return theme

