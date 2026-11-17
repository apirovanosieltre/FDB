ALTER TABLE `reservations` ADD `guest_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `reservations_guest_key_unique` ON `reservations` (`guest_key`);