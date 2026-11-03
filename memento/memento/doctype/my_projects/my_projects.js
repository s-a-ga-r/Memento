// Copyright (c) 2026, Sagar Patil and contributors
// For license information, please see license.txt

frappe.ui.form.on("My Projects", {
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

        const about_field = frm.get_field("about");

    
		$(about_field.wrapper).find("textarea").css({
            height: "60px",
            "min-height": "60px",
            "max-height": "60px",
        });
    },
});
