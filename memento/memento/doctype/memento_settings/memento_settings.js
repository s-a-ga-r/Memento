// Copyright (c) 2026, Sagar Patil and contributors
// For license information, please see license.txt

frappe.ui.form.on("Memento Settings", {
	refresh(frm) {

	},

    standerd(frm) {
        if (frm.doc.standerd) {
            frm.set_value("light", 0);
            frm.set_value("darker", 0);
        }
    },

    light(frm) {
        if (frm.doc.light) {
            frm.set_value("standerd", 0);
            frm.set_value("darker", 0);
        }
    },

    darker(frm) {
        if (frm.doc.darker) {
            frm.set_value("standerd", 0);
            frm.set_value("light", 0);
        }
    }
});
