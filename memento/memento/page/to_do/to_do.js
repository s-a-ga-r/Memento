// frappe.pages['to-do'].on_page_load = function(wrapper) {
// 	new ToDo(wrapper);
// }

// class ToDo{

// 	constructor(wrapper) {
//         this.wrapper = wrapper;
//         this.init();
//     }

	

// 	async init() {
//         this.page = frappe.ui.make_app_page({
//             parent: this.wrapper,
//             title: 'ToDo',
//             single_column: true
//         })

// 		this.theme = await frappe.xcall("memento.api.get_theme");
// 		this.last_theme = "todo"

// 		console.log("init : ",this.theme);
		


//         this.renderT();
// 		// await this.theTheme() // wait here
		
// 		this.getTodos()
// 		this.standerd()
// 		this.light()
// 		this.darker()
// 		// this.changeTheme()
// 		this.deletecheck()
// 		this.addToDo()
//     }

	
// 	renderT() {
//         localStorage.clear();

//         //  this.page-head flex.empty();
//          $('footer').remove();
//          $('#build-events-overlay').remove()
//         //   $('#body').remove()

//         $(".page-head").html("")

// 		let header = `<div id = "header">
// 				<div class="flexrow-container">
// 					<div class="standard-theme theme-selector"></div>
// 					<div class="light-theme theme-selector"></div>
// 					<div class="darker-theme theme-selector"></div>
// 				</div>
// 				<h1 id="title">Just do it.<div id="border"></div></h1>
// 			</div>
// 		`

// 		$(".page-head").append(header)

// 		let form= `<div id="form">
// 			<form>
// 				<input class="todo-input" type="text" placeholder="Add a task.">
// 				<button class="todo-btn" type="submit">To Do</button>
// 			</form>
// 		</div>`

// 		$(".page-body").append(form)

// 		let unorder_list = `<div id="myUnOrdList">
// 			<ul class="todo-list">
// 				<!-- (Basic Format)
// 				<div class="todo">
// 					items added to this list:
// 					<li></li>
// 					<button>delete</button>
// 					<button>check</button>
// 				</div> -->
// 			</ul>
// 		</div>`
// 		$(".page-content").append(unorder_list)
//     }



	
// 	addToDo(){
// 		console.log("addToDo : ",this.theme);
		
// 		let self = this
// 		const toDoInput = document.querySelector('.todo-input');
// 		const toDoList = document.querySelector('.todo-list');
// 		// let savedTheme = localStorage.getItem('savedTheme');  this.theme

// 		// console.log("the theme",savedTheme);
		
// 		self.changeTheme(this.theme)

// 		$(document).on("click", ".todo-btn", function (event) {
// 			event.preventDefault();
// 			console.log("hello and the theme", self.theme);
// 			console.log("and last theme is", self.last_theme);


// 			const toDoDiv = document.createElement("div");
//     		toDoDiv.classList.add('todo', `${self.theme}-todo`);
// 			// Create LI
//     		const newToDo = document.createElement('li');

// 			if (toDoInput.value === '') {
// 					alert("You must write something!");
// 				} 
// 			else {
// 				// newToDo.innerText = "hey";
// 				newToDo.innerText = toDoInput.value;
// 				newToDo.classList.add('todo-item');
// 				toDoDiv.appendChild(newToDo);

// 				// Adding to local storage;
// 				self.savelocal(toDoInput.value);

// 				// check btn;
// 				const checked = document.createElement('button');
// 				checked.innerHTML = '<i class="fas fa-check"></i>';
// 				checked.classList.add('check-btn', `${self.theme}-button`);
// 				toDoDiv.appendChild(checked);
// 				// delete btn;
// 				const deleted = document.createElement('button');
// 				deleted.innerHTML = '<i class="fas fa-trash"></i>';
// 				deleted.classList.add('delete-btn', `${self.theme}-button`);
// 				toDoDiv.appendChild(deleted);

