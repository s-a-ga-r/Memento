// Copyright (c) 2026, Sagar Patil and contributors
// For license information, please see license.txt

frappe.ui.form.on("Tasks", {
	setup(frm) {
		$("span.sidebar-toggle-btn").hide();
		$(".col-lg-2.layout-side-section").hide();
		frm.trigger("update_primary_action");
	},

	refresh(frm) {
        const description_field = frm.get_field("description");
        if (description_field && description_field.wrapper) {
            $(description_field.wrapper).find(".ql-editor").css({
                height: "1000px",
                minHeight: "600px",
            });
        }

        frm.trigger("update_primary_action");


        frm.$wrapper.on("change", () => {
            console.log("form changed");
            frm.trigger("update_primary_action");
        });


        if (frm.doc.status === "Completed") {
            frm.disable_form(); // then how to enable ? for that you can use frm.enable_form() method to enable the form again.
        }



        // if (frm.is_dirty()) {
		// 	console.log("for_month changed");
		// 	frm.page.set_primary_action(__("Save"), () => frm.save());
		// 	// frm.set_value("status", "Pending")
		// 	frm.enable_save();
		// }

        // frm.disable_save();

    
    },


    update_primary_action(frm){

        if (frm.is_dirty()) {
			// if (frm.doc.status === "Pending") {
			// 	frm.set_value("status", "Not Saved");
			// }
			console.log("form is dirty Save() gets activate");
			frm.page.set_primary_action(__("Save"), () => frm.save());
			frm.enable_save();
            // frm.refresh()
			return;
		}else{
            console.log("form is not dirty Save() gets deactivate");
		    frm.disable_save();
        }

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


    description(frm) {
		if (frm.is_dirty()) {
			console.log("description edited Save() gets activate");
			frm.page.set_primary_action(__("Save"), () => frm.save());
			// frm.set_value("status", "Pending")
			frm.enable_save();
		}
	},
});
