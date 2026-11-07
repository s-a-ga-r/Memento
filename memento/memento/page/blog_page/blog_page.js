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

    function loadPrism() {

        const base =
            "https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/";

        // LOAD PRISM THEME CSS
        function loadPrismCSS() {

            if (window.mementoPrismCSSPromise) {
                return window.mementoPrismCSSPromise;
            }

            window.mementoPrismCSSPromise = new Promise(function (resolve, reject) {

                const link = document.createElement("link");

                link.id = "memento-prism-css";
                link.rel = "stylesheet";
                link.href = base + "themes/prism-tomorrow.min.css";

                link.onload = resolve;
                link.onerror = reject;

                document.head.appendChild(link);

            });

            return window.mementoPrismCSSPromise;
        }

        // LOAD JAVASCRIPT FILE
        function loadScript(url) {

            return new Promise(function (resolve, reject) {

                const script = document.createElement("script");

                script.src = url;
                script.onload = resolve;
                script.onerror = reject;

                document.head.appendChild(script);

            });
        }

        if (window.mementoPrismPromise) {
            return Promise.all([
                window.mementoPrismPromise,
                loadPrismCSS()
            ]);
        }

        window.mementoPrismPromise = loadPrismCSS()

            .then(function () {

                if (!window.Prism) {
                    return loadScript(base + "prism.min.js");
                }

            })

            .then(function () {

                if (!window.Prism.languages.python) {
                    return loadScript(
                        base + "components/prism-python.min.js"
                    );
                }

            })

            .then(function () {

                if (!window.Prism.languages.javascript) {
                    return loadScript(
                        base + "components/prism-javascript.min.js"
                    );
                }

            });

        return window.mementoPrismPromise;
    }

    // LOAD PYTHON FORMATTER (PYODIDE + BLACK)

    function loadPythonFormatter() {

        if (window.mementoPyodide) {
            return Promise.resolve(window.mementoPyodide);
        }

        if (window.mementoPythonFormatterPromise) {
            return window.mementoPythonFormatterPromise;
        }

        const version = "314.0.7";

        const base =
            `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;

        window.mementoPythonFormatterPromise = new Promise(
            function (resolve, reject) {

                const script = document.createElement("script");

                script.src = base + "pyodide.js";

                script.onload = async function () {

                    try {

                        const pyodide = await loadPyodide({
                            indexURL: base
                        });

                        await pyodide.loadPackage("micropip");

                        const micropip = pyodide.pyimport("micropip");

                        await micropip.install("black");

                        micropip.destroy();

                        window.mementoPyodide = pyodide;

                        console.log(
                            "Python formatter loaded successfully."
                        );

                        resolve(pyodide);

                    } catch (error) {

                        reject(error);

                    }
                };

                script.onerror = reject;

                document.head.appendChild(script);

            }
        );

        return window.mementoPythonFormatterPromise;
    }

    // AUTOMATIC PYTHON INDENTATION RECOVERY

    function repairPythonIndentation(sourceCode) {

        const lines = sourceCode
            .replace(/\t/g, "    ")
            .split("\n");

        const result = [];

        let indentLevel = 0;
        let previousBlock = false;

        const dedentKeywords = /^(elif\b|else\s*:|except\b|finally\s*:)/;

        const blockPattern =
            /^(async\s+def|def|class|if|elif|else|for|while|try|except|finally|with|async\s+with|async\s+for|match|case)\b/;

        const topLevelPattern =
            /^(def|class|async\s+def|import|from|@|if\s+__name__)/;

        for (let i = 0; i < lines.length; i++) {

            const rawLine = lines[i];

            const line = rawLine.trim();

            if (!line) {
                result.push("");
                continue;
            }

            // Handle comments
            if (line.startsWith("#")) {
                result.push("    ".repeat(indentLevel) + line);
                continue;
            }

            // Dedent before elif, else, except and finally
            if (dedentKeywords.test(line)) {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            // Detect new top-level declarations
            if (
                topLevelPattern.test(line) &&
                !dedentKeywords.test(line)
            ) {
                indentLevel = 0;
            }

            // Apply indentation
            result.push(
                "    ".repeat(indentLevel) + line
            );

            // Increase indentation after block declarations
            if (
                blockPattern.test(line) &&
                /:\s*(#.*)?$/.test(line)
            ) {
                indentLevel++;
                previousBlock = true;
            } else {
                previousBlock = false;
            }
        }

        return result.join("\n");
    }
    // FORMAT PYTHON CODE BLOCKS

    async function formatPythonCodeBlocks() {

        const codeBlocks = $main.find(
            ".code-card code.language-python"
        );

        console.log(
            "PYTHON CODE BLOCKS FOUND:",
            codeBlocks.length
        );

        if (!codeBlocks.length) return;

        try {

            const pyodide = await loadPythonFormatter();

            console.log("Black formatter loaded.");

            for (const element of codeBlocks) {

                const originalCode = element.textContent;

                console.log(
                    "ORIGINAL PYTHON CODE:",
                    JSON.stringify(originalCode)
                );

                try {

                    pyodide.globals.set(
                        "source_code",
                        originalCode
                    );

                    let formattedCode;

                    try {

                        // FIRST: TRY ORIGINAL CODE

                        formattedCode = pyodide.runPython(`
    import black

    black.format_str(
        source_code,
        mode=black.FileMode()
    )
                        `);

                        console.log(
                            "ORIGINAL CODE IS VALID."
                        );

                    } catch (error) {

                        console.log(
                            "INDENTATION RECOVERY REQUIRED."
                        );

                        // SECOND: REPAIR INDENTATION

                        const recoveredCode =
                            repairPythonIndentation(originalCode);

                        console.log(
                            "RECOVERED PYTHON CODE:",
                            JSON.stringify(recoveredCode)
                        );

                        pyodide.globals.set(
                            "source_code",
                            recoveredCode
                        );

                        // THIRD: FORMAT RECOVERED CODE

                        formattedCode = pyodide.runPython(`
    black.format_str(
        source_code,
        mode=black.FileMode()
    )
                        `);

                        console.log(
                            "PYTHON INDENTATION RECOVERED SUCCESSFULLY."
                        );

                    }

                    // DISPLAY FINAL CODE

                    element.textContent = formattedCode;

                    console.log(
                        "FINAL FORMATTED PYTHON CODE:",
                        formattedCode
                    );

                } catch (error) {

                    console.error(
                        "PYTHON FORMATTING FAILED. ORIGINAL CODE PRESERVED:",
                        error
                    );

                    element.textContent = originalCode;

                } finally {

                    pyodide.globals.delete("source_code");

                }

            }

        } catch (error) {

            console.error(
                "PYTHON FORMATTER LOADING ERROR:",
                error
            );

        }

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

    // FORMAT PROJECT DESCRIPTION CODE BLOCKS

    function formatProjectDescription(description) {

        if (!description) return "";

        const doc = new DOMParser().parseFromString(
            description,
            "text/html"
        );

        doc.querySelectorAll(
            "pre.ql-code-block-container"
        ).forEach((pre) => {

            const codeLines = Array.from(
                pre.querySelectorAll(".ql-code-block")
            ).map((line) => {

                return line.textContent
                    .replace(/\u00a0/g, " ")
                    .replace(/\t/g, "    ");


            });

            const codeText = codeLines.join("\n");
            console.log("QUILL ORIGINAL CODE:", JSON.stringify(codeText));

            const codeCard = document.createElement("div");

            codeCard.className = "code-card";

            const header = document.createElement("div");

            header.className = "code-header";

            header.innerHTML = `
                <span class="code-language">Code</span>
                <button type="button" class="copy-code">Copy</button>
            `;

            const codePre = document.createElement("pre");

            const code = document.createElement("code");

            code.className = "language-python";

            code.textContent = codeText;

            codePre.appendChild(code);

            codeCard.appendChild(header);

            codeCard.appendChild(codePre);

            pre.replaceWith(codeCard);

        });

        return doc.body.innerHTML;
    }

    // FORMAT DATE

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
    // FORMAT TASK DESCRIPTION HTML

    function formatTaskDescription(description) {

        if (!description) return "";

        const parser = new DOMParser();

        const doc = parser.parseFromString(
            String(description),
            "text/html"
        );

        const editor = doc.querySelector(".ql-editor");

        const source = editor || doc.body;

        const allowedTags = new Set([
            "P", "BR",
            "STRONG", "B",
            "EM", "I",
            "U", "S",
            "H1", "H2", "H3",
            "H4", "H5", "H6",
            "UL", "OL", "LI",
            "BLOCKQUOTE",
            "PRE", "CODE",
            "A"
        ]);

        function cleanNode(node) {

            if (node.nodeType === Node.TEXT_NODE) {
                return document.createTextNode(node.textContent);
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return document.createDocumentFragment();
            }

            const tag = node.tagName;

            const fragment = document.createDocumentFragment();

            // Remove unsupported tags but preserve their text
            if (!allowedTags.has(tag)) {

                node.childNodes.forEach(child => {
                    fragment.appendChild(cleanNode(child));
                });

                return fragment;
            }

            const element = document.createElement(tag.toLowerCase());

            // Allow safe links only
            if (tag === "A") {

                const href = node.getAttribute("href");

                if (href && /^(https?:|mailto:)/i.test(href)) {
                    element.setAttribute("href", href);
                    element.setAttribute("target", "_blank");
                    element.setAttribute("rel", "noopener noreferrer");
                }

            }

            node.childNodes.forEach(child => {
                element.appendChild(cleanNode(child));
            });

            return element;
        }

        const output = document.createElement("div");

        source.childNodes.forEach(node => {
            output.appendChild(cleanNode(node));
        });

        return output.innerHTML;
    }

    // EXIT BUTTON

    function bindCloseButton() {

        $main.off("click", ".blog-close-btn");

        $main.on("click", ".blog-close-btn", function () {

            frappe.set_route("projec-track");

        });
    }

    // SHOW ERROR

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

    // HANDLE BLOG ROUTE

    function handleBlogRoute() {

        const route = frappe.get_route();

        console.log("CURRENT BLOG ROUTE:", route);

        // Run only when the current page is blog-page
        if (!route || route[0] !== "blog-page") {
            return;
        }

        const routeId = route[1];

        console.log("CURRENT BLOG ID:", routeId);

        // Clear previous blog content
        $main.empty();

        if (!routeId) {
            showError(
                "No Blog Selected",
                "Please select a Project or Task.",
                null
            );
            return;
        }

        // TASK BLOG
        if (routeId.startsWith("TSK-")) {

            console.log("TASK BLOG DETECTED:", routeId);

            loadTaskBlog(routeId);
            return;
        }

        // PROJECT BLOG
        if (routeId.startsWith("PRJ-")) {

            console.log("PROJECT BLOG DETECTED:", routeId);

            loadProjectBlog(routeId);
            return;
        }

        // INVALID ROUTE
        showError(
            "Invalid Blog ID",
            "Unable to identify the selected Project or Task.",
            routeId
        );
    }


    // Listen for route changes
    frappe.router.on("change", handleBlogRoute);

    // Load the current route initially
    handleBlogRoute();

    // LOAD MY PROJECTS DOCUMENT

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

            console.log(
                "PROJECT DATA RECEIVED:",
                project
            );

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

    // RENDER PROJECT BLOG

    function renderProjectBlog(project) {

        console.log(
            "PROJECT DESCRIPTION HTML:",
            project.description
        );

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


                <!-- AUTHOR -->

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

                    ${formatProjectDescription(project.description)}

                </div>


                <h2 id="about-project">
                    About Project
                </h2>

                <div class="project-about">
                    ${formatProjectDescription(project.about || "No information available.")}
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

                        <span>
                            ${escapeHTML(project.name || "-")}
                        </span>

                    </div>


                    <div class="detail-row">

                        <strong>Category</strong>

                        <span>
                            ${escapeHTML(project.category || "-")}
                        </span>

                    </div>


                    <div class="detail-row">

                        <strong>Priority</strong>

                        <span>
                            ${escapeHTML(project.priority_level || "-")}
                        </span>

                    </div>


                    <div class="detail-row">

                        <strong>Status</strong>

                        <span>
                            ${escapeHTML(project.status || "-")}
                        </span>

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

                    <a
                        href="#"
                        class="blog-tag"
                        data-target="blog-start"
                    >
                        memento
                    </a>

                    <a
                        href="#"
                        class="blog-tag"
                        data-target="about-project"
                    >
                        frappe
                    </a>

                </div>


            </article>

        `);

        bindProjectBlogEvents(project);

        // FORMAT PYTHON FIRST AND THEN APPLY SYNTAX HIGHLIGHTING

       formatPythonCodeBlocks()

    .then(function () {

        return loadPrism();

    })

    .then(function () {

        // Remove previous highlighting if any
        $main.find("code.language-python").each(function () {

            if (this.dataset.highlighted) {
                delete this.dataset.highlighted;
            }

            window.Prism.highlightElement(this);

        });

        console.log("PYTHON SYNTAX HIGHLIGHTING APPLIED");

    })

    .catch(function (error) {

        console.error(
            "PRISM FORMATTING OR HIGHLIGHTING ERROR:",
            error
        );

    });

    }

    // PROJECT BLOG EVENTS

    function bindProjectBlogEvents(project) {

        $main.off("click", ".blog-close-btn");

        $main.off("click", ".blog-edit-btn");

        $main.off("click", ".copy-code");

        $main.off("click", ".blog-tag");

        // CLOSE

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

                    console.error(
                        "FAILED TO COPY CODE:",
                        error
                    );

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

    // LOAD TASK BLOG

    function loadTaskBlog(taskId) {

        frappe.db.get_doc("Tasks", taskId)

        .then(function(task) {

            $main.html(`

                <article class="memento-blog task-blog">

                    <div class="blog-actions">

                        <button
                            class="view-task-logs-btn"
                            type="button"
                        >
                            View Task Logs
                        </button>

                        <button
                            class="task-edit-btn"
                            type="button"
                        >
                            Edit
                        </button>
                        
                        <button
                            class="blog-close-btn"
                            type="button"
                        >
                            Close
                        </button>


                    </div>

                    <h1 class="blog-title">
                        ${escapeHTML(
                            task.subject ||
                            task.task_name ||
                            task.name
                        )}
                    </h1>

                    <h2>Task Description</h2>

                    <div class="task-description">
                        ${
                            task.description
                                ? formatTaskDescription(task.description)
                                : "No description available."
                        }
                    </div>

                </article>

            `);

            // VIEW TASK LOGS BUTTON

            $main.off("click", ".view-task-logs-btn");

            $main.on("click", ".view-task-logs-btn", function() {

                loadTaskLog(taskId);

            });
            // EDIT TASK BUTTON

            $main.off("click", ".task-edit-btn");

            $main.on("click", ".task-edit-btn", function() {

                frappe.set_route(
                    "Form",
                    "Tasks",
                    taskId
                );

            });
             // CLOSE BUTTON

            $main.off("click", ".blog-close-btn");

            $main.on("click", ".blog-close-btn", function() {

                window.history.back();

            });

        })

        .catch(function(error) {

            console.error("FAILED TO LOAD TASK:", error);

            showError(
                "Unable to Load Task",
                "Could not fetch the Tasks document.",
                taskId
            );

        });

    }
    // LOAD TASK LOG

    function loadTaskLog(taskId) {

        $main.html(`

            <article class="memento-blog task-log-blog">

                <div class="blog-actions">

                    <button
                        class="blog-close-btn"
                        type="button"
                    >
                        Close
                    </button>

                </div>

                <h1 class="blog-title">

                    Task Log

                </h1>

                <p class="blog-intro">

                    Loading Task Log information...

                </p>

            </article>

        `);


        // TASK LOG CLOSE — GO BACK ONE STEP

        $main.off("click", ".blog-close-btn");

        $main.on("click", ".blog-close-btn", function () {

            loadTaskBlog(taskId);

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
                    <div class="task-log-layout">


                    <article class="memento-blog task-log-blog">

                        <div class="blog-actions">

                            <button
                                class="blog-close-btn"
                                type="button"
                            >
                                Close
                            </button>

                        </div>


                        <h1 class="blog-title">

                            Task Log

                        </h1>


                        <p class="blog-intro">

                            Task Log records, members, and comments.

                        </p>

                        <div class="task-log-summary">


                            <div class="task-log-cell">

                                <strong>Task ID</strong>

                                <span>
                                    ${escapeHTML(taskId)}
                                </span>

                            </div>


                            <div class="task-log-cell">

                                <strong>Total Log Entries</strong>

                                <span>
                                    ${logs.length}
                                </span>

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

                        <div
                            class="task-log-entry"
                            data-log-date="${escapeHTML(
                                String(log.today || "").slice(0, 10)
                            )}"
                        >

                            <h3 class="task-log-date-heading">
                                ${escapeHTML(
                                    log.today ? formatDate(log.today) : "Date unavailable"
                                )}
                            </h3>

                    `;

                    // DISPLAY COMMENTS

                    if (log.comments && log.comments.length > 0) {

                        log.comments.forEach(function (comment) {

                            const author =

                                comment.who_commented ||
                                comment.comment_by ||
                                comment.comment_email ||
                                comment.owner ||
                                "Unknown user";


                            const commentContent = $("<div>")
                                .html(comment.content || "")
                                .text()
                                .trim()
                                .replace(/\s+/g, " ");


                            const commentDate =
                                comment.date_time ||
                                comment.creation;

                            html += `

                                <div class="task-log-comment">

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

                                    <div class="task-log-comment-content">
                                        ${escapeHTML(commentContent)}
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

                    `;

                });


                html += `

                    </article>

                    <aside class="task-log-sidebar">

                        <h3>Our Sidebar</h3>

                        <div
                            class="task-sidebar-item"
                            id="all-tasks-link"
                        >
                            All Tasks Logs
                        </div>

                        <div
                            class="task-sidebar-item"
                            id="today-tasks-link"
                        >
                            Today's Tasks Logs
                        </div>

                        <div class="task-sidebar-item">

                            <label for="sidebar-task-date">
                                Select Date
                            </label>

                            <input
                                type="text"
                                id="sidebar-task-date"
                                placeholder="DD-MM-YYYY"
                                autocomplete="off"
                            >

                        </div>

                        <div
                            class="task-sidebar-item"
                            id="task-log-back"
                        >
                            ← Back
                        </div>

                    </aside>

                </div>

            `;


                $main.html(html);

                $main.off("click", ".blog-close-btn");

                $main.on("click", ".blog-close-btn", function () {

                    loadTaskBlog(taskId);


                });
                // LOAD FLATPICKR DATE PICKER

                function loadFlatpickr() {

                    if (window.flatpickr) {
                        return Promise.resolve();
                    }

                    // Load CSS
                    if (!document.getElementById("flatpickr-css")) {

                        const link = document.createElement("link");

                        link.id = "flatpickr-css";
                        link.rel = "stylesheet";
                        link.href =
                            "https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css";

                        document.head.appendChild(link);

                    }

                    // Load JavaScript
                    return new Promise(function (resolve, reject) {

                        const script = document.createElement("script");

                        script.src =
                            "https://cdn.jsdelivr.net/npm/flatpickr";

                        script.onload = resolve;
                        script.onerror = reject;

                        document.head.appendChild(script);

                    });

                }

                // FILTER TASK LOGS

                function filterTaskLogsByDate(selectedDate) {

                    let count = 0;

                    $main.find(".task-log-entry").each(function () {

                        const logDate = $(this).attr("data-log-date");

                        const matches = logDate === selectedDate;

                        $(this).toggle(matches);

                        if (matches) {
                            count++;
                        }

                    });

                    $main.find("#task-log-filter-message").text(
                        count + " task log entries found."
                    );

                }

                // SHOW ALL TASK LOGS

                let taskDatePicker = null;

                function showAllTaskLogs() {

                    if (taskDatePicker) {
                        taskDatePicker.clear();
                    }

                    $main.find(".task-log-entry").show();

                    $main.find("#task-log-filter-message").text(
                        "Showing all " + logs.length + " task log entries."
                    );

                }

                // INITIALIZE CALENDAR

                loadFlatpickr()

                .then(function () {

                    const dateInput =
                        $main.find("#sidebar-task-date")[0];

                    if (!dateInput) return;

                    taskDatePicker = flatpickr(dateInput, {

                        dateFormat: "d-m-Y",

                        allowInput: true,

                        clickOpens: true,

                        onChange: function (selectedDates, dateStr) {

                            if (!dateStr) {
                                showAllTaskLogs();
                                return;
                            }

                            const parts = dateStr.split("-");

                            const isoDate =
                                parts[2] + "-" +
                                parts[1] + "-" +
                                parts[0];

                            filterTaskLogsByDate(isoDate);

                        }

                    });

                })

                .catch(function (error) {

                    console.error(
                        "DATE PICKER LOADING FAILED:",
                        error
                    );

                });

                // ALL TASK LOGS

                $main.off("click", "#all-tasks-link");

                $main.on("click", "#all-tasks-link", function () {

                    showAllTaskLogs();

                });
                // TODAY'S TASK LOGS

                $main.off("click", "#today-tasks-link");
                $main.on("click", "#today-tasks-link", function () {

                    const today = frappe.datetime.get_today();

                    if (taskDatePicker) {

                        taskDatePicker.setDate(
                            today,
                            true,
                            "Y-m-d"
                        );

                    }

                });
                // BACK BUTTON

                $main.off("click", "#task-log-back");

                $main.on("click", "#task-log-back", function () {

                    loadTaskBlog(taskId);

                });
                // TASK LOG SIDEBAR FILTERS
                // ALL TASK LOGS - CLEAR DATE FILTER

                $main.off("click", "#all-tasks-link");

                $main.on("click", "#all-tasks-link", function () {

                    // Clear date input fields
                    $main.find("#sidebar-task-date").val("");

                    // Show every task log
                    $main.find(".task-log-entry").each(function () {
                        $(this).show();
                    });

                    // Reset filter message
                    $main.find("#task-log-filter-message").text(
                        "Showing all " + logs.length + " task log entries."
                    );

                });


                // TODAY'S TASK LOGS

                $main.off("click", "#today-tasks-link");

                $main.on("click", "#today-tasks-link", function () {

                    const today = frappe.datetime.get_today();

                    filterTaskLogsByDate(today);

                    $main.find("#task-log-date").val(today);
                    const parts = today.split("-");
                    $main.find("#sidebar-task-date").val(
                        parts[2] + "-" + parts[1] + "-" + parts[0]
                    );

                });


                // BACK

                $main.off("click", "#task-log-back");

                $main.on("click", "#task-log-back", function () {

                    loadTaskBlog(taskId);

                });

                // DATE FILTER
                function filterTaskLogsByDate(selectedDate) {

                    let count = 0;

                    $main.find(".task-log-entry").each(function () {

                        const logDate = $(this).attr("data-log-date");

                        const matches = !selectedDate || logDate === selectedDate;

                        $(this).toggle(matches);

                        if (matches) {
                            count++;
                        }

                    });

                    $main.find("#task-log-filter-message").text(
                        selectedDate
                            ? count + " log entries found."
                            : "Showing all " + logs.length + " log entries."
                    );

                }

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