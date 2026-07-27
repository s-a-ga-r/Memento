frappe.pages["projec-track"].on_page_load = function (wrapper) {
  new Projects(wrapper);
};

// frappe.pages['task-blogging-v2'].on_page_load = function (wrapper) {
//     new TaskBlogApp(wrapper);
// }

class Projects {
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.init();
  }

  init() {
    this.page = frappe.ui.make_app_page({
      parent: this.wrapper,
      title: "ProjecTrack",
      single_column: true,
    });
    this.renderTemplate();
  }

  renderTemplate() {
    console.log("renderTemplate Called");
    localStorage.clear();

    //  this.page-head flex.empty();
    $("footer").remove();
    $("#build-events-overlay").remove();
    //   $('#body').remove()

    $(".page-head").html("");
    $(frappe.render_template("projec_track", {})).appendTo(this.page.main);
    this.projects = JSON.parse(localStorage.getItem("ProjectPosts") || "[]");
    this.posts = JSON.parse(localStorage.getItem("blogPosts") || "[]");
    this.selectedPriority = "medium";
    this.currentFilter = "all";
    this.currentProjectId = null;
    this.initSampleData();
    this.renderProjects();
    this.updateStats();
    this.bindEvents();
    this.createProject();
    this.closeCreateProject();
    this.deleteProject();
    this.closeViewer();
    // this.openProject()
  }

  initSampleData() {
    let self = this;
    if (this.projects.length === 111) {
      this.projects = [
        {
          id: 1,
          title: "Complete Django Tutorial Series",
          description:
            "My latest task! This is exciting...\n\nThis will be a good overview of how to use the Django framework. I hope to learn a lot and enjoy the series!\n\nThe tutorial covers:\n- Setting up Django environment\n- Creating models and views\n- Working with templates\n- Database migrations\n- User authentication\n- Deployment strategies\n\nI plan to build a small project alongside the tutorial to practice what I learn.",
          category: "learning",
          priority: "high",
          status: "in-progress",
          startTime: "2024-08-27T09:00",
          endTime: "2024-08-27T11:00",
          createdAt: new Date("2024-08-27").toISOString(),
          author: "TaskUser",
        },
        {
          id: 2,
          title: "Research Top 5 YouTube Channels For Learning Programming",
          description:
            "Find the best programming channels on YouTube. Need to evaluate content quality, teaching style, and community engagement.\n\nThis will help me plan my learning path for the next months.\n\nChannels to research:\n- FreeCodeCamp\n- The Net Ninja\n- Traversy Media\n- Programming with Mosh\n- Corey Schafer\n\nCriteria for evaluation:\n- Content quality and accuracy\n- Teaching methodology\n- Community engagement\n- Regular updates\n- Beginner-friendly approach",
          category: "work",
          priority: "medium",
          status: "completed",
          startTime: "2024-08-26T14:00",
          endTime: "2024-08-26T16:00",
          createdAt: new Date("2024-08-26").toISOString(),
          author: "TaskUser",
        },
        {
          id: 3,
          title: "Data Science Project Planning",
          description:
            "Plan the next data science project. Need to define scope, timeline, and required resources.\n\nThis project will focus on analyzing user behavior patterns and creating predictive models.\n\nProject phases:\n1. Data collection and cleaning\n2. Exploratory data analysis\n3. Feature engineering\n4. Model development\n5. Model evaluation\n6. Deployment and monitoring\n\nExpected outcomes:\n- Improved user engagement metrics\n- Better understanding of user patterns\n- Predictive capabilities for user behavior",
          category: "project",
          priority: "high",
          status: "pending",
          startTime: "2024-08-26T10:00",
          endTime: "2024-08-26T12:00",
          createdAt: new Date("2024-08-26").toISOString(),
          author: "TaskUser",
        },
      ];
    }
    if (this.posts.length === 111) {
      this.posts = [
        {
          id: 1,
          author: "CoreyMS",
          title: "My Latest Post!",
          content:
            "My latest post! This is exciting...\n\nThis will be a good overview of how to use the Django framework. I hope you all learn a lot and enjoy the series!",
          date: "August 27, 2018",
          avatar: "C",
        },
        {
          id: 2,
          author: "TestUser",
          title: "Top 5 YouTube Channels For Learning Programming",
          content:
            "Quo inanis quando ea, mel an vide adversarium suscipiantur. Et dicunt eleifend splendide pro. Nibh animal dolorem vim ex, nec te agam referrentur. Usu admodum ocurreret ne.\n\nEt dico audire cotidieque sed, cibo latine ut has, an case magna alienum.",
          date: "August 26, 2018",
          avatar: "T",
        },
        {
          id: 3,
          author: "TestUser",
          title: "The Rise of Data Science",
          content:
            "Per omittam placerat at. Eius aeque ei mei. Usu ex partiendo salutandi. Pro illud placerat molestiae ex, habeo vidisse volutpatum cu vel, efficiendi accommodare eum ea! Ne has case minimum facilisis, pertinax efficiendi eu vel!\n\nEt movet semper assueverit his. Mei et liber vitae. Vix et pericula definebas, vero falli.",
          date: "August 26, 2018",
          avatar: "T",
        },
        {
          id: 4,
          author: "TestUser",
          title: "5 Tips for Writing Catchy Headlines",
          content:
            "Learn how to write headlines that grab attention and keep readers engaged. These simple techniques will help you create compelling titles for your blog posts.",
          date: "August 26, 2018",
          avatar: "T",
        },
      ];
      this.savePosts();
    }
  }

  renderProjects() {
    let self = this;
    // console.log("in sample");
    frappe.db
      .get_list("Projects", {
        fields: ["*"],
        filters: {
          user: frappe.session.user,
        },
        // order_by: 'employee_name asc',
        limit: 10,
      })
      .then((records) => {
        console.log("render records", records);

        self.projects = records;
        // self.saveProjects();

        console.log("rendering Projects");
        const projectPosts = document.getElementById("projectPosts");
        let filteredProjects = self.projects;

        console.log("filteredProjects", filteredProjects);

        switch (this.currentFilter) {
          case "today":
            const today = new Date().toDateString();
            filteredProjects = self.projects.filter(
              (task) => new Date(task.startTime).toDateString() === today,
            );
            break;
          case "high":
            filteredProjects = self.projects.filter(
              (task) => task.priority === "high",
            );
            break;
          case "completed":
            filteredProjects = self.projects.filter(
              (task) => task.status === "completed",
            );
            break;
          case "pending":
            filteredProjects = self.projects.filter(
              (task) => task.status === "pending",
            );
            break;
        }

        if (filteredProjects.length === 0) {
          console.log("no task found");

          projectPosts.innerHTML = `
                    <div class="empty-state">
                        <h3>No tasks found</h3>
                        <p>Start by creating your first task!</p>
                    </div>
                `;
          return;
        }

        projectPosts.innerHTML = filteredProjects
          .map(
            (p) => `
                <div class="project-post" data-project-id=${p.name}>
                    <div class="project-post-header">
                        <div class="task-author-avatar">${p.user.charAt(0)}</div>
                        <div class="project-post-meta">
                            <div class="task-author-name">${p.user}</div>
                            <div class="project-post-date">${self.formatDate(p.creation)}</div>
                        </div>
                        <div class="project-status ${p.status.replace("-", "")}">${p.status.replace("-", " ").toUpperCase()}</div>
                    </div>
                    <h2 class="project-title">${p.project_name} <span class="project-category">${p.category.toUpperCase()}</span></h2>
                    
                    <div class="project-details">
                        <span class="project-category">${p.category.toUpperCase()}</span>
                        <span class="project-y ${p.priority_level}">${p.priority_level.toUpperCase()}</span>
                    </div>
                    <div class="post-actions">
                        <button class="action-btn view-btn" data-project-id=${p.name}>Read More</button>
                        <button class="action-btn delete-btn" data-project-id=${p.name}>Delete</button>
                        <span class="project-time">${this.formatDateTime(p.start_date)} - ${this.formatDateTime(p.end_date)}</span>
                    </div>
                </div>
            `,
          )
          .join("");
        this.viewProject();
        this.updateStats();
        this.openProject();
      });

    // console.log("rendering Projects");
    // const projectPosts = document.getElementById('projectPosts');
    // let filteredProjects = this.projects;

    // console.log("filteredProjects",filteredProjects);

    // switch (this.currentFilter) {
    //     case 'today':
    //         const today = new Date().toDateString();
    //         filteredProjects = this.projects.filter(task =>
    //             new Date(task.startTime).toDateString() === today
    //         );
    //         break;
    //     case 'high':
    //         filteredProjects = this.projects.filter(task => task.priority === 'high');
    //         break;
    //     case 'completed':
    //         filteredProjects = this.projects.filter(task => task.status === 'completed');
    //         break;
    //     case 'pending':
    //         filteredProjects = this.projects.filter(task => task.status === 'pending');
    //         break;
    // }

    // if (filteredProjects.length === 0) {
    //     projectPosts.innerHTML = `
    //         <div class="empty-state">
    //             <h3>No tasks found</h3>
    //             <p>Start by creating your first task!</p>
    //         </div>
    //     `;
    //     return;
    // }

    // projectPosts.innerHTML = filteredProjects.map(task => `
    //     <div class="project-post">
    //         <div class="project-post-header">
    //             <div class="task-author-avatar">${task.author.charAt(0)}</div>
    //             <div class="project-post-meta">
    //                 <div class="task-author-name">${task.author}</div>
    //                 <div class="project-post-date">${this.formatDate(task.createdAt)}</div>
    //             </div>
    //             <div class="project-status ${task.status.replace('-', '')}">${task.status.replace('-', ' ').toUpperCase()}</div>
    //         </div>
    //         <h2 class="project-title">${task.title}</h2>
    //         <div class="project-content project-content-preview">${task.description.split('\n')[0]}</div>
    //         <div class="project-details">
    //             <span class="project-category">${task.category.toUpperCase()}</span>
    //             <span class="project-priority ${task.priority}">${task.priority.toUpperCase()}</span>
    //         </div>
    //         <div class="post-actions">
    //             <button class="action-btn view-btn" data-task-id=${task.id}>Read More</button>
    //             <button class="action-btn delete-btn" data-task-id="${task.id}">Delete</button>
    //             <span class="project-time">${this.formatDateTime(task.startTime)} - ${this.formatDateTime(task.endTime)}</span>
    //         </div>
    //     </div>
    // `).join('');
    // this.viewProjectBlog()
  }

  renderTasks(project) {
    console.log(project);
    self = this;
    const blogPosts = document.getElementById("blogPosts");
    if (this.posts.length === 111) {
      blogPosts.innerHTML = `
                <div class="empty-state">\
                    <h3>No Task yet</h3>
                    <p>Start by creating your first blog post!</p>
                </div>
            `;
      return;
    }
    // console.log(this.posts);
    console.log(`Task rendered for project ${project}`);
    frappe.db
      .get_list("Tasks", {
        fields: ["*"],
        filters: {
          members: frappe.session.user,
          project: project,
        },
        // order_by: 'employee_name asc',
        limit: 10,
      })
      .then((t) => {
        console.log(t);
        self.posts = t;
        if (t.length === 0) {
          blogPosts.innerHTML = `
                    <div class="empty-state">
                        <h3>No Task yet</h3>
                        <p>Start by creating your first blog post!</p>
                    </div>
                `;
          return;
        }
        blogPosts.innerHTML = t
          .map(
            (post) => `
                <div class="blog-post">
                    <div class="post-header">
                        <div class="author-avatar">${(post.avatar = "A")}</div>
                        <div class="post-meta">
                            <div class="author-name">${post.created_by}</div>
                            <div class="post-date">${post.creation}</div>
                        </div>
                    </div>
                    <h2 class="post-title">${post.task_name}</h2>
                    <div class="post-content">${post.description.replace(/\n/g, "<br>")}</div>
                </div>
            `,
          )
          .join("");
      });
    blogPosts.innerHTML = this.posts
      .map(
        (post) =>
          console.log("post-", post)`
            <div class="blog-post">
                <div class="post-header">
                    <div class="author-avatar">${post.avatar}</div>
                    <div class="post-meta">
                        <div class="author-name">${post.author}</div>
                        <div class="post-date">${post.date}</div>
                    </div>
                </div>
                <h2 class="post-title">${post.title}</h2>
                <div class="post-content">${post.content.replace(/\n/g, "<br>")}</div>
            </div>
        `,
      )
      .join("");
    taskModelcss();
    this.goBack();
  }

  openProject() {
    let self = this;
    // Opening the task post where those tasks are belongs to this project.
    $(document)
      .off("click", ".project-post")
      .on("click", ".project-post", function (event) {
        event.preventDefault();
        event.stopPropagation();
        // Prevent the click event from propagating to the parent project-post div
        // var project = $(".project-post").data("project-id");
        let project = $(this).data("project-id");

        console.log("project", project);
        console.log("Task List opened of this project");
        $(".container2").html("");
        $("#open-modal").remove();

        let container_content = `
                <div class="post-main-content">
                    <div id="blogPosts">
                        <!-- Sample posts will be loaded here -->
                    </div>
                </div>

                <div class="sidebar">
                    <h3>Our Sidebar</h3>
                    <p class="sidebar-description">You can put any information here you'd like.</p>
                    <ul class="sidebar-menu">
                        <li>Latest Posts</li>
                        <li>Announcements</li>
                        <li>Calendars</li>
                       <li class="go-back"><i class="fa fa-arrow-left"></i> Back</li>
                    </ul>
                </div>

                <button class="add-task-btn" data-project-id="${project}" id="open-task-modal">+</button>
                <div id="postModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header1">
                            <h2 class="modal-title">Create New Post</h2>
                            <button class="close-btn" onclick="closeModal()">&times;</button>
                        </div>
                        <form id="postForm">
                            <div class="form-group">
                                <label for="authorName">Author Name</label>
                                <input type="text" id="authorName" name="authorName" required>
                            </div>
                            <div class="form-group">
                                <label for="postTitle">Post Title</label>
                                <input type="text" id="postTitle" name="postTitle" required>
                            </div>
                            <div class="datetime-row">
                                <div class="form-group">
                                    <label for="startTime">Start Time</label>
                                    <input type="datetime-local" id="startTime" name="startTime" required>
                                </div>
                                <div class="form-group">
                                    <label for="endTime">End Time</label>
                                    <input type="datetime-local" id="endTime" name="endTime">
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="postContent">Post Content</label>
                                <textarea id="postContent" name="postContent" required></textarea>
                            </div>
                            <div style="text-align: right;">
                                <button type="button" class="cancel-btn" onclick="closeModal()">Cancel</button>
                                <button type="submit" class="submit-btn">Publish Post</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        $(".container2").append(container_content);

        // console.log("postmodel opened",$.fn.datepicker);
        // console.log(typeof $.fn.datepicker);
        // console.log("with window vanila js",window.AirDatepicker);

        // new AirDatepicker('#startTime', {
        //     view: 'months',
        //     minView: 'months',
        //     dateFormat: 'MMMM yyyy'
        // })

        // new AirDatepicker('#endTime', {
        //     view: 'months',
        //     minView: 'months',
        //     dateFormat: 'MMMM yyyy'
        // })

        // $('#startTime').datepicker({
        //     view: 'months',
        //     minView: 'months',
        //     dateFormat: 'MM yyyy'
        // });

        // $('#endTime').datepicker({
        //     view: 'months',
        //     minView: 'months',
        //     dateFormat: 'MM yyyy'
        // });

        self.renderTasks(project);
        self.createTask();
        self.opnenTask();
        // geting style for task model
      });
  }

  createTask() {
    $(document).on("click", "#open-task-modal", function (event) {
      console.log("creating task ...");
      // document.getElementById('postModal').style.display = 'block';
      let project = $(this).data("project-id");
      console.log("creating task for project ", project);

      let d = new frappe.ui.Dialog({
        title: "Create Task for project " + project,
        fields: [
          { fieldtype: "Data", label: "Task Name", fieldname: "task_name" },
          {
            fieldtype: "Data",
            label: "Project",
            fieldname: "project",
            default: project,
            read_only: true,
          },
          {
            fieldtype: "Date",
            label: "Expected Start Date",
            fieldname: "expected_start_date",
          },
          {
            fieldtype: "Date",
            label: "Expected End Date",
            fieldname: "expected_end_date",
          },
          {
            fieldtype: "Data",
            label: "Status",
            fieldname: "status",
            default: "Open",
          },
          {
            fieldtype: "Select",
            label: "Priority",
            fieldname: "priority",
            options: ["High", "Medium", "Low"],
            reqd: 1,
            default: "Medium",
          },
          {
            fieldtype: "Select",
            label: "Priority",
            fieldname: "priority",
            options: "High \nMedium \nLow",
            default: "Medium",
          },
          {
            fieldtype: "Text Editor",
            label: "Task Description",
            fieldname: "description",
          },
          // { fieldtype: 'Data', label: 'created', fieldname: 'task_name' },
        ],
        primary_action_label: "Create Task",
        primary_action(values) {
          frappe
            .xcall(
              "task_blogger.task_blogger.page.task_blogging.task_blogging.new_task",
              {
                new_task: values,
              },
            )
            .then((r) => {
              console.log(r);

              d.hide();

              const newTask = {
                id: Date.now(),
                blogger: values.frappe.session.user,
                taskTitle: values.task_name,
                content: values.description,
                priority: this.selectedPriority,
                status: values.status,
                startTime: values.expected_start_date,
                endTime: values.expected_end_date,
                createdAt: new Date().toISOString(),
                author: "TaskUser",
              };

              frappe.msgprint(
                `Task ${values.task_name} Created Successfully !`,
              );

              this.projects.unshift(newTask);
              this.saveProjects();
              this.renderTasks();
              this.updateStats();
              this.closeModal();
              form.reset();
              this.setDefaultDateTime();

              // Reset priority selection
              document
                .querySelectorAll(".priority-tag")
                .forEach((t) => t.classList.remove("selected"));
              document
                .querySelector(".priority-tag.medium")
                .classList.add("selected");
              this.selectedPriority = "medium";
            });
        },
      });
      d.show();
      var values = d.get_values();
      console.log("values", values);
    });
  }

  opnenTask() {
    let self = this;
    $(document).on("click", ".blog-post", function (event) {
      console.log("clicked");
      // document.getElementById('projectModal').style.display = 'block';

      const taskDate = $(this).data("task-date") || frappe.datetime.nowdate(); // Use data attribute or today

      // Navigate to comment-section-v3 with date parameter
      frappe.set_route("comment-section-v5", { date: taskDate });
    });

    // $(document).on("click", "#open-modal", function (event) {
    //     console.log("clicked")
    //     document.getElementById('projectModal').style.display = 'block';
    // })
  }

  bindEvents() {
    document.getElementById("projectForm").addEventListener("submit", (e) => {
      e.preventDefault();
      // this.addTask();
      this.addProject();
    });
    document.querySelectorAll(".priority-tag").forEach((tag) => {
      tag.addEventListener("click", (e) => {
        document
          .querySelectorAll(".priority-tag")
          .forEach((t) => t.classList.remove("selected"));
        e.target.classList.add("selected");
        this.selectedPriority = e.target.dataset.priority;
      });
    });

    // Close modals when clicking outside
    document.getElementById("projectModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal();
      }
    });

    document
      .getElementById("blogReaderModal")
      .addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
          this.closeBlogReader();
        }
      });

    document.getElementById("deleteModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.closeDeleteModal();
      }
    });

    // Set default datetime
    this.setDefaultDateTime();
  }
  // Read project
  viewProject() {
    let self = this;
    $(document).on("click", ".view-btn", function (event) {
      event.stopPropagation();
      console.log("view-blog clicked");
      //
      let projectId = $(this).data("project-id");
      console.log("project_id :", projectId);
      // self.viewProject(projectId)

      console.log("Projects", self.projects);

      const project = self.projects.find((p) => p.name === projectId);
      console.log("the project", project);

      if (!project) {
        console.error(`Task with ID ${projectId} not found`);
        return;
      }

      this.currentProjectId = projectId;

      // Create the blog reader content as HTML string
      const blogReaderHTML = `
                <div id="blogReaderModal" class="blog-reader-content">
                    <div class="blog-reader-header">
                        <div class="blog-reader-meta">
                            <div class="blog-reader-avatar">${project.user.charAt(0)}</div>
                            <div class="blog-reader-author-info">
                                <div class="blog-reader-author-name">${project.user}</div>
                                <div class="blog-reader-date">${self.formatDate(project.creation)}</div>
                            </div>
                            <div class="blog-reader-actions">
                                <button class="action-btn delete-btn">Delete</button>
                            </div>
                            <div class="blog-reader-actions">
                                <button class="action-btn close-viewer">Close</button>
                            </div>
                        </div>
                    </div>
                    <div class="blog-reader-content-body">
                        <h1 class="blog-reader-title">${project.project_name}</h1>
                        <div class="blog-reader-text">${project.description.replace(/\n/g, "<br>")}</div>
                            <div class="blog-reader-details">
                                <div class="blog-reader-detail-item">
                                    <div class="blog-reader-detail-label">Category</div>
                                    <div class="blog-reader-detail-value">${project.category.charAt(0).toUpperCase() + project.category.slice(1)}</div>
                                </div>
                                <div class="blog-reader-detail-item">
                                    <div class="blog-reader-detail-label">Priority</div>
                                    <div class="blog-reader-detail-value">${project.priority_level.charAt(0).toUpperCase() + project.priority_level.slice(1)}</div>
                                </div>
                                <div class="blog-reader-detail-item">
                                    <div class="blog-reader-detail-label">Status</div>
                                    <div class="blog-reader-detail-value">${project.status.replace("-", " ").toUpperCase()}</div>
                                </div>
                                <div class="blog-reader-detail-item">
                                    <div class="blog-reader-detail-label">Start Time</div>
                                    <div class="blog-reader-detail-value">${self.formatFullDateTime(project.start_date)}</div>
                                </div>
                                <div class="blog-reader-detail-item">
                                    <div class="blog-reader-detail-label">End Time</div>
                                    <div class="blog-reader-detail-value">${self.formatFullDateTime(project.end_date)}</div>
                                </div>
                                <div class="blog-reader-detail-item">
                                    <div class="blog-reader-detail-label">Duration</div>
                                    <div class="blog-reader-detail-value">${self.calculateDuration(project.start_date, project.end_date)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      // Clear the container and append the blog reader content

      $(".container2").html("");
      $(".container2").css("display", "block");

      // $(".page-container").html("")
      // $(".page-container").hide();
      $(".container2").append(blogReaderHTML);
    });
  }

  // viewTask(taskId) {
  //     const task = task.projects.find(t => t.id === taskId);
  //     if (!task) return;
  //     this.currentTaskId = taskId;
  //     // Populate blog reader modal
  //     document.getElementById('blogTitle').textContent = task.title;
  //     document.getElementById('blogAvatar').textContent = task.author.charAt(0);
  //     document.getElementById('blogAuthor').textContent = task.author;
  //     document.getElementById('blogDate').textContent = this.formatDate(task.createdAt);
  //     document.getElementById('blogContent').innerHTML = task.description.replace(/\n/g, '<br>');

  //     // $(".container2").html("");

  //     // Populate task details

  //     document.getElementById('blogDetails').innerHTML = `
  //         <div class="blog-reader-detail-item">
  //             <div class="blog-reader-detail-label">Category</div>
  //             <div class="blog-reader-detail-value">${task.category.charAt(0).toUpperCase() + task.category.slice(1)}</div>
  //         </div>
  //         <div class="blog-reader-detail-item">
  //             <div class="blog-reader-detail-label">Priority</div>
  //             <div class="blog-reader-detail-value">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</div>
  //         </div>
  //         <div class="blog-reader-detail-item">
  //             <div class="blog-reader-detail-label">Status</div>
  //             <div class="blog-reader-detail-value">${task.status.replace('-', ' ').toUpperCase()}</div>
  //         </div>
  //         <div class="blog-reader-detail-item">
  //             <div class="blog-reader-detail-label">Start Time</div>
  //             <div class="blog-reader-detail-value">${this.formatFullDateTime(task.startTime)}</div>
  //         </div>
  //         <div class="blog-reader-detail-item">
  //             <div class="blog-reader-detail-label">End Time</div>
  //             <div class="blog-reader-detail-value">${this.formatFullDateTime(task.endTime)}</div>
  //         </div>
  //         <div class="blog-reader-detail-item">
  //             <div class="blog-reader-detail-label">Duration</div>
  //             <div class="blog-reader-detail-value">${this.calculateDuration(task.startTime, task.endTime)}</div>
  //         </div>
  //     `;
  //     // Show blog reader modal
  //     document.getElementById('blogReaderModal').style.display = 'block';
  // }

  goBack() {
    let self = this;
    $(document).on("click", ".go-back", function (event) {
      console.log("back clicked");
      $(".container2").remove();
      self.renderTemplate();
    });
  }

  createProject() {
    $(document).on("click", "#open-modal", function (event) {
      console.log("clicked project");
      document.getElementById("projectModal").style.display = "block";
    });
  }

  // createProject() {
  //     $(document).on("click", "#open-model", function (event) {
  //         console.log("creating task ...")
  //         // document.getElementById('postModal').style.display = 'block';
  //         let project = $(this).data('project-id');
  //         console.log("creating task for project ",project);

  //         let d = new frappe.ui.Dialog({
  //             title: "Create Task for project "+project,
  //             fields: [
  //                 { fieldtype: 'Data', label: 'Project Name', fieldname: 'project_name' },
  //                 { fieldtype: 'Data', label: 'Project', fieldname: 'project',default:project,read_only:true},
  //                 { fieldtype: 'Date', label: 'Expected Start Date', fieldname: 'expected_start_date'},
  //                 { fieldtype: 'Date', label: 'Expected End Date', fieldname: 'expected_end_date'},
  //                 { fieldtype: 'Data', label: 'Status', fieldname: 'status', default:'Open'},
  //                 { fieldtype: 'Select', label: 'Priority', fieldname: 'priority', options: ['High', 'Medium', 'Low'],reqd: 1, default:'Medium'},
  //                 { fieldtype: 'Select', label: 'Priority', fieldname: 'priority', options: 'High \nMedium \nLow',default:'Medium'},
  //                 { fieldtype: 'Text Editor', label: 'Task Description', fieldname: 'description' },
  //                 // { fieldtype: 'Data', label: 'created', fieldname: 'task_name' },
  //             ],
  //             primary_action_label: 'Create Task',
  //             primary_action(values) {

  //                 frappe.xcall("task_blogger.task_blogger.page.task_blogging.task_blogging.new_task", {
  //                     new_task: values
  //                 }).then(r => {
  //                     console.log(r);

  //                     d.hide();

  //                     const newTask = {
  //                         id: Date.now(),
  //                         blogger: values.frappe.session.user,
  //                         taskTitle: values.task_name,
  //                         content: values.description,
  //                         priority: this.selectedPriority,
  //                         status: values.status,
  //                         startTime: values.expected_start_date,
  //                         endTime: values.expected_end_date,
  //                         createdAt: new Date().toISOString(),
  //                         author: 'TaskUser'
  //                     };

  //                     frappe.msgprint(`Task ${values.task_name} Created Successfully !`);

  //                     this.projects.unshift(newTask);
  //                     this.saveProjects();
  //                     this.renderTasks();
  //                     this.updateStats();
  //                     this.closeModal();
  //                     form.reset();
  //                     this.setDefaultDateTime();

  //                     // Reset priority selection
  //                     document.querySelectorAll('.priority-tag').forEach(t => t.classList.remove('selected'));
  //                     document.querySelector('.priority-tag.medium').classList.add('selected');
  //                     this.selectedPriority = 'medium';

  //                 });
  //             }
  //         });
  //         d.show();
  //         var values = d.get_values();
  //         console.log("values",values);

  //     })

  // }

  closeCreateProject() {
    $(document).on("click", ".close-model", function (event) {
      console.log("close clicked");
      document.getElementById("projectModal").style.display = "none";
    });
  }

  closeViewer() {
    let self = this;
    $(document).on("click", ".close-viewer", function (event) {
      console.log("close clicked");
      $(".container2").remove();
      self.closeBlogReader();
    });
  }

  closeBlogReader() {
    // document.getElementById('blogReaderModal').style.display = 'none';
    $("#blogReaderModal").remove();
    $(".container2").remove();
    this.currentTaskId = null;
    this.renderTemplate();
  }

  confirmDeleteProject(taskId) {
    let self = this;
    this.currentTaskId = taskId;
    document.getElementById("deleteModal").style.display = "block";

    $(document).on("click", ".confirm-delete-btn", function (event) {
      event.stopPropagation();
      console.log("confirm clicked clicked");
      self.deletingProject();
    });
  }

  deleteProject() {
    let self = this;
    $(document).on("click", ".delete-btn", function (event) {
      // event.stopPropagation();
      event.preventDefault();
      console.log("delete project clicked");
      let project = $(this).data("project-id");
      console.log("project id", project);
      self.confirmDeleteProject(project);
      // document.getElementById('projectModal').style.display = 'none';
    });

    $(document).on("click", ".cancel-btn", function (event) {
      console.log("cancel");
      self.closeDeleteModal();
      // document.getElementById('projectModal').style.display = 'none';
    });
  }

  closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
    this.currentTaskId = null;
  }

  confirmDelete() {
    if (!this.currentTaskId) return;
    document.getElementById("deleteModal").style.display = "block";
  }

  deletingProject() {
    let self = this;
    if (!this.currentTaskId) return;
    this.projects = this.projects.filter(
      (task) => task.id !== this.currentTaskId,
    );

    console.log("current project id", this.currentTaskId);

    // this.saveProjects();
    // this.renderTasks();
    // this.renderProjects()
    // this.updateStats();
    // this.closeDeleteModal();
    // this.closeBlogReader();
    // this.currentTaskId = null;

    frappe.call({
      method: "memento.memento.page.project_hub.project_hub.delete_project",
      args: { project_id: this.currentTaskId },
      callback: function (r) {
        if (r.message.status === "Success") {
          // const $projectBox = $(`input[data-project-id="${r.file_id}"]`).closest(".project-post");
          // console.log("Found file box:", $projectBox.length);
          // console.log("$projectBox element:", $projectBox);
          // if ($projectBox.length > 0) {
          //     console.log("if");
          //     $projectBox.fadeOut(150, function () {
          //         $(this).remove();
          //     });
          // } else {
          //     console.error("Element not found!");
          //     console.log("else")
          // }

          console.log("callback project_id : ", r.message.project_id);
          const $projectBox = $(
            `.project-post[data-project-id="${r.message.project_id}"]`,
          );
          console.log("Found file box:", $projectBox.length);

          if ($projectBox.length > 0) {
            console.log("vanishing roject here");
            $projectBox.fadeOut(150, function () {
              $(this).remove();
            });
          } else {
            console.error("Element not found!");
          }

          frappe.show_alert(
            {
              message: __("Project Deleted Successfully"),
              indicator: "green",
            },
            5,
          );
          // Refresh the project list after deletion
          // self.renderProjects();
          // self.updateStats();
          self.closeDeleteModal();
          self.closeBlogReader();
        } else {
          frappe.show_alert(
            {
              message: __("Failed to Delete Project"),
              indicator: "red",
            },
            5,
          );
        }
      },
    });
  }

  addProject() {
    let self = this;
    console.log("hello");
    const form = document.getElementById("projectForm");
    const formData = new FormData(form);

    // const newProject = {
    //     id: Date.now(),
    //     title: formData.get('taskTitle'),
    //     description: formData.get('taskDescription'),
    //     category: formData.get('taskCategory'),
    //     priority: this.selectedPriority,
    //     status: formData.get('taskStatus'),
    //     startTime: formData.get('startTime'),
    //     endTime: formData.get('endTime'),
    //     createdAt: new Date().toISOString(),
    //     author: 'TaskUser'
    // };

    const newProject = {
      title: formData.get("taskTitle"),
      description: formData.get("taskDescription"),
      category: formData.get("taskCategory"),
      priority: this.selectedPriority,
      status: formData.get("taskStatus"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      createdAt: new Date().toISOString(),
      author: "TaskUser",
    };

    console.log(newProject);

    console.log(typeof newProject);

    frappe.call({
      method:
        "task_blogger.task_blogger.page.task_blogging.task_blogging.new_project",
      args: {
        user: frappe.session.user,
        newproject: newProject,
      },
      async: false,
      callback: function (r) {
        if (r.message.status == "Success") {
          frappe.show_alert(
            {
              message: __("Successfully Created New Project"),
              indicator: "green",
            },
            5,
          );

          self.closeModal();
        }
      },
    });

    this.projects.unshift(newProject);
    // this.saveProjects();
    // this.renderTasks();
    this.renderProjects();
    this.updateStats();
    this.closeModal(); // idont know its working or not but after create button trigger then module not close automatically
    form.reset();
    this.setDefaultDateTime();

    // Reset priority selection
    document
      .querySelectorAll(".priority-tag")
      .forEach((t) => t.classList.remove("selected"));
    document.querySelector(".priority-tag.medium").classList.add("selected");
    this.selectedPriority = "medium";
  }

  addTask() {
    console.log("helo");
    const form = document.getElementById("postForm");
    const formData = new FormData(form);

    const newTask = {
      id: Date.now(),
      blogger: formData.get("authorName"),
      taskTitle: formData.get("postTitle"),
      content: formData.get("postContent"),
      priority: this.selectedPriority,
      status: formData.get("taskStatus"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      createdAt: new Date().toISOString(),
      author: "TaskUser",
    };

    this.projects.unshift(newTask);
    this.saveProjects();
    this.renderTasks();
    this.updateStats();
    this.closeModal();
    form.reset();
    this.setDefaultDateTime();

    // Reset priority selection
    document
      .querySelectorAll(".priority-tag")
      .forEach((t) => t.classList.remove("selected"));
    document.querySelector(".priority-tag.medium").classList.add("selected");
    this.selectedPriority = "medium";
  }

  // openModal() {
  //     document.getElementById('projectModal').style.display = 'block';
  // }

  closeModal() {
    document.getElementById("projectModal").style.display = "none";
  }

  saveProjects() {
    localStorage.setItem("ProjectPosts", JSON.stringify(this.projects));
  }
  savePosts() {
    localStorage.setItem("blogPosts", JSON.stringify(this.posts));
  }

  updateStats() {
    const today = new Date().toDateString();
    const todayTasks = this.projects.filter(
      (task) => new Date(task.startTime).toDateString() === today,
    );
    const completedTasks = this.projects.filter(
      (task) => task.status === "completed",
    );
    const pendingTasks = this.projects.filter(
      (task) => task.status === "pending",
    );

    document.getElementById("total-projects").textContent =
      this.projects.length;
    $("#total-projects").text(this.projects.length);

    document.getElementById("todayTasks").textContent = todayTasks.length;
    document.getElementById("completedTasks").textContent =
      completedTasks.length;
    document.getElementById("pendingTasks").textContent = pendingTasks.length;
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatFullDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  filterTasks(filter) {
    this.currentFilter = filter;
    this.renderTasks();
  }

  setDefaultDateTime() {
    const now = new Date();
    const startTime = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
    const endTime = new Date(now.getTime() + 90 * 60000); // 1.5 hours from now

    document.getElementById("startTime").value = startTime
      .toISOString()
      .slice(0, 16);
    document.getElementById("endTime").value = endTime
      .toISOString()
      .slice(0, 16);
  }
}

// Global functions
// function openModal() {
//     taskBlogApp.openModal();
// }

// function closeModal() {
//     taskBlogApp.closeModal();
// }

// function filterTasks(filter) {
//     taskBlogApp.filterTasks(filter);
// }

// function viewTask(taskId) {
//     taskBlogApp.viewTask(taskId);
// }

// function confirmDeleteTask(taskId) {
//     taskBlogApp.confirmDeleteTask(taskId);
// }

// function deleteTask() {
//     taskBlogApp.deleteTask();
// }

// function closeBlogReader() {
//     taskBlogApp.closeBlogReader();
// }

// function closeDeleteModal() {
//     taskBlogApp.closeDeleteModal();
// }

// function confirmDelete() {
//     taskBlogApp.confirmDelete();
// }

// // Initialize app
// let taskBlogApp;
// document.addEventListener('DOMContentLoaded', () => {
//     taskBlogApp = new TaskBlogApp();
// });

// // Keyboard shortcuts
// document.addEventListener('keydown', (e) => {
//     if (e.key === 'Escape') {
//         closeModal();
//         closeBlogReader();
//         closeDeleteModal();
//     }
// });

function taskModelcss() {
  // console.log("Task css");

  let container_css = `

        .container2 {
            "max-width": "1200px",
            "margin": "0 auto",
            "padding": "20px",
            "display": "grid",
            "grid-template-columns": "1fr 300px",
            "gap": "30px"
        }


        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }


       .post-main-content {
            background: transparent;
        }

        .blog-post {
            background: white;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            cursor: pointer;
        }


        .blog-post:last-child {
            margin-bottom: 0;
        }

        .post-header {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #f1f3f4;
        }
        .author-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            margin-right: 15px;
            background-color: #6c757d;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
        }

        .author-name {
            font-weight: 600;
            color: #4a90e2;
            font-size: 14px;
            margin-bottom: 2px;
        }

        .post-date {
            color: #868e96;
            font-size: 13px;
        }

        .post-title {
            font-size: 24px;
            font-weight: 600;
            color: #495057;
            margin-bottom: 15px;
            line-height: 1.3;
        }

        .post-content {
            color: #6c757d;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 15px;
        }

        .sidebar {
            background: white;
            border-radius: 8px;
            padding: 25px;
            height: fit-content;
            position: sticky;
            top: 20px;
        }

        .sidebar h3 {
            font-size: 18px;
            font-weight: 600;
            color: #495057;
            margin-bottom: 10px;
        }

        .sidebar-description {
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 25px;
        }

        .sidebar-menu {
            list-style: none;
        }

        .sidebar-menu li {
            padding: 12px 0;
            border-bottom: 1px solid #f1f3f4;
            color: #6c757d;
            font-size: 14px;
            cursor: pointer;
            transition: color 0.3s ease;
        }

        .sidebar-menu li:hover {
            color: #4a90e2;
        }

        .sidebar-menu li:last-child {
            border-bottom: none;
        }


        .add-post-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
            transition: all 0.3s ease;
            z-index: 1000;
        }

        .add-post-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2000;
        }

       

        .modal-header1 {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .modal-title {
            font-size: 20px;
            font-weight: 600;
            color: #495057;
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6c757d;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #495057;
            font-size: 14px;
        }

        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #4a90e2;
        }

        .form-group textarea {
            resize: vertical;
            min-height: 120px;
        }

        .submit-btn {
            background: #4a90e2;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.3s ease;
        }

        .submit-btn:hover {
            background: #357abd;
        }

        .cancel-btn {
            background: #6c757d;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            margin-right: 10px;
            transition: background 0.3s ease;
        }

        .cancel-btn:hover {
            background: #5a6268;
        }

        @media (max-width: 768px) {
            .container {
                grid-template-columns: 1fr;
                gap: 20px;
                padding: 10px;
            }
            
            .blog-post {
                padding: 20px;
            }
            
            .sidebar {
                order: -1;
            }
        }

        .empty-state {
            text-align: center;
            padding: 60px 30px;
            color: #6c757d;
        }

        .empty-state h3 {
            font-size: 18px;
            margin-bottom: 10px;
        }

        .empty-state p {
            font-size: 14px;
        }


        
    `;

  $("style").first().append(container_css);
}
