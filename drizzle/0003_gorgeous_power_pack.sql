CREATE TABLE `work_count_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_count_id` integer NOT NULL,
	`step_id` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`recorded_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`work_count_id`) REFERENCES `work_counts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`step_id`) REFERENCES `process_steps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `work_counts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`process_chart_id` integer NOT NULL,
	`name` text NOT NULL,
	`period` text DEFAULT 'weekly' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`process_chart_id`) REFERENCES `process_charts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `process_charts` ADD `chart_state` text DEFAULT 'current' NOT NULL;--> statement-breakpoint
ALTER TABLE `process_charts` ADD `linked_chart_id` integer;