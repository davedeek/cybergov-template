-- Recreate work_counts table: replace process_chart_id with unit_id, add share_token and updated_at
CREATE TABLE `work_counts_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unit_id` integer NOT NULL,
	`name` text NOT NULL,
	`period` text DEFAULT 'weekly' NOT NULL,
	`share_token` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Backfill unit_id from process_charts via the old process_chart_id
INSERT INTO `work_counts_new` (`id`, `unit_id`, `name`, `period`, `created_at`, `updated_at`)
SELECT wc.`id`, pc.`unit_id`, wc.`name`, wc.`period`, wc.`created_at`, wc.`created_at`
FROM `work_counts` wc
JOIN `process_charts` pc ON pc.`id` = wc.`process_chart_id`;
--> statement-breakpoint
DROP TABLE `work_counts`;
--> statement-breakpoint
ALTER TABLE `work_counts_new` RENAME TO `work_counts`;
--> statement-breakpoint
-- Recreate work_count_entries: add description, sequence_number; make step_id nullable
CREATE TABLE `work_count_entries_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`work_count_id` integer NOT NULL,
	`step_id` integer,
	`description` text NOT NULL,
	`sequence_number` integer DEFAULT 0 NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`recorded_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`work_count_id`) REFERENCES `work_counts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`step_id`) REFERENCES `process_steps`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
-- Backfill description from process_steps
INSERT INTO `work_count_entries_new` (`id`, `work_count_id`, `step_id`, `description`, `sequence_number`, `count`, `recorded_at`)
SELECT wce.`id`, wce.`work_count_id`, wce.`step_id`, COALESCE(ps.`description`, 'Unknown step'), ps.`sequence_number`, wce.`count`, wce.`recorded_at`
FROM `work_count_entries` wce
LEFT JOIN `process_steps` ps ON ps.`id` = wce.`step_id`;
--> statement-breakpoint
DROP TABLE `work_count_entries`;
--> statement-breakpoint
ALTER TABLE `work_count_entries_new` RENAME TO `work_count_entries`;