// 				console.log("todo div",toDoDiv);
				

// 				// Append to list;
// 				toDoList.appendChild(toDoDiv);

// 				// CLearing the input;
// 				toDoInput.value = '';
// 			}
// 		})
// 	}

// 	standerd(){
// 		let self = this
// 		$(document).on("click", ".standard-theme", function (event) {
// 			console.log("clicked standard");
// 			self.changeTheme("standard")
// 		})
// 	}

// 	light(){
// 		let self = this
// 		$(document).on("click", ".light-theme", function (event) {
// 			console.log("clicked light");
// 			self.changeTheme("light")
// 		})
// 	}

// 	darker(){
// 		let self = this
// 		$(document).on("click", ".darker-theme", function (event) {
// 			console.log("clicked darker");
// 			self.changeTheme("darker")
// 		})
// 	}

// 	deletecheck(){
// 		let self = this
// 		$(document).on("click", ".todo-list", function (event) {
// 			console.log("delete check");

// 			const item = event.target;

// 			// delete
// 			if(item.classList[0] === 'delete-btn')
// 			{
// 				// item.parentElement.remove();
// 				// animation
// 				item.parentElement.classList.add("fall");

// 				//removing local todos;
// 				self.removeLocalTodos(item.parentElement);

// 				item.parentElement.addEventListener('transitionend', function(){
// 					item.parentElement.remove();
// 				})
// 			}

// 			// check
// 			if(item.classList[0] === 'check-btn')
// 			{
// 				item.parentElement.classList.toggle("completed");
// 			}
// 		})
// 	}

// 	savelocal(todo){
// 		console.log("inside todod");
		
// 		let todos;
// 		if(localStorage.getItem('todos') === null) {
// 			todos = [];
// 		}
// 		else {
// 			todos = JSON.parse(localStorage.getItem('todos'));
// 		}
// 		todos.push(todo);
// 		localStorage.setItem('todos', JSON.stringify(todos));
// 	}

// 	getTodos() {
// 		//Check: if item/s are there;
// 		console.log("inside get todos");
		
// 		let todos;
// 		if(localStorage.getItem('todos') === null) {
// 			todos = [];
// 		}
// 		else {
// 			todos = JSON.parse(localStorage.getItem('todos'));

// 			console.log("todos",todos);
// 			console.log("savedTheme",savedTheme);
// 		}

// 		todos.forEach(function(todo) {
// 			// toDo DIV;
// 			const toDoDiv = document.createElement("div");
// 			toDoDiv.classList.add("todo",`${savedTheme}-todo`);

// 			// Create LI
// 			const newToDo = document.createElement('li');
			
// 			newToDo.innerText = todo;
// 			newToDo.classList.add('todo-item');
// 			toDoDiv.appendChild(newToDo);

// 			// check btn;
// 			const checked = document.createElement('button');
// 			checked.innerHTML = '<i class="fas fa-check"></i>';
// 			checked.classList.add("check-btn", `${savedTheme}-button`);
// 			toDoDiv.appendChild(checked);
// 			// delete btn;
// 			const deleted = document.createElement('button');
// 			deleted.innerHTML = '<i class="fas fa-trash"></i>';
// 			deleted.classList.add("delete-btn", `${savedTheme}-button`);
// 			toDoDiv.appendChild(deleted);
// 			// Append to list;
// 			toDoList.appendChild(toDoDiv);
// 		});
// 	}

// 	removeLocalTodos(todo){
// 		//Check: if item/s are there;
// 		let todos;
// 		if(localStorage.getItem('todos') === null) {
// 			todos = [];
// 		}
// 		else {
// 			todos = JSON.parse(localStorage.getItem('todos'));
// 		}

// 		const todoIndex =  todos.indexOf(todo.children[0].innerText);
// 		// console.log(todoIndex);
// 		todos.splice(todoIndex, 1);
// 		// console.log(todos);
// 		localStorage.setItem('todos', JSON.stringify(todos));
// 	}

// 	changeTheme(color) {
// 		// localStorage.setItem('savedTheme', color);
// 		// let savedTheme = localStorage.getItem('savedTheme');

// 		console.log("changeTheme : ",color);
// 		console.log("last_theme",this.last_theme);

// 		let class_name = `.${this.last_theme}-input`

// 		console.log("class_name",class_name);
		

// 		document.body.className = color;
// 		// Change blinking cursor for darker theme:
// 		color === 'darker' ? 
// 			document.getElementById('title').classList.add('darker-title')
// 			: document.getElementById('title').classList.remove('darker-title');

// 		console.log(`${color}-input`);

// 		document.querySelector(class_name).className = `${color}-input`;

		

// 		console.log("last_theme was ",this.last_theme);


// 		this.last_theme  = color

// 		// Change todo color without changing their status (completed or not):
// 		document.querySelectorAll('.todo').forEach(todo => {
// 			Array.from(todo.classList).some(item => item === 'completed') ? 
// 				todo.className = `todo ${color}-todo completed`
// 				: todo.className = `todo ${color}-todo`;
// 		});
// 		// Change buttons color according to their type (todo, check or delete):
// 		document.querySelectorAll('button').forEach(button => {
// 			Array.from(button.classList).some(item => {
// 				console.log("item",item);
				
// 				if (item === 'check-btn') {
// 				button.className = `check-btn ${color}-button`;  
// 				} else if (item === 'delete-btn') {
// 					button.className = `delete-btn ${color}-button`; 
// 				} else if (item === 'todo-btn') {
// 					button.className = `todo-btn ${color}-button`;
// 				}
// 			});
// 		});
// 	}

// }


// Change this to your app / module / page path
const TODO_API = "memento.memento.page.to_do.to_do";

frappe.pages["to-do"].on_page_load = function (wrapper) {
	wrapper.todo = new TodoComments(wrapper);
};

frappe.pages["to-do"].on_page_show = function (wrapper) {
	wrapper.todo && wrapper.todo.refresh();
};

class TodoComments {
	constructor(wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Todo"),
			single_column: true,
		});
		this.items = [];
		this.filter = "All";
		this.make();
	}

	make() {
		this.page.add_field({
			fieldname: "filter",
			label: __("Show"),
			fieldtype: "Select",
			options: ["All", "Open", "Done"],
			default: "All",
			change: () => {
				this.filter = this.page.fields_dict.filter.get_value() || "All";
				this.render();
			},
		});
		this.page.set_secondary_action(__("Refresh"), () => this.load(), "refresh");

		this.$wrap = $(`
			<div class="tc-wrap">
				<div class="tc-list"></div>
				<div class="tc-input">
					<textarea class="form-control" rows="1"
						placeholder="${__("Add a todo... (Enter to add, Shift+Enter for new line)")}"></textarea>
					<button class="btn btn-primary btn-sm tc-add">${__("ToDo")}</button>
				</div>
			</div>
		`).appendTo(this.page.main);

		this.$list = this.$wrap.find(".tc-list");
		this.$input = this.$wrap.find("textarea");

		this.$wrap.find(".tc-add").on("click", () => this.add());
		this.$input.on("keydown", (e) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				this.add();
			}
		});
		this.$input.on("input", (e) => {
			e.target.style.height = "auto";
			e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
		});

		this.$list.on("change", ".tc-check", (e) => {
			const name = $(e.currentTarget).closest(".tc-item").data("name");
			this.toggle(name, e.currentTarget.checked);
		});
		this.$list.on("click", ".tc-del", (e) => {
			const name = $(e.currentTarget).closest(".tc-item").data("name");
			frappe.confirm(__("Delete this todo?"), () => this.remove(name));
		});
	}

	resolve_ref() {
		// /app/todo-comments            -> your own list (on your User record)
		// /app/todo-comments/Project/P1 -> list on any document
		const route = frappe.get_route();
		const mine = route.length < 3;
		this.ref = mine
			? { dt: "User", dn: frappe.session.user }
			: { dt: route[1], dn: route[2] };
		this.page.set_title(mine ? __("My Todos") : `${__("Todos")}: ${this.ref.dn}`);
	}

	refresh() {
		this.resolve_ref();
		const key = `${this.ref.dt}/${this.ref.dn}`;
		// on_page_show can fire right after on_page_load; skip the duplicate fetch
		if (key === this._key && Date.now() - this._at < 500) return;
		this._key = key;
		this._at = Date.now();
		this.load();
	}

	load() {
		return frappe
			.call({
				method: `${TODO_API}.get_todos`,
				args: { reference_doctype: this.ref.dt, reference_name: this.ref.dn },
			})
			.then((r) => {
				this.items = r.message || [];
				this.render(true);
			});
	}

	render(scroll_bottom) {
		const list = this.$list[0];
		const prev = list.scrollTop;
		const show = (i) =>
			this.filter === "All" || (this.filter === "Done" ? i.todo_done : !i.todo_done);
		const rows = this.items.filter(show);

		this.$list.empty();
		if (!rows.length) {
			this.$list.append(`<div class="tc-empty text-muted">${__("Nothing here yet")}</div>`);
		}
		rows.forEach((r) => this.$list.append(this.row_html(r)));

		const done = this.items.filter((i) => i.todo_done).length;
		if (this.items.length) {
			this.page.set_indicator(
				`${done}/${this.items.length} ${__("done")}`,
				done === this.items.length ? "green" : "orange"
			);
		} else {
			this.page.clear_indicator();
		}

		list.scrollTop = scroll_bottom ? list.scrollHeight : prev;
	}

	row_html(r) {
		const text = frappe.utils.escape_html(r.text).replace(/\n/g, "<br>");
		const done_on = r.todo_done && r.todo_done_on
			? ` · ${__("done")} ${frappe.datetime.comment_when(r.todo_done_on)}`
			: "";
		return `
			<div class="tc-item ${r.todo_done ? "done" : ""}" data-name="${r.name}">
				<input type="checkbox" class="tc-check" ${r.todo_done ? "checked" : ""}>
				<div class="tc-body">
					<div class="tc-text">${text}</div>
					<div class="tc-meta">
						${frappe.utils.escape_html(r.full_name)} · ${frappe.datetime.comment_when(r.creation)}${done_on}
					</div>
				</div>
				<button class="btn btn-xs btn-link tc-del" title="${__("Delete")}">&times;</button>
			</div>`;
	}

	add() {
		const text = this.$input.val().trim();
		if (!text) return;
		this.$input.val("").trigger("input");
		frappe
			.call({
				method: `${TODO_API}.add_todo`,
				args: {
					reference_doctype: this.ref.dt,
					reference_name: this.ref.dn,
					text,
				},
			})
			.then((r) => {
				this.items.push(r.message);
				if (this.filter === "Done") {
					this.page.fields_dict.filter.set_value("All");
				}
				this.render(true);
			});
	}

	toggle(name, checked) {
		const item = this.items.find((i) => i.name === name);
		if (!item) return;
		item.todo_done = checked ? 1 : 0;
		this.render();
		frappe
			.call({ method: `${TODO_API}.set_done`, args: { name, done: item.todo_done } })
			.then((r) => {
				Object.assign(item, r.message);
				this.render();
			})
			.catch(() => {
				item.todo_done = checked ? 0 : 1;
				this.render();
			});
	}

	remove(name) {
		frappe.call({ method: `${TODO_API}.delete_todo`, args: { name } }).then(() => {
			this.items = this.items.filter((i) => i.name !== name);
			this.render();
		});
	}
}

