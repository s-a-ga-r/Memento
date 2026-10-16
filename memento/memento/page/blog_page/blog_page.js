frappe.require(
    "/assets/memento/css/blog_page.css"
);
frappe.pages["blog-page"].on_page_load = function (wrapper) {

    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: "",
        single_column: true
    });

    // HIDE FRAPPE PAGE HEADER
    $(wrapper).find(".page-head").hide();

    const $main = $(page.main);
    // LOAD PRISM.JS SYNTAX HIGHLIGHTING
    function loadPrism(){
        if (
            window.Prism &&
             window.Prism.languages.python &&
             window.Prism.languages.javascript
        ){
            return Promise.resolve();
        }
        if(window.mementoPrismPromise){
            return window.mementoPrismPromise;
        }
        const base =
            "https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/";

        // Load Prism CSS
        if (!document.getElementById("memento-prism-css")) {

            const link = document.createElement("link");

            link.id = "memento-prism-css";
            link.rel = "stylesheet";
            link.href = base + "themes/prism.min.css";

            document.head.appendChild(link);
        }

        // Load a JavaScript file
        function loadScript(url) {

            return new Promise(function (resolve, reject) {

                const script = document.createElement("script");

                script.src = url;
                script.onload = resolve;
                script.onerror = reject;

                document.head.appendChild(script);

            });
        }

        window.mementoPrismPromise = loadScript(
            base + "prism.min.js"
        )
        .then(function () {

            return loadScript(
                base + "components/prism-python.min.js"
            );

        })
        .then(function () {

            return loadScript(
                base + "components/prism-javascript.min.js"
            );

        });

        return window.mementoPrismPromise;
    }
    // HELPER FUNCTIONS
    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDate(value) {

        if (!value) {
            return "-";
        }

        try {
            return frappe.datetime.str_to_user(value);
        } catch (error) {
            return value;
        }
    }

    // ==========================================
    // EXIT BUTTON
    // ==========================================

    function bindCloseButton() {

        $main.off("click", ".blog-close-btn");

        $main.on("click", ".blog-close-btn", function () {

            frappe.set_route("projec-track");

        });
    }

    // ==========================================
    // SHOW ERROR
    // ==========================================

    function showError(title, message, recordId) {

        $main.html(`
            <article class="memento-blog">

                <h1>${escapeHTML(title)}</h1>

                <p>${escapeHTML(message || "")}</p>

                ${
                    recordId
                        ? `
                            <p>
                                Record ID:
                                <strong>
                                    ${escapeHTML(recordId)}
                                </strong>
                            </p>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="blog-close-btn"
                >
                    Close 
                </button>

            </article>
        `);

        bindCloseButton();
    }

    // ==========================================
    // GET ID FROM URL
    // ==========================================

    const route = frappe.get_route();

    console.log("FULL BLOG ROUTE:", route);

    const routeId = route[1];

    console.log("BLOG ROUTE ID:", routeId);

    // ==========================================
    // TASK LOG ROUTE
    // URL:
    // /app/blog-page/TSK-10-10-26-21
    // ==========================================

    if (routeId && routeId.startsWith("TSK-")) {

        console.log("TASK LOG ROUTE DETECTED:", routeId);

        loadTaskLog(routeId);

        return;
    }

    // ==========================================
    // PROJECT BLOG ROUTE
    // URL:
    // /app/blog-page/PRJ-5-26-01-26
    // ==========================================

    const projectId = routeId;

    if (!projectId || !projectId.startsWith("PRJ-")) {

        showError(
            "No Project Selected",
            "Please open a project using the Read More button.",
            null
        );

        return;
    }

    console.log("PROJECT ID FROM ROUTE:", projectId);

    loadProjectBlog(projectId);

    // ==========================================
    // LOAD MY PROJECTS DOCUMENT
    // ==========================================

    function loadProjectBlog(projectId) {

        console.log(
            "Fetching My Projects document:",
            projectId
        );

        frappe.db.get_doc(
            "My Projects",
            projectId
        )

        .then(function (project) {

            console.log("PROJECT DATA RECEIVED:", project);

            renderProjectBlog(project);

        })

        .catch(function (error) {

            console.error(
                "FAILED TO LOAD MY PROJECTS:",
                error
            );

            showError(
                "Unable to Load Project",
                "The project could not be loaded. Check the browser console for details.",
                projectId
            );

        });
    }

    // ==========================================
    // RENDER PROJECT BLOG
    // ==========================================

    function renderProjectBlog(project) {

        $main.html(`

            <article class="memento-blog" id="blog-start">

                <div class="blog-actions">

                    <button
                        class="blog-close-btn"
                        type="button"
                    >
                        Close
                    </button>

                    <button
                        class="blog-edit-btn"
                        type="button"
                    >
                        Edit
                    </button>

                </div>

                <h1 class="blog-title">
                    ${escapeHTML(
                        project.project_name || "Untitled Project"
                    )}
                </h1>

                <p class="blog-intro">
                    Project is a temporary team effort designed
                    to achieve a specific goal within a set
                    timeframe and budget. It follows a structured
                    lifecycle, from initial planning and execution
                    to final monitoring and closure.
                </p>

                <!-- ==================================
                        AUTHOR
                    =================================== -->

                    <div class="blog-author">

                        <div class="author-avatar">
                            ${
                                (project.user || "Administrator")
                                    .charAt(0)
                                    .toUpperCase()
                            }
                        </div>

                        <div class="author-info">

                            <div class="author-name">
                                ${project.user || "Administrator"}
                            </div>

                            <div class="author-meta">
                                ${
                                    project.creation
                                        ? frappe.datetime.str_to_user(project.creation)
                                        : "Date not available"
                                }

                            </div>

                        </div>

                    </div>

                <h2 id="project-description">
                    Project Description
                </h2>

                <div class="project-description">
                    ${
                        project.description ||
                        "<p>No project description has been added yet.</p>"
                    }
                </div>

                <h2 id="about-project">
                    About This Project
                </h2>

                <p>
                    This project is documented using the
                    <strong>Memento</strong> module to keep
                    project information organized and easy
                    to understand.
                </p>

                <p>
                    The project belongs to
                    <strong>
                        ${escapeHTML(project.category || "Project")}
                    </strong>
                    category and currently has a status of
                    <strong>
                        ${escapeHTML(project.status || "Not specified")}
                    </strong>.
                </p>

                <h2 id="python-section">
                    Frappe Python Example
                </h2>

                <p>
                    This example demonstrates how a Frappe
                    backend method can retrieve information
                    from a DocType.
                </p>

                <div class="code-card">

                    <div class="code-header">

                        <span class="code-language">
                            Python
                        </span>

                        <button class="copy-code" type="button">
                            Copy
                        </button>

                    </div>

                    <pre><code class="language-python">import frappe

@frappe.whitelist()
def get_project_details(project_id):

    if not project_id:
        return {
            "success": False,
            "message": "Project ID is required"
        }

    project = frappe.get_doc(
        "My Projects",
        project_id
    )

    return {
        "name": project.name,
        "project_name": project.project_name,
        "status": project.status,
        "category": project.category,
        "priority": project.priority_level
    }</code></pre>

                </div>

                <h2 id="javascript-section">
                    Frappe JavaScript Example
                </h2>

                <p>
                    Frappe JavaScript can retrieve DocType
                    records and display information on the
                    client side.
                </p>

                <div class="code-card">

                    <div class="code-header">

                        <span class="code-language">
                            JavaScript
                        </span>

                        <button class="copy-code" type="button">
                            Copy
                        </button>

                    </div>

                    <pre><code class="language-javascript">function loadProject(projectId) {

    if (!projectId) {
        console.error("Project ID is missing");
        return;
    }

    frappe.db.get_doc(
        "My Projects",
        projectId
    ).then(function(project) {

        console.log("Project:", project);
        console.log("Name:", project.project_name);
        console.log("Status:", project.status);
        console.log("Category:", project.category);

    }).catch(function(error) {

        console.error("Failed to load project:", error);

    });

}</code></pre>

                </div>

                <h2 id="doctypes-section">
                    Working With DocTypes
                </h2>

                <p>
                    Frappe DocTypes provide a structured way
                    to store and manage application data.
                    The <strong>My Projects</strong> DocType
                    stores the project information displayed here.
                </p>

                <ul>
                    <li>DocTypes define application data.</li>
                    <li>Fields define the structure of records.</li>
                    <li>Python handles server-side operations.</li>
                    <li>JavaScript handles client-side behaviour.</li>
                    <li>Frappe APIs connect frontend and backend.</li>
                </ul>

                <blockquote class="blog-quote">
                    <strong>
                        Plan the project.
                        Document the work.
                        Build the solution.
                    </strong>
                </blockquote>

                <h2 id="conclusion-section">
                    Conclusion
                </h2>

                <p>
                    This project page demonstrates how project
                    information can be presented using the
                    Memento blog layout. Project details,
                    descriptions, DocType information, and
                    development examples are organized in one place.
                </p>

                <h2 id="project-details-section">
                    Project Details
                </h2>

                <div class="project-details">

                    <div class="detail-row">
                        <strong>Project ID</strong>
                        <span>${escapeHTML(project.name || "-")}</span>
                    </div>

                    <div class="detail-row">
                        <strong>Start Date</strong>
                        <span>${escapeHTML(formatDate(project.start_date))}</span>
                    </div>

                    <div class="detail-row">
                        <strong>End Date</strong>
                        <span>${escapeHTML(formatDate(project.end_date))}</span>
                    </div>

                    <div class="detail-row">
                        <strong>Category</strong>
                        <span>${escapeHTML(project.category || "-")}</span>
                    </div>

                    <div class="detail-row">
                        <strong>Priority</strong>
                        <span>${escapeHTML(project.priority_level || "-")}</span>
                    </div>

                    <div class="detail-row">
                        <strong>Status</strong>
                        <span>${escapeHTML(project.status || "-")}</span>
                    </div>

                </div>

                <h3 id="memento-section">
                    Memento Project Blog
                </h3>

                <p>
                    This page is part of the <strong>Memento</strong>
                    module and is used to document project information
                    and progress.
                </p>

                <div class="blog-tags">

                    <a href="#" class="blog-tag" data-target="blog-start">
                        memento
                    </a>

                    <a href="#" class="blog-tag" data-target="about-project">
                        frappe
                    </a>

                    <a href="#" class="blog-tag" data-target="python-section">
                        python
                    </a>

                    <a href="#" class="blog-tag" data-target="javascript-section">
                        javascript
                    </a>

                </div>

            </article>

        `);

        bindProjectBlogEvents(project);
        // APPLY SYNTAX HIGHLIGHTING
        loadPrism()
            .then(function () {
                window.Prism.highlightAllUnder($main[0]);
            })
            .catch(function (error) {
                console.error("Prism loading failed:", error);
            });
        
    }

    // ==========================================
    // PROJECT BLOG EVENTS
    // ==========================================

    function bindProjectBlogEvents(project) {

        $main.off("click", ".blog-close-btn");
        $main.off("click", ".blog-edit-btn");
        $main.off("click", ".copy-code");
        $main.off("click", ".blog-tag");

        //  CLOSE

        bindCloseButton();

        // EDIT PROJECT

        $main.on("click", ".blog-edit-btn", function () {

            frappe.set_route(
                "Form",
                "My Projects",
                project.name
            );

        });

        // COPY CODE

        $main.on("click", ".copy-code", function () {

            const button = this;

            const code = $(button)
                .closest(".code-card")
                .find("code")
                .text();

            if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {

                navigator.clipboard.writeText(code)

                .then(function () {

                    button.innerText = "Copied!";

                    setTimeout(function () {
                        button.innerText = "Copy";
                    }, 1500);

                })

                .catch(function (error) {

                    console.error("FAILED TO COPY CODE:", error);

                    button.innerText = "Failed";

                });

            }

        });

        // BLOG TAG NAVIGATION

        $main.on("click", ".blog-tag", function (event) {

            event.preventDefault();
            event.stopPropagation();

            const targetId = $(this).data("target");

            const targetElement =
                document.getElementById(targetId);

            if (targetElement) {

                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });
    }

    // ==========================================
    // LOAD TASK LOG
    // INCLUDING MEMBERS AND COMMENTS
    // ==========================================

    function loadTaskLog(taskId) {

        $main.html(`
            <article class="memento-blog task-log-blog">

                <div class="blog-actions">
                    <button class="blog-close-btn" type="button">
                        Close
                    </button>
                </div>

                <h1 class="blog-title">Task Log</h1>

                <p class="blog-intro">
                    Loading Task Log information...
                </p>

            </article>
        `);

            // TASK LOG CLOSE — GO BACK ONE STEP
        $main.off("click", ".blog-close-btn");

        $main.on("click", ".blog-close-btn", function () {
            window.history.back();
        });

        frappe.call({

            method:
                "memento.memento.page.blog_page.blog_page.get_task_logs",

            args: {
                task_id: taskId
            },

            callback: function (response) {

                const logs = response.message || [];

                if (!logs.length) {

                    showError(
                        "No Task Logs Found",
                        "No Task Log records were found for this task.",
                        taskId
                    );

                    return;
                }

                let html = `
                    <article class="memento-blog task-log-blog">

                        <div class="blog-actions">
                            <button class="blog-close-btn" type="button">
                                Close
                            </button>
                        </div>

                        <h1 class="blog-title">Task Log</h1>

                        <p class="blog-intro">
                            Task Log records, members, and comments.
                        </p>

                        <div class="task-log-summary">

                            <div class="task-log-cell">
                                <strong>Task ID</strong>
                                <span>${escapeHTML(taskId)}</span>
                            </div>

                            <div class="task-log-cell">
                                <strong>Total Log Entries</strong>
                                <span>${logs.length}</span>
                            </div>

                        </div>

                        <h2 class="task-log-heading">
                            Task Log Entries
                        </h2>
                `;

                const ignoredFields = [
                    "name",
                    "owner",
                    "creation",
                    "modified",
                    "modified_by",
                    "docstatus",
                    "idx",
                    "parent",
                    "parentfield",
                    "parenttype",
                    "doctype"
                ];

                logs.forEach(function (log, index) {

                    html += `
                        <div class="task-log-entry">

                            <h3>Log Entry ${index + 1}</h3>

                            <div class="task-log-grid">

                                <div class="task-log-cell">
                                    <strong>Log ID</strong>
                                    <span>${escapeHTML(log.name || "-")}</span>
                                </div>

                                <div class="task-log-cell">
                                    <strong>Today</strong>
                                    <span>${escapeHTML(formatDate(log.today))}</span>
                                </div>

                                <div class="task-log-cell">
                                    <strong>Task ID</strong>
                                    <span>${escapeHTML(log.task_id || taskId)}</span>
                                </div>

                            </div>

                           
                    
                    `;

                    // // DISPLAY MEMBERS

                    // let memberCount = 0;

                    // (log.members || []).forEach(function (member) {

                    //     let memberName =
                    //         member.member_name ||
                    //         member.full_name ||
                    //         member.member ||
                    //         member.user_name ||
                    //         member.user ||
                    //         member.email;

                    //     if (!memberName) {

                    //         Object.keys(member).some(function (key) {

                    //             if (
                    //                 !ignoredFields.includes(key) &&
                    //                 typeof member[key] === "string" &&
                    //                 member[key]
                    //             ) {

                    //                 memberName = member[key];

                    //                 return true;
                    //             }

                    //             return false;
                    //         });

                    //     }

                    //     if (memberName) {

                    //         memberCount++;

                    //         html += `
                    //             <li>${escapeHTML(memberName)}</li>
                    //         `;

                    //     }

                    // });

                    // if (!memberCount) {

                    //     html += `
                    //         <li>No member information recorded.</li>
                    //     `;

                    // }

                    // html += `
                    //         </ul>

                    //         <h3 class="task-log-comments-heading">
                    //             Comments
                    //         </h3>

                    //         <div class="task-log-comments">
                    // `;

                    // DISPLAY COMMENTS

                    if (log.comments && log.comments.length > 0) {

                        log.comments.forEach(function (comment) {

                            const author =
                                comment.who_commented ||
                                comment.comment_by ||
                                comment.comment_email ||
                                comment.owner ||
                                "Unknown user";

                            const commentContent =$("<div>")
                                .html(comment.content || "")
                                .text()
                                .trim()
                                .replace(/\s+/g, " ");

                            const commentDate =
                                comment.date_time ||
                                comment.creation;

                            html += `
                                <div class="task-log-comment">

                                    <div class="task-log-comment-content">
                                        ${escapeHTML(commentContent)}
                                    </div>

                                    <div class="blog-author">

                                        <div class="author-avatar">
                                            ${
                                                (author || "Administrator")
                                                    .charAt(0)
                                                    .toUpperCase()
                                            }
                                        </div>

                                        <div class="author-info">

                                            <div class="author-name">
                                                ${escapeHTML(author)}
                                            </div>

                                            <div class="author-meta">
                                                ${escapeHTML(
                                                    commentDate
                                                        ? formatDate(commentDate)
                                                        : "Date unavailable"
                                                )}
                                            </div>

                                        </div>

                                    </div>

                                </div>
                            `;

                        });

                    } else {

                        html += `
                            <p class="no-task-comments">
                                No comments recorded for this log.
                            </p>
                        `;

                    }

                    html += `
                            </div>

                        </div>
                    `;

                });

                html += `
                    </article>
                `;

                $main.html(html);

                $main.off("click", ".blog-close-btn");
                $main.on("click", ".blog-close-btn", function(){
                    window.history.back();
                }); 

            },

            error: function (error) {

                console.error(
                    "FAILED TO LOAD TASK LOG:",
                    error
                );

                showError(
                    "Unable to Load Task Log",
                    "Check the Python backend method and browser console.",
                    taskId
                );

            }

        });

    }

};