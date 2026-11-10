// Copyright (c) 2026, Sagar Patil and contributors
// For license information, please see license.txt

frappe.ui.form.on("Tasks", {
	setup(frm) {
		$("span.sidebar-toggle-btn").hide();
		$(".col-lg-2.layout-side-section").hide();
		// frm.trigger("update_primary_action");
	},

	refresh(frm) {
        const description_field = frm.get_field("description");
        if (description_field && description_field.wrapper) {
            $(description_field.wrapper).find(".ql-editor").css({
                height: "1000px",
                minHeight: "600px",
            });
        }
    },

    update_primary_action(frm) {
		if (frm.is_dirty()) {
			// if (frm.doc.status === "Pending") {
			// 	frm.set_value("status", "Not Saved");
			// }
			console.log("form is dirty Save() gets activate");
			frm.page.set_primary_action(__("Save"), () => frm.save());
			frm.enable_save();
			return;
		}
		frm.disable_save();
		if (frm.doc.status !== "Completed") {
			if (frm.is_new()) {
				let status_labels = {
                    "Open": __("Start Project"),
                    "Working": __("Continue Project"),
                    "Pending": __("Retry"),
                    "Completed": __("Completed"),
                    "Cancelled": __("Cancelled")
                };

                let label = status_labels[frm.doc.status] || __("Start");

                frm.page.set_primary_action(label);



			} else {
				console.log("Save for ");
				frm.page.set_primary_action(__("Save"), () => frm.save());
			}
		}
	},

});
