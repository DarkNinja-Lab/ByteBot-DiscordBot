-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               11.6.2-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for discord
CREATE DATABASE IF NOT EXISTS `discord` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;
USE `discord`;

-- Dumping structure for table discord.automod_logs
CREATE TABLE IF NOT EXISTS `automod_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guild_id` varchar(50) DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Dumping structure for table discord.automod_settings
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Dumping structure for table discord.bot_status
CREATE TABLE IF NOT EXISTS `bot_status` (
  `id` int(11) NOT NULL DEFAULT 1,
  `status_text` varchar(255) NOT NULL,
  `status_type` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Dumping structure for table discord.bump_reminders
CREATE TABLE IF NOT EXISTS `bump_reminders` (
  `guild_id` varchar(20) NOT NULL,
  `channel_id` varchar(20) NOT NULL,
  `role_id` varchar(20) NOT NULL,
  `last_bump` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Dumping structure for table discord.config
CREATE TABLE IF NOT EXISTS `config` (
  `guild_id` varchar(20) NOT NULL,
  `log_channel_id` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping structure for table discord.feedback_settings
CREATE TABLE IF NOT EXISTS `feedback_settings` (
  `guild_id` varchar(20) NOT NULL,
  `feedback_channel_id` varchar(20) NOT NULL,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Dumping structure for table discord.levels
CREATE TABLE IF NOT EXISTS `levels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL,
  `guild_id` varchar(255) NOT NULL,
  `xp` int(11) DEFAULT 0,
  `level` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Dumping structure for table discord.levelup_channels
CREATE TABLE IF NOT EXISTS `levelup_channels` (
  `guild_id` varchar(255) NOT NULL,
  `channel_id` varchar(255) NOT NULL,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Dumping structure for table discord.level_settings
CREATE TABLE IF NOT EXISTS `level_settings` (
  `guild_id` varchar(255) NOT NULL,
  `points_per_level` int(11) NOT NULL DEFAULT 100,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Dumping structure for table discord.reaction_roles
CREATE TABLE IF NOT EXISTS `reaction_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guild_id` varchar(255) NOT NULL,
  `message_id` varchar(255) NOT NULL,
  `emoji` varchar(255) NOT NULL,
  `role_id` varchar(255) NOT NULL,
  `channel_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping structure for table discord.server_config
CREATE TABLE IF NOT EXISTS `server_config` (
  `guild_id` varchar(20) NOT NULL,
  `default_role_id` varchar(20) DEFAULT NULL,
  `welcome_channel_id` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`guild_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
