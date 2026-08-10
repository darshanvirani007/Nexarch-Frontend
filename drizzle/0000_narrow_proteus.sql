CREATE TABLE `encrypted_key_vaults` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_email` text NOT NULL,
	`business_id` text NOT NULL,
	`ciphertext` text NOT NULL,
	`salt` text NOT NULL,
	`iv` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `encrypted_key_vaults_owner_business_idx` ON `encrypted_key_vaults` (`owner_email`,`business_id`);