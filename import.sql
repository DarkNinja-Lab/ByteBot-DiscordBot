CREATE DATABASE IF NOT EXISTS `discord`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_uca1400_ai_ci;

USE `discord`;

CREATE TABLE IF NOT EXISTS `automod_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guild_id` varchar(50) DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `automod_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guild_id` varchar(50) NOT NULL,
  `trigger_type` varchar(50) DEFAULT NULL,
  `action_type` varchar(50) DEFAULT NULL,
  `keyword_list` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `enabled` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `guild_id` (`guild_id`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `bot_status` (
  `id` int(11) NOT NULL DEFAULT 1,
  `status_text` varchar(255) NOT NULL,
  `status_type` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `config` (
  `guild_id` varchar(20) NOT NULL,
  `log_channel_id` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `feedback_settings` (
  `guild_id` varchar(20) NOT NULL,
  `feedback_channel_id` varchar(20) NOT NULL,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `levels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL,
  `guild_id` varchar(255) NOT NULL,
  `xp` int(11) DEFAULT 0,
  `level` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_guild` (`user_id`, `guild_id`),
  KEY `idx_levels_guild_ranking` (`guild_id`, `level`, `xp`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `levelup_channels` (
  `guild_id` varchar(255) NOT NULL,
  `channel_id` varchar(255) NOT NULL,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `level_settings` (
  `guild_id` varchar(255) NOT NULL,
  `points_per_level` int(11) NOT NULL DEFAULT 100,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `reaction_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guild_id` varchar(255) NOT NULL,
  `message_id` varchar(255) NOT NULL,
  `emoji` varchar(255) NOT NULL,
  `role_id` varchar(255) NOT NULL,
  `channel_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reaction_roles_guild_message` (`guild_id`, `message_id`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `server_config` (
  `guild_id` varchar(20) NOT NULL,
  `default_role_id` varchar(20) DEFAULT NULL,
  `welcome_channel_id` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;