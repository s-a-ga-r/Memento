frappe.pages['projects-issues'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Projects Issues',
		single_column: true
	});
}