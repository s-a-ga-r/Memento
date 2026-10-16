import frappe


@frappe.whitelist()
def get_task_logs(task_id):
    """
    Fetch Task Log records for a task,
    including Members and built-in Comments.
    """

    if not task_id:
        frappe.throw("Task ID is required.")

    # Confirm that the task exists.
    if not frappe.db.exists("Tasks", task_id):
        frappe.throw(f"Task {task_id} does not exist.")

    # Fetch Task Log records linked to this task.
    logs = frappe.get_list(
        "Task Log",
        filters={
            "task_id": task_id
        },
        fields=[
            "name",
            "today",
            "task_id",
            "creation"
        ],
        order_by="today desc",
        limit_page_length=100
    )

    result = []

    for log in logs:

        # Load the complete Task Log document.
        log_doc = frappe.get_doc("Task Log", log.name)

        # Verify read permission.
        log_doc.check_permission("read")

        # FETCH MEMBERS CHILD-TABLE INFORMATIO

        members = []

        for member in log_doc.get("members") or []:

            member_data = {}

            for field, value in member.as_dict().items():

                if field not in [
                    "name",
                    "doctype",
                    "parent",
                    "parenttype",
                    "parentfield",
                    "idx",
                    "owner",
                    "creation",
                    "modified",
                    "modified_by",
                    "docstatus"
                ] and value not in (None, ""):

                    member_data[field] = value

            if member_data:
                members.append(member_data)
        # FETCH COMMENTS FROM COMMENT DOCTYPE

        comments = frappe.get_all(
            "Comment",
            filters={
                "reference_doctype": "Task Log",
                "reference_name": log_doc.name,
                "comment_type": "Comment"
            },
            fields=[
                "name",
                "content",
                "comment_by",
                "comment_email",
                "owner",
                "creation"
            ],
            order_by="creation asc"
        )

        # PREPARE COMMENT INFORMATION
        comment_data = []

        for comment in comments:

            comment_data.append({
                "name": comment.name,

                # Person who made the comment.
                "who_commented": (
                    comment.comment_by
                    or comment.comment_email
                    or comment.owner
                    or "Unknown user"
                ),

                # Actual comment text.
                "content": comment.content,

                # Date and time the comment was created.
                "date_time": comment.creation
            })
        # RETURN TASK LOG, MEMBERS AND COMMENTS
        result.append({
            "name": log_doc.name,
            "today": log_doc.today,
            "task_id": log_doc.task_id,
            "creation": log_doc.creation,
            "members": members,
            "comments": comment_data
        })

    return result