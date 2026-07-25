frappe.pages['to-do'].on_page_load = function(wrapper) {
	new ToDo(wrapper);
}

class ToDo{

	constructor(wrapper) {
        this.wrapper = wrapper;
        this.init();
    }

	

	async init() {
        this.page = frappe.ui.make_app_page({
            parent: this.wrapper,
            title: 'ToDo',
            single_column: true
        })

		this.theme = await frappe.xcall("memento.api.get_theme");
		this.last_theme = "todo"

		console.log("init : ",this.theme);
		


        this.renderT();
		// await this.theTheme() // wait here
		
		this.getTodos()
		this.standerd()
		this.light()
		this.darker()
		// this.changeTheme()
		this.deletecheck()
		this.addToDo()
    }

	
	renderT() {
        localStorage.clear();

        //  this.page-head flex.empty();
         $('footer').remove();
         $('#build-events-overlay').remove()
        //   $('#body').remove()

        $(".page-head").html("")

		let header = `<div id = "header">
				<div class="flexrow-container">
					<div class="standard-theme theme-selector"></div>
					<div class="light-theme theme-selector"></div>
					<div class="darker-theme theme-selector"></div>
				</div>
				<h1 id="title">Just do it.<div id="border"></div></h1>
			</div>
		`

		$(".page-head").append(header)

		let form= `<div id="form">
			<form>
				<input class="todo-input" type="text" placeholder="Add a task.">
				<button class="todo-btn" type="submit">To Do</button>
			</form>
		</div>`

		$(".page-body").append(form)

		let unorder_list = `<div id="myUnOrdList">
			<ul class="todo-list">
				<!-- (Basic Format)
				<div class="todo">
					items added to this list:
					<li></li>
					<button>delete</button>
					<button>check</button>
				</div> -->
			</ul>
		</div>`
		$(".page-content").append(unorder_list)
    }



	
	addToDo(){
		console.log("addToDo : ",this.theme);
		
		let self = this
		const toDoInput = document.querySelector('.todo-input');
		const toDoList = document.querySelector('.todo-list');
		// let savedTheme = localStorage.getItem('savedTheme');  this.theme

		// console.log("the theme",savedTheme);
		
		self.changeTheme(this.theme)

		$(document).on("click", ".todo-btn", function (event) {
			event.preventDefault();
			console.log("hello and the theme", self.theme);
			console.log("and last theme is", self.last_theme);


			const toDoDiv = document.createElement("div");
    		toDoDiv.classList.add('todo', `${self.theme}-todo`);
			// Create LI
    		const newToDo = document.createElement('li');

			if (toDoInput.value === '') {
					alert("You must write something!");
				} 
			else {
				// newToDo.innerText = "hey";
				newToDo.innerText = toDoInput.value;
				newToDo.classList.add('todo-item');
				toDoDiv.appendChild(newToDo);

				// Adding to local storage;
				self.savelocal(toDoInput.value);

				// check btn;
				const checked = document.createElement('button');
				checked.innerHTML = '<i class="fas fa-check"></i>';
				checked.classList.add('check-btn', `${self.theme}-button`);
				toDoDiv.appendChild(checked);
				// delete btn;
				const deleted = document.createElement('button');
				deleted.innerHTML = '<i class="fas fa-trash"></i>';
				deleted.classList.add('delete-btn', `${self.theme}-button`);
				toDoDiv.appendChild(deleted);

				console.log("todo div",toDoDiv);
				

				// Append to list;
				toDoList.appendChild(toDoDiv);

				// CLearing the input;
				toDoInput.value = '';
			}
		})
	}

	standerd(){
		let self = this
		$(document).on("click", ".standard-theme", function (event) {
			console.log("clicked standard");
			self.changeTheme("standard")
		})
	}

	light(){
		let self = this
		$(document).on("click", ".light-theme", function (event) {
			console.log("clicked light");
			self.changeTheme("light")
		})
	}

	darker(){
		let self = this
		$(document).on("click", ".darker-theme", function (event) {
			console.log("clicked darker");
			self.changeTheme("darker")
		})
	}

