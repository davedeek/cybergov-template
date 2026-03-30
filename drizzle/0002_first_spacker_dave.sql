CREATE TABLE `units` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_by_user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wdc_activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wdc_chart_id` integer NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`wdc_chart_id`) REFERENCES `wdc_charts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `wdc_charts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unit_id` integer NOT NULL,
	`name` text NOT NULL,
	`snapshot_date` integer,
	`hours_threshold` integer DEFAULT 40 NOT NULL,
	`share_token` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wdc_charts_share_token_unique` ON `wdc_charts` (`share_token`);--> statement-breakpoint
CREATE TABLE `wdc_employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wdc_chart_id` integer NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`fte` text DEFAULT '1.0' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`wdc_chart_id`) REFERENCES `wdc_charts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `wdc_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wdc_chart_id` integer NOT NULL,
	`employee_id` integer NOT NULL,
	`activity_id` integer NOT NULL,
	`task_name` text NOT NULL,
	`hours_per_week` integer NOT NULL,
	FOREIGN KEY (`wdc_chart_id`) REFERENCES `wdc_charts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_id`) REFERENCES `wdc_employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activity_id`) REFERENCES `wdc_activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `process_charts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unit_id` integer NOT NULL,
	`name` text NOT NULL,
	`start_point` text,
	`end_point` text,
	`storage_warn_minutes` integer DEFAULT 480 NOT NULL,
	`distance_warn_feet` integer DEFAULT 200 NOT NULL,
	`share_token` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `process_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`process_chart_id` integer NOT NULL,
	`sequence_number` integer NOT NULL,
	`symbol` text NOT NULL,
	`description` text NOT NULL,
	`who` text,
	`minutes` integer,
	`feet` integer,
	`notes` text,
	FOREIGN KEY (`process_chart_id`) REFERENCES `process_charts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `step_annotations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`step_id` integer NOT NULL,
	`question` text NOT NULL,
	`note` text NOT NULL,
	`proposed_action` text DEFAULT 'none' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`step_id`) REFERENCES `process_steps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `proposed_changes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unit_id` integer NOT NULL,
	`chart_type` text NOT NULL,
	`chart_id` integer NOT NULL,
	`description` text NOT NULL,
	`before_state` text,
	`after_state` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`details` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
