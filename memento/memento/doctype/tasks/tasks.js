// Copyright (c) 2026, Sagar Patil and contributors
// For license information, please see license.txt

frappe.ui.form.on("Tasks", {
	setup(frm) {
		$("span.sidebar-toggle-btn").hide();
		$(".col-lg-2.layout-side-section").hide();
		frm.trigger("update_primary_action");
	},

	refresh(frm) {
        // frm.trigger("update_primary_action");
        const description_field = frm.get_field("description");
        if (description_field && description_field.wrapper) {
            $(description_field.wrapper).find(".ql-editor").css({
                height: "1000px",
                minHeight: "600px",
            });
        }

        if (frm.doc.status === "Completed") {
            frm.disable_form();
        }

        frm.disable_save();

        let status_actions = {
            "Open": __("Open"),
            "Working": __("Working"),
            "Pending": __("Pending"),
            "Completed": __("Completed"),
            "Cancelled": __("Cancelled")
        };

        Object.keys(status_actions).forEach(status => {

            if (frm.doc.status !== status) {
                frm.page.add_action_item(
                    status_actions[status],
                    () => {
                        frm.events.change_project_status(frm, status);
                    }
                );
            }

        });
    
    },

    change_project_status(frm, status) {

        frappe.confirm(
            __("Are you sure you want to change the project status to {0}?", [status]),
            () => {

                frm.set_value("status", status);

                frm.save();
            }
        );

    },
});
