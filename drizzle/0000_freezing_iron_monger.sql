CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`experience` text NOT NULL,
	`created_at` text NOT NULL,
	`request_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reservations_request_id_unique` ON `reservations` (`request_id`);