	deletecheck(){
		let self = this
		$(document).on("click", ".todo-list", function (event) {
			console.log("delete check");

			const item = event.target;

			// delete
			if(item.classList[0] === 'delete-btn')
			{
				// item.parentElement.remove();
				// animation
				item.parentElement.classList.add("fall");

				//removing local todos;
				self.removeLocalTodos(item.parentElement);

				item.parentElement.addEventListener('transitionend', function(){
					item.parentElement.remove();
				})
			}

			// check
			if(item.classList[0] === 'check-btn')
			{
				item.parentElement.classList.toggle("completed");
			}
		})
	}

	savelocal(todo){
		console.log("inside todod");
		
		let todos;
		if(localStorage.getItem('todos') === null) {
			todos = [];
		}
		else {
			todos = JSON.parse(localStorage.getItem('todos'));
		}
		todos.push(todo);
		localStorage.setItem('todos', JSON.stringify(todos));
	}

	getTodos() {
		//Check: if item/s are there;
		console.log("inside get todos");
		
		let todos;
		if(localStorage.getItem('todos') === null) {
			todos = [];
		}
		else {
			todos = JSON.parse(localStorage.getItem('todos'));

			console.log("todos",todos);
			console.log("savedTheme",savedTheme);
		}

		todos.forEach(function(todo) {
			// toDo DIV;
			const toDoDiv = document.createElement("div");
			toDoDiv.classList.add("todo",`${savedTheme}-todo`);

			// Create LI
			const newToDo = document.createElement('li');
			
			newToDo.innerText = todo;
			newToDo.classList.add('todo-item');
			toDoDiv.appendChild(newToDo);

			// check btn;
			const checked = document.createElement('button');
			checked.innerHTML = '<i class="fas fa-check"></i>';
			checked.classList.add("check-btn", `${savedTheme}-button`);
			toDoDiv.appendChild(checked);
			// delete btn;
			const deleted = document.createElement('button');
			deleted.innerHTML = '<i class="fas fa-trash"></i>';
			deleted.classList.add("delete-btn", `${savedTheme}-button`);
			toDoDiv.appendChild(deleted);
			// Append to list;
			toDoList.appendChild(toDoDiv);
		});
	}

	removeLocalTodos(todo){
		//Check: if item/s are there;
		let todos;
		if(localStorage.getItem('todos') === null) {
			todos = [];
		}
		else {
			todos = JSON.parse(localStorage.getItem('todos'));
		}

		const todoIndex =  todos.indexOf(todo.children[0].innerText);
		// console.log(todoIndex);
		todos.splice(todoIndex, 1);
		// console.log(todos);
		localStorage.setItem('todos', JSON.stringify(todos));
	}

	changeTheme(color) {
		// localStorage.setItem('savedTheme', color);
		// let savedTheme = localStorage.getItem('savedTheme');

		console.log("changeTheme : ",color);
		console.log("last_theme",this.last_theme);

		let class_name = `.${this.last_theme}-input`

		console.log("class_name",class_name);
		

		document.body.className = color;
		// Change blinking cursor for darker theme:
		color === 'darker' ? 
			document.getElementById('title').classList.add('darker-title')
			: document.getElementById('title').classList.remove('darker-title');

		console.log(`${color}-input`);

		document.querySelector(class_name).className = `${color}-input`;

		

		console.log("last_theme was ",this.last_theme);


		this.last_theme  = color

		// Change todo color without changing their status (completed or not):
		document.querySelectorAll('.todo').forEach(todo => {
			Array.from(todo.classList).some(item => item === 'completed') ? 
				todo.className = `todo ${color}-todo completed`
				: todo.className = `todo ${color}-todo`;
		});
		// Change buttons color according to their type (todo, check or delete):
		document.querySelectorAll('button').forEach(button => {
			Array.from(button.classList).some(item => {
				console.log("item",item);
				
				if (item === 'check-btn') {
				button.className = `check-btn ${color}-button`;  
				} else if (item === 'delete-btn') {
					button.className = `delete-btn ${color}-button`; 
				} else if (item === 'todo-btn') {
					button.className = `todo-btn ${color}-button`;
				}
			});
		});
	}

}

