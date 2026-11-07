# Copyright (c) 2026, Sagar Patil and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime,get_datetime

class Tasks(Document):
	def before_insert(self):
		if not self.task_start_time:
			self.task_start_time = now_datetime()

	def on_update(self):
		if self.status == "Completed" and not self.task_end_time:
			end_time = now_datetime()
			duration = (get_datetime(end_time) - get_datetime(self.task_start_time)).total_seconds() / 3600  # Calculate duration in hours
			self.db_set("task_end_time",end_time)
			self.db_set("total_duration", round(duration, 2))

		elif self.status != "Completed" and self.task_end_time:
			self.db_set("task_end_time", None)
			self.db_set("total_duration", 0)
