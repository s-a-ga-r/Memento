frappe.pages['todo-2'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'None',
		single_column: true
	});
}



frappe.pages["todo-2"].on_page_load = function (wrapper) {
    new MementoTodos(wrapper);
};


class MementoTodos {

    constructor(wrapper) {

        this.wrapper = $(wrapper);

        this.page = frappe.ui.make_app_page({
            parent: wrapper,
            title: __("ToDo's"),
            single_column: true
        });

        this.todos = [];
        this.filter = "All";

        this.make_layout();
        this.bind_events();
        this.load_todos();
    }


    make_layout() {

        this.page.main.html(`
            <div class="memento-todos">

                <div class="todo-header">

                    <div>
                        <h2>My Tasks</h2>
                        <p>Small steps. Consistent progress.</p>
                    </div>

                    <div class="todo-header-icon">
                        <i class="fa fa-check-square-o"></i>
                    </div>

                </div>


                <div class="todo-stats">

                    <div class="todo-stat">
                        <span class="stat-value" id="total-tasks">0</span>
                        <span class="stat-label">All Tasks</span>
                    </div>

                    <div class="todo-stat">
                        <span class="stat-value" id="pending-tasks">0</span>
                        <span class="stat-label">Pending</span>
                    </div>

                    <div class="todo-stat">
                        <span class="stat-value" id="completed-tasks">0</span>
                        <span class="stat-label">Completed</span>
                    </div>

                </div>


                <div class="todo-toolbar">

                    <div class="todo-filters">

                        <button class="todo-filter active"
                            data-filter="All">
                            All
                        </button>

                        <button class="todo-filter"
                            data-filter="Open">
                            Pending
                        </button>

                        <button class="todo-filter"
                            data-filter="Closed">
                            Completed
                        </button>

                    </div>

                    <button class="todo-refresh">
                        <i class="fa fa-refresh"></i>
                    </button>

                </div>


                <div class="todo-timeline-wrapper">

                    <div class="todo-timeline" id="todo-timeline">

                        <div class="todo-loading">
                            Loading your tasks...
                        </div>

                    </div>

                </div>


                <div class="todo-composer">

                    <div class="composer-indicator"></div>

                    <div class="composer-content">

                        <textarea
                            id="todo-input"
                            placeholder="Write something you want to accomplish..."
                            rows="2">
                        </textarea>

                        <div class="composer-footer">

                            <span class="composer-hint">
                                Press Ctrl + Enter to add
                            </span>

                            <button class="add-todo-btn">
                                <span>Add Task</span>
                                <i class="fa fa-arrow-up"></i>
                            </button>

                        </div>

                    </div>

                </div>

            </div>
        `);
    }


    bind_events() {

        const main = this.page.main;

        main.on("click", ".add-todo-btn", () => {
            this.create_todo();
        });


        main.on("keydown", "#todo-input", (e) => {

            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                this.create_todo();
            }

        });


        main.on("click", ".todo-filter", (e) => {

            this.filter = $(e.currentTarget).data("filter");

            main.find(".todo-filter").removeClass("active");

            $(e.currentTarget).addClass("active");

            this.render_todos();

        });


        main.on("click", ".todo-refresh", () => {
            this.load_todos();
        });


        main.on("change", ".todo-checkbox", (e) => {

            const checkbox = $(e.currentTarget);

            const name = checkbox.data("name");

            const status = checkbox.is(":checked")
                ? "Closed"
                : "Open";

            this.update_status(name, status, checkbox);

        });

    }


    async load_todos() {

        try {

            const response = await frappe.call({
                method: "memento.memento.page.memento_todos.memento_todos.get_my_todos"
            });

            this.todos = response.message || [];

            this.render_todos();

            this.update_stats();

        } catch (error) {

            frappe.msgprint(
                __("Unable to load your tasks.")
            );

        }

    }


    async create_todo() {

        const input = this.page.main.find("#todo-input");

        const description = input.val().trim();

        if (!description) {

            frappe.show_alert({
                message: __("Please enter a task."),
                indicator: "orange"
            });

            input.focus();

            return;
        }


        const button = this.page.main.find(".add-todo-btn");

        button.prop("disabled", true);


        try {

            await frappe.call({
                method: "memento.memento.page.memento_todos.memento_todos.create_todo",
                args: {
                    description: description
                }
            });

            input.val("");

            await this.load_todos();

            this.scroll_to_bottom();

            input.focus();

            frappe.show_alert({
                message: __("Task added successfully."),
                indicator: "green"
            });

        } catch (error) {

            // Frappe displays the server error.

        } finally {

            button.prop("disabled", false);

        }

    }


    async update_status(name, status, checkbox) {

        checkbox.prop("disabled", true);

        try {

            await frappe.call({
                method: "memento.memento.page.memento_todos.memento_todos.update_todo_status",
                args: {
                    name: name,
                    status: status
                }
            });

            await this.load_todos();

            frappe.show_alert({
                message: status === "Closed"
                    ? __("Task completed!")
                    : __("Task reopened."),
                indicator: "green"
            });

        } catch (error) {

            // Restore the checkbox if the update fails.
            checkbox.prop("checked", status !== "Closed");

        } finally {

            checkbox.prop("disabled", false);

        }

    }


    update_stats() {

        const active = this.todos.filter(
            todo => todo.status !== "Cancelled"
        );

        const pending = active.filter(
            todo => todo.status === "Open"
        ).length;

        const completed = active.filter(
            todo => todo.status === "Closed"
        ).length;


        this.page.main.find("#total-tasks").text(active.length);

        this.page.main.find("#pending-tasks").text(pending);

        this.page.main.find("#completed-tasks").text(completed);

    }


    render_todos() {

        const timeline = this.page.main.find("#todo-timeline");

        let filtered = this.todos.filter(todo => {

            if (todo.status === "Cancelled") {
                return false;
            }

            if (this.filter === "All") {
                return true;
            }

            return todo.status === this.filter;

        });


        if (!filtered.length) {

            timeline.html(`
                <div class="todo-empty">

                    <div class="empty-icon">
                        <i class="fa fa-check-circle-o"></i>
                    </div>

                    <h4>Nothing here yet</h4>

                    <p>Your tasks will appear here.</p>

                </div>
            `);

            return;
        }


        const html = filtered.map(todo => {

            const completed = todo.status === "Closed";

            const description = frappe.utils.escape_html(
                todo.description || ""
            );

            const created = todo.creation
                ? frappe.datetime.str_to_user(todo.creation)
                : "";


            return `
                <div class="todo-item ${completed ? "completed" : ""}">

                    <div class="todo-item-check">

                        <input
                            type="checkbox"
                            class="todo-checkbox"
                            data-name="${todo.name}"
                            ${completed ? "checked" : ""}
                        >

                    </div>

                    <div class="todo-item-content">

                        <div class="todo-description">
                            ${description}
                        </div>

                        <div class="todo-item-meta">

                            <span>
                                <i class="fa fa-clock-o"></i>
                                ${frappe.utils.escape_html(created)}
                            </span>

                            <span class="todo-status-label">
                                ${completed ? "Completed" : "Pending"}
                            </span>

                        </div>

                    </div>

                </div>
            `;

        }).join("");


        timeline.html(html);

        this.scroll_to_bottom();

    }


    scroll_to_bottom() {

        const timeline = this.page.main.find("#todo-timeline");

        timeline.stop().animate({
            scrollTop: timeline[0].scrollHeight
        }, 250);

    }

}
