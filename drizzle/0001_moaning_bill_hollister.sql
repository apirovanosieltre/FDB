CREATE TABLE `admin_login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`bucket` integer NOT NULL,
	`attempts` integer NOT NULL
);
