-- BMS System：テーブル作成とデモ用データ（ローカルの動作確認用）
-- bms-deploy/db/init/01_schema.sql と 02_demo_data.sql をつなげたもの
-- ※ 実行すると project_system_db の22テーブルを作り直します（中のデータは消えます）
CREATE DATABASE IF NOT EXISTS `project_system_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `project_system_db`;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `billing_base_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_base_items` (
  `base_item_id` int NOT NULL AUTO_INCREMENT,
  `base_id` int NOT NULL,
  `version_id` int NOT NULL,
  `building` varchar(50) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `base_quantity` int NOT NULL,
  `unit` varchar(20) NOT NULL DEFAULT '台',
  `unit_price` decimal(10,0) NOT NULL,
  `excluded_quantity` int NOT NULL DEFAULT '0',
  `excluded_reason` varchar(255) DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`base_item_id`),
  KEY `fk_base_items_base` (`base_id`),
  KEY `fk_base_items_version` (`version_id`),
  CONSTRAINT `fk_base_items_base` FOREIGN KEY (`base_id`) REFERENCES `billing_bases` (`base_id`),
  CONSTRAINT `fk_base_items_version` FOREIGN KEY (`version_id`) REFERENCES `billing_base_versions` (`version_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `billing_base_other_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_base_other_items` (
  `base_other_item_id` int NOT NULL AUTO_INCREMENT,
  `base_id` int NOT NULL,
  `version_id` int NOT NULL,
  `fee_name` varchar(50) NOT NULL,
  `default_unit_price` decimal(10,0) NOT NULL,
  `default_quantity` int NOT NULL DEFAULT '1',
  `is_variable` tinyint NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`base_other_item_id`),
  KEY `fk_base_other_base` (`base_id`),
  KEY `fk_base_other_version` (`version_id`),
  CONSTRAINT `fk_base_other_base` FOREIGN KEY (`base_id`) REFERENCES `billing_bases` (`base_id`),
  CONSTRAINT `fk_base_other_version` FOREIGN KEY (`version_id`) REFERENCES `billing_base_versions` (`version_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `billing_base_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_base_versions` (
  `version_id` int NOT NULL AUTO_INCREMENT,
  `base_id` int NOT NULL,
  `version_no` int NOT NULL,
  `quote_id` int DEFAULT NULL COMMENT '元になった見積り（任意）',
  `tax_rate` decimal(4,2) NOT NULL DEFAULT '10.00',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`version_id`),
  UNIQUE KEY `uk_base_version` (`base_id`,`version_no`),
  KEY `fk_version_quote` (`quote_id`),
  CONSTRAINT `fk_version_base` FOREIGN KEY (`base_id`) REFERENCES `billing_bases` (`base_id`),
  CONSTRAINT `fk_version_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`quote_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `billing_bases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_bases` (
  `base_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `base_name` varchar(50) NOT NULL COMMENT 'ベース名',
  `display_order` int NOT NULL DEFAULT '1' COMMENT '表示順',
  `stopped_at` datetime DEFAULT NULL COMMENT '使用停止日時（NULL＝使用中）',
  `tax_rate` decimal(4,2) NOT NULL DEFAULT '10.00',
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`base_id`),
  UNIQUE KEY `uk_base_project_name` (`project_id`,`base_name`),
  CONSTRAINT `fk_billing_bases_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `billing_statement_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_statement_items` (
  `statement_item_id` int NOT NULL AUTO_INCREMENT,
  `statement_id` int NOT NULL,
  `adjustment_quantity` int NOT NULL DEFAULT '0',
  `adjustment_reason` varchar(255) DEFAULT NULL,
  `unit_price` decimal(10,0) NOT NULL,
  `building` varchar(100) DEFAULT NULL COMMENT '棟（緊急・追加作業は場所。任意）',
  `item_name` varchar(100) NOT NULL,
  `unit` varchar(20) NOT NULL,
  `base_quantity` int NOT NULL DEFAULT '0',
  `excluded_quantity` int NOT NULL DEFAULT '0',
  `excluded_reason` varchar(255) DEFAULT NULL,
  `is_temporary` tinyint NOT NULL DEFAULT '0',
  `work_type` varchar(10) DEFAULT NULL COMMENT '緊急／追加（ベースからの行は NULL）',
  `work_date` date DEFAULT NULL COMMENT '実施日',
  `temporary_reason` varchar(255) DEFAULT NULL,
  `markup_rate` decimal(5,2) DEFAULT NULL,
  `policy_agreed` tinyint DEFAULT NULL COMMENT '保存時点の事前承認（1=承認する）',
  `extra_work_id` int DEFAULT NULL COMMENT '取り込み元の緊急・追加作業',
  `display_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`statement_item_id`),
  KEY `fk_stmt_items_statement` (`statement_id`),
  KEY `fk_stmt_items_extra_work` (`extra_work_id`),
  CONSTRAINT `fk_stmt_items_extra_work` FOREIGN KEY (`extra_work_id`) REFERENCES `extra_works` (`extra_work_id`),
  CONSTRAINT `fk_stmt_items_statement` FOREIGN KEY (`statement_id`) REFERENCES `billing_statements` (`statement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `billing_statement_other_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_statement_other_items` (
  `statement_other_item_id` int NOT NULL AUTO_INCREMENT,
  `statement_id` int NOT NULL,
  `fee_name` varchar(50) NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,0) NOT NULL,
  `is_variable` tinyint NOT NULL DEFAULT '0' COMMENT '1=実費（毎回変動）',
  `display_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`statement_other_item_id`),
  KEY `fk_stmt_other_statement` (`statement_id`),
  CONSTRAINT `fk_stmt_other_statement` FOREIGN KEY (`statement_id`) REFERENCES `billing_statements` (`statement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `billing_statements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing_statements` (
  `statement_id` int NOT NULL AUTO_INCREMENT,
  `base_id` int NOT NULL,
  `version_id` int NOT NULL COMMENT 'コピー元のベースの版',
  `billing_month` varchar(7) NOT NULL COMMENT '請求年月（YYYY-MM）',
  `tax_rate` decimal(4,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT '下書き' COMMENT '下書き／確定',
  `issued_date` date DEFAULT NULL COMMENT '発行日（確定時に入力）',
  `created_by` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `confirmed_by` varchar(100) DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`statement_id`),
  KEY `fk_statements_base` (`base_id`),
  KEY `fk_statements_version` (`version_id`),
  CONSTRAINT `fk_statements_base` FOREIGN KEY (`base_id`) REFERENCES `billing_bases` (`base_id`),
  CONSTRAINT `fk_statements_version` FOREIGN KEY (`version_id`) REFERENCES `billing_base_versions` (`version_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `business_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `business_policies` (
  `policy_id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `is_agreed` tinyint NOT NULL,
  `markup_rate` decimal(5,2) DEFAULT NULL,
  `effective_from` datetime NOT NULL,
  `effective_to` datetime DEFAULT NULL,
  `set_by` varchar(100) NOT NULL,
  `set_reason` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`policy_id`),
  KEY `fk_policy_company` (`company_id`),
  CONSTRAINT `fk_policy_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `client_id` int NOT NULL AUTO_INCREMENT,
  `client_name` varchar(100) NOT NULL,
  `client_postalcode` varchar(8) NOT NULL COMMENT '顧客郵便番号',
  `client_address` varchar(100) NOT NULL COMMENT '顧客住所',
  `client_phone` varchar(20) NOT NULL COMMENT '顧客電話番号',
  `client_kana` varchar(100) NOT NULL,
  PRIMARY KEY (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `company_id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(100) NOT NULL,
  `company_postalcode` varchar(8) NOT NULL COMMENT '業者郵便番号',
  `company_address` varchar(100) NOT NULL COMMENT '業者住所',
  `company_phone` varchar(20) NOT NULL COMMENT '業者電話番号',
  `company_kana` varchar(100) NOT NULL,
  PRIMARY KEY (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `doc_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `client_id` int NOT NULL,
  `doc_file_path` varchar(255) NOT NULL,
  `doc_title` varchar(30) NOT NULL,
  `doc_remarks` varchar(100) DEFAULT NULL,
  `doc_type` varchar(50) DEFAULT NULL,
  `doc_created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`doc_id`),
  KEY `fk_documents_projects` (`project_id`),
  KEY `fk_documents_clients` (`client_id`),
  CONSTRAINT `fk_documents_clients` FOREIGN KEY (`client_id`) REFERENCES `clients` (`client_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_documents_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `extra_work_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extra_work_items` (
  `extra_work_item_id` int NOT NULL AUTO_INCREMENT,
  `extra_work_id` int NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `quantity` int NOT NULL,
  `unit` varchar(20) NOT NULL,
  `unit_price` decimal(10,0) NOT NULL COMMENT '当社単価',
  `display_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`extra_work_item_id`),
  KEY `fk_extra_work_items` (`extra_work_id`),
  CONSTRAINT `fk_extra_work_items` FOREIGN KEY (`extra_work_id`) REFERENCES `extra_works` (`extra_work_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `extra_works`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extra_works` (
  `extra_work_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `work_type` varchar(10) NOT NULL COMMENT '緊急／追加',
  `work_date` date NOT NULL COMMENT '実施日',
  `location` varchar(100) DEFAULT NULL COMMENT '場所（任意。例：本館2F 201号室）',
  `content` varchar(255) NOT NULL COMMENT '内容',
  `requester` varchar(50) NOT NULL DEFAULT '' COMMENT '依頼主',
  `markup_rate` decimal(5,2) NOT NULL COMMENT '保存時点の事前承認の加算割合',
  `tax_rate` decimal(4,2) NOT NULL DEFAULT '10.00',
  `status` varchar(10) NOT NULL DEFAULT '下書き' COMMENT '下書き／保留／受注済み',
  `ordered_at` datetime DEFAULT NULL COMMENT '受注した日時',
  `ordered_by` varchar(100) DEFAULT NULL COMMENT '受注した管理者',
  `billed_date` date DEFAULT NULL COMMENT '請求済みにした日（単独の請求書で請求したとき）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`extra_work_id`),
  UNIQUE KEY `uk_extra_works_project` (`project_id`),
  KEY `fk_extra_works_projects` (`project_id`),
  CONSTRAINT `fk_extra_works_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `facility_survey_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facility_survey_items` (
  `survey_item_id` int NOT NULL AUTO_INCREMENT,
  `survey_id` int NOT NULL,
  `building` varchar(50) NOT NULL,
  `floor_label` varchar(50) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `quantity` int NOT NULL,
  `unit` varchar(20) NOT NULL DEFAULT '台',
  `excluded_quantity` int NOT NULL DEFAULT '0',
  `excluded_reason` varchar(255) DEFAULT NULL,
  `order_status` varchar(10) NOT NULL DEFAULT '未',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`survey_item_id`),
  KEY `fk_survey_items_survey` (`survey_id`),
  CONSTRAINT `fk_survey_items_survey` FOREIGN KEY (`survey_id`) REFERENCES `facility_surveys` (`survey_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `facility_surveys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facility_surveys` (
  `survey_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'draft',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`survey_id`),
  KEY `fk_survey_project` (`project_id`),
  CONSTRAINT `fk_survey_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `token_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`),
  UNIQUE KEY `token` (`token`),
  KEY `fk_password_reset_tokens_user` (`user_id`),
  CONSTRAINT `fk_password_reset_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `project_id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL COMMENT 'どこの発注業者から受けた外注か（FK）',
  `client_id` int NOT NULL COMMENT 'エンドの顧客（クライアント）はどこか（FK）',
  `registration_date` date NOT NULL DEFAULT (curdate()),
  `project_name` varchar(100) NOT NULL COMMENT '案件名（例：空調機点検）',
  `contract_type` varchar(10) NOT NULL DEFAULT '定期' COMMENT '契約種別（定期/臨時）',
  `order_route` varchar(10) NOT NULL DEFAULT '見積り' COMMENT '受注の経路（見積り／事前承認）',
  `status` varchar(20) NOT NULL DEFAULT '未判定' COMMENT 'ステータス',
  `project_remarks` varchar(200) DEFAULT NULL COMMENT '特記事項',
  `project_staffname` varchar(30) DEFAULT '未設定' COMMENT '担当者名',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL COMMENT '論理削除日時（NULL=有効）',
  PRIMARY KEY (`project_id`),
  KEY `fk_projects_companies_idx` (`company_id`),
  KEY `fk_projects_clients_idx` (`client_id`),
  KEY `idx_projects_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_projects_clients` FOREIGN KEY (`client_id`) REFERENCES `clients` (`client_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_projects_companies` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quote_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quote_histories` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `quote_id` int NOT NULL,
  `quote_date` date DEFAULT NULL,
  `quote_filepath` varchar(255) DEFAULT NULL,
  `quote_status` varchar(50) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `judge_user` varchar(100) DEFAULT NULL,
  `judge_user_id` int DEFAULT NULL,
  PRIMARY KEY (`history_id`),
  KEY `fk_quote_histories_quotes_idx` (`quote_id`),
  KEY `fk_quote_histories_judge_user_idx` (`judge_user_id`),
  CONSTRAINT `fk_quote_histories_judge_user` FOREIGN KEY (`judge_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quote_histories_quotes` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`quote_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotes` (
  `quote_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `quote_date` date NOT NULL,
  `quote_filepath` varchar(200) NOT NULL,
  `quote_status` varchar(50) NOT NULL DEFAULT '未判定',
  `judge_user` varchar(100) DEFAULT NULL,
  `deadline_date` date DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `quote_type` varchar(20) NOT NULL DEFAULT '通常',
  `change_reason` varchar(255) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL COMMENT '論理削除日時（NULL＝有効）',
  PRIMARY KEY (`quote_id`),
  KEY `fk_quotes_projects` (`project_id`),
  KEY `idx_quotes_project_deleted` (`project_id`,`deleted_at`),
  CONSTRAINT `fk_quotes_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `survey_masters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `survey_masters` (
  `master_id` int NOT NULL AUTO_INCREMENT,
  `master_type` varchar(10) NOT NULL COMMENT 'ITEM=項目 / UNIT=単位 / OTHER=その他項目',
  `name` varchar(100) NOT NULL,
  `default_unit` varchar(20) DEFAULT NULL COMMENT 'ITEM用：既定の単位',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`master_id`),
  UNIQUE KEY `uk_master_type_name` (`master_type`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_change_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_change_histories` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `change_type` varchar(50) NOT NULL,
  `old_value` varchar(255) DEFAULT NULL,
  `new_value` varchar(255) DEFAULT NULL,
  `operated_by` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `fk_user_change_histories_user` (`user_id`),
  CONSTRAINT `fk_user_change_histories_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `login_id` varchar(50) NOT NULL COMMENT 'ログインID',
  `password` varchar(100) NOT NULL COMMENT 'パスワード',
  `name` varchar(50) NOT NULL COMMENT '担当者個人の氏名（例：山田太郎）',
  `role_flag` int NOT NULL DEFAULT '3' COMMENT '1:受注業者(自社) / 2:発注業者(元請け)',
  `company_id` int DEFAULT NULL COMMENT '発注業者の場合のみ会社IDを入れる（受注業者はNULL）',
  `email` varchar(100) NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  KEY `fk_users_companies_idx` (`company_id`),
  CONSTRAINT `fk_users_companies` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

LOCK TABLES `billing_base_items` WRITE;
/*!40000 ALTER TABLE `billing_base_items` DISABLE KEYS */;
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,1,1,'本館','空調機',300,'台',1000,0,NULL,1,1,'2026-10-09 12:06:40','2026-10-09 12:06:40');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (2,1,1,'本館','隠ぺい型空調機',60,'台',2000,1,'3F:医療機器があり脚立を立てられないため(1)',2,1,'2026-10-09 12:06:40','2026-10-09 12:06:40');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (3,1,1,'本館','エアハン',2,'台',3000,0,NULL,3,1,'2026-10-09 12:06:40','2026-10-09 12:06:40');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (4,1,1,'本館','室外機',25,'台',500,0,NULL,4,1,'2026-10-09 12:06:40','2026-10-09 12:06:40');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (5,1,1,'新館','空調機',60,'台',1000,0,NULL,5,1,'2026-10-09 12:06:40','2026-10-09 12:06:40');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (6,1,1,'新館','隠ぺい型空調機',15,'台',2000,0,NULL,6,1,'2026-10-09 12:06:40','2026-10-09 12:06:40');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (7,1,1,'新館','加湿器',15,'台',500,0,NULL,7,1,'2026-10-09 12:06:40','2026-10-09 12:06:40');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (8,1,1,'新館','室外機',10,'台',500,0,NULL,8,1,'2026-10-09 12:06:40','2026-10-09 12:06:40');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (25,3,3,'本館','空調機',300,'台',1000,0,NULL,1,1,'2026-10-09 12:12:55','2026-10-09 12:12:55');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (26,3,3,'本館','隠ぺい型空調機',60,'台',2000,1,'3F:医療機器があり脚立を立てられないため(1)',2,1,'2026-10-09 12:12:55','2026-10-09 12:12:55');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (27,3,3,'本館','エアハン',2,'台',3000,0,NULL,3,1,'2026-10-09 12:12:55','2026-10-09 12:12:55');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (28,3,3,'本館','室外機',25,'台',8000,0,NULL,4,1,'2026-10-09 12:12:55','2026-10-09 12:12:55');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (29,3,3,'新館','空調機',60,'台',1000,0,NULL,5,1,'2026-10-09 12:12:55','2026-10-09 12:12:55');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (30,3,3,'新館','隠ぺい型空調機',15,'台',2000,0,NULL,6,1,'2026-10-09 12:12:55','2026-10-09 12:12:55');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (31,3,3,'新館','加湿器',15,'台',500,0,NULL,7,1,'2026-10-09 12:12:55','2026-10-09 12:12:55');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (32,3,3,'新館','室外機',10,'台',8000,0,NULL,8,1,'2026-10-09 12:12:55','2026-10-09 12:12:55');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (33,4,4,'さくらビル','空調機',60,'台',1000,0,NULL,1,1,'2026-10-09 12:21:11','2026-10-09 12:21:11');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (34,4,4,'さくらビル','全熱交換器',16,'台',1000,0,NULL,2,1,'2026-10-09 12:21:11','2026-10-09 12:21:11');
INSERT INTO `billing_base_items` (`base_item_id`, `base_id`, `version_id`, `building`, `item_name`, `base_quantity`, `unit`, `unit_price`, `excluded_quantity`, `excluded_reason`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (35,4,4,'さくらビル','室外機',12,'台',8000,0,NULL,3,1,'2026-10-09 12:21:11','2026-10-09 12:21:11');
/*!40000 ALTER TABLE `billing_base_items` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `billing_base_other_items` WRITE;
/*!40000 ALTER TABLE `billing_base_other_items` DISABLE KEYS */;
INSERT INTO `billing_base_other_items` (`base_other_item_id`, `base_id`, `version_id`, `fee_name`, `default_unit_price`, `default_quantity`, `is_variable`, `display_order`) VALUES (1,1,1,'高所作業費',10000,2,0,1);
INSERT INTO `billing_base_other_items` (`base_other_item_id`, `base_id`, `version_id`, `fee_name`, `default_unit_price`, `default_quantity`, `is_variable`, `display_order`) VALUES (2,1,1,'駐車場代',0,1,1,2);
INSERT INTO `billing_base_other_items` (`base_other_item_id`, `base_id`, `version_id`, `fee_name`, `default_unit_price`, `default_quantity`, `is_variable`, `display_order`) VALUES (5,3,3,'高所作業費',10000,2,0,1);
INSERT INTO `billing_base_other_items` (`base_other_item_id`, `base_id`, `version_id`, `fee_name`, `default_unit_price`, `default_quantity`, `is_variable`, `display_order`) VALUES (6,3,3,'駐車場代',0,1,1,2);
INSERT INTO `billing_base_other_items` (`base_other_item_id`, `base_id`, `version_id`, `fee_name`, `default_unit_price`, `default_quantity`, `is_variable`, `display_order`) VALUES (7,4,4,'出張費',8000,3,0,1);
INSERT INTO `billing_base_other_items` (`base_other_item_id`, `base_id`, `version_id`, `fee_name`, `default_unit_price`, `default_quantity`, `is_variable`, `display_order`) VALUES (8,4,4,'駐車場代',0,1,1,2);
/*!40000 ALTER TABLE `billing_base_other_items` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `billing_base_versions` WRITE;
/*!40000 ALTER TABLE `billing_base_versions` DISABLE KEYS */;
INSERT INTO `billing_base_versions` (`version_id`, `base_id`, `version_no`, `quote_id`, `tax_rate`, `created_at`, `updated_at`) VALUES (1,1,1,3,10.00,'2026-10-09 12:06:40','2026-10-09 12:06:40');
INSERT INTO `billing_base_versions` (`version_id`, `base_id`, `version_no`, `quote_id`, `tax_rate`, `created_at`, `updated_at`) VALUES (3,3,1,3,10.00,'2026-10-09 12:12:03','2026-10-09 12:12:55');
INSERT INTO `billing_base_versions` (`version_id`, `base_id`, `version_no`, `quote_id`, `tax_rate`, `created_at`, `updated_at`) VALUES (4,4,1,1,10.00,'2026-10-09 12:21:11','2026-10-09 12:21:11');
/*!40000 ALTER TABLE `billing_base_versions` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `billing_bases` WRITE;
/*!40000 ALTER TABLE `billing_bases` DISABLE KEYS */;
INSERT INTO `billing_bases` (`base_id`, `project_id`, `base_name`, `display_order`, `stopped_at`, `tax_rate`, `created_by`, `created_at`, `updated_at`) VALUES (1,3,'簡易点検時',1,NULL,10.00,NULL,'2026-10-09 12:06:40','2026-10-09 12:12:20');
INSERT INTO `billing_bases` (`base_id`, `project_id`, `base_name`, `display_order`, `stopped_at`, `tax_rate`, `created_by`, `created_at`, `updated_at`) VALUES (3,3,'定期点検時',2,NULL,10.00,NULL,'2026-10-09 12:12:03','2026-10-09 12:12:03');
INSERT INTO `billing_bases` (`base_id`, `project_id`, `base_name`, `display_order`, `stopped_at`, `tax_rate`, `created_by`, `created_at`, `updated_at`) VALUES (4,1,'通常点検',1,NULL,10.00,NULL,'2026-10-09 12:21:11','2026-10-09 12:21:11');
/*!40000 ALTER TABLE `billing_bases` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `billing_statement_items` WRITE;
/*!40000 ALTER TABLE `billing_statement_items` DISABLE KEYS */;
INSERT INTO `billing_statement_items` (`statement_item_id`, `statement_id`, `adjustment_quantity`, `adjustment_reason`, `unit_price`, `building`, `item_name`, `unit`, `base_quantity`, `excluded_quantity`, `excluded_reason`, `is_temporary`, `work_type`, `work_date`, `temporary_reason`, `markup_rate`, `policy_agreed`, `extra_work_id`, `display_order`) VALUES (1,1,0,NULL,1000,'さくらビル','空調機','台',60,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,1);
INSERT INTO `billing_statement_items` (`statement_item_id`, `statement_id`, `adjustment_quantity`, `adjustment_reason`, `unit_price`, `building`, `item_name`, `unit`, `base_quantity`, `excluded_quantity`, `excluded_reason`, `is_temporary`, `work_type`, `work_date`, `temporary_reason`, `markup_rate`, `policy_agreed`, `extra_work_id`, `display_order`) VALUES (2,1,0,NULL,1000,'さくらビル','全熱交換器','台',16,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,2);
INSERT INTO `billing_statement_items` (`statement_item_id`, `statement_id`, `adjustment_quantity`, `adjustment_reason`, `unit_price`, `building`, `item_name`, `unit`, `base_quantity`, `excluded_quantity`, `excluded_reason`, `is_temporary`, `work_type`, `work_date`, `temporary_reason`, `markup_rate`, `policy_agreed`, `extra_work_id`, `display_order`) VALUES (3,1,0,NULL,8000,'さくらビル','室外機','台',12,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,3);
INSERT INTO `billing_statement_items` (`statement_item_id`, `statement_id`, `adjustment_quantity`, `adjustment_reason`, `unit_price`, `building`, `item_name`, `unit`, `base_quantity`, `excluded_quantity`, `excluded_reason`, `is_temporary`, `work_type`, `work_date`, `temporary_reason`, `markup_rate`, `policy_agreed`, `extra_work_id`, `display_order`) VALUES (4,2,0,NULL,1000,'本館','空調機','台',300,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,1);
INSERT INTO `billing_statement_items` (`statement_item_id`, `statement_id`, `adjustment_quantity`, `adjustment_reason`, `unit_price`, `building`, `item_name`, `unit`, `base_quantity`, `excluded_quantity`, `excluded_reason`, `is_temporary`, `work_type`, `work_date`, `temporary_reason`, `markup_rate`, `policy_agreed`, `extra_work_id`, `display_order`) VALUES (5,2,0,NULL,2000,'本館','隠ぺい型空調機','台',60,1,'3F:医療機器があり脚立を立てられないため(1)',0,NULL,NULL,NULL,NULL,NULL,NULL,2);
INSERT INTO `billing_statement_items` (`statement_item_id`, `statement_id`, `adjustment_quantity`, `adjustment_reason`, `unit_price`, `building`, `item_name`, `unit`, `base_quantity`, `excluded_quantity`, `excluded_reason`, `is_temporary`, `work_type`, `work_date`, `temporary_reason`, `markup_rate`, `policy_agreed`, `extra_work_id`, `display_order`) VALUES (6,2,0,NULL,3000,'本館','エアハン','台',2,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,3);
INSERT INTO `billing_statement_items` (`statement_item_id`, `statement_id`, `adjustment_quantity`, `adjustment_reason`, `unit_price`, `building`, `item_name`, `unit`, `base_quantity`, `excluded_quantity`, `excluded_reason`, `is_temporary`, `work_type`, `work_date`, `temporary_reason`, `markup_rate`, `policy_agreed`, `extra_work_id`, `display_order`) VALUES (7,2,0,NULL,500,'本館','室外機','台',25,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,4);
INSERT INTO `billing_statement_items` (`statement_item_id`, `statement_id`, `adjustment_quantity`, `adjustment_reason`, `unit_price`, `building`, `item_name`, `unit`, `base_quantity`, `excluded_quantity`, `excluded_reason`, `is_temporary`, `work_type`, `work_date`, `temporary_reason`, `markup_rate`, `policy_agreed`, `extra_work_id`, `display_order`) VALUES (8,2,0,NULL,1000,'新館','空調機','台',60,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,5);
INSERT INTO `billing_statement_items` (`statement_item_id`, `statement_id`, `adjustment_quantity`, `adjustment_reason`, `unit_price`, `building`, `item_name`, `unit`, `base_quantity`, `excluded_quantity`, `excluded_reason`, `is_temporary`, `work_type`, `work_date`, `temporary_reason`, `markup_rate`, `policy_agreed`, `extra_work_id`, `display_order`) VALUES (9,2,0,NULL,2000,'新館','隠ぺい型空調機','台',15,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,6);
INSERT INTO `billing_statement_items` (`statement_item_id`, `statement_id`, `adjustment_quantity`, `adjustment_reason`, `unit_price`, `building`, `item_name`, `unit`, `base_quantity`, `excluded_quantity`, `excluded_reason`, `is_temporary`, `work_type`, `work_date`, `temporary_reason`, `markup_rate`, `policy_agreed`, `extra_work_id`, `display_order`) VALUES (10,2,0,NULL,500,'新館','加湿器','台',15,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,7);
INSERT INTO `billing_statement_items` (`statement_item_id`, `statement_id`, `adjustment_quantity`, `adjustment_reason`, `unit_price`, `building`, `item_name`, `unit`, `base_quantity`, `excluded_quantity`, `excluded_reason`, `is_temporary`, `work_type`, `work_date`, `temporary_reason`, `markup_rate`, `policy_agreed`, `extra_work_id`, `display_order`) VALUES (11,2,0,NULL,500,'新館','室外機','台',10,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,8);
/*!40000 ALTER TABLE `billing_statement_items` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `billing_statement_other_items` WRITE;
/*!40000 ALTER TABLE `billing_statement_other_items` DISABLE KEYS */;
INSERT INTO `billing_statement_other_items` (`statement_other_item_id`, `statement_id`, `fee_name`, `quantity`, `unit_price`, `is_variable`, `display_order`) VALUES (1,1,'出張費',3,8000,0,1);
INSERT INTO `billing_statement_other_items` (`statement_other_item_id`, `statement_id`, `fee_name`, `quantity`, `unit_price`, `is_variable`, `display_order`) VALUES (2,1,'駐車場代',1,0,1,2);
INSERT INTO `billing_statement_other_items` (`statement_other_item_id`, `statement_id`, `fee_name`, `quantity`, `unit_price`, `is_variable`, `display_order`) VALUES (3,2,'高所作業費',2,10000,0,1);
INSERT INTO `billing_statement_other_items` (`statement_other_item_id`, `statement_id`, `fee_name`, `quantity`, `unit_price`, `is_variable`, `display_order`) VALUES (4,2,'駐車場代',1,0,1,2);
/*!40000 ALTER TABLE `billing_statement_other_items` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `billing_statements` WRITE;
/*!40000 ALTER TABLE `billing_statements` DISABLE KEYS */;
INSERT INTO `billing_statements` (`statement_id`, `base_id`, `version_id`, `billing_month`, `tax_rate`, `status`, `issued_date`, `created_by`, `created_at`, `updated_at`, `confirmed_by`, `confirmed_at`) VALUES (1,4,4,'2026-10',10.00,'確定','2026-10-09','管理者（デモ）','2026-10-09 12:21:20','2026-10-09 12:21:28','管理者（デモ）','2026-10-09 12:21:28');
INSERT INTO `billing_statements` (`statement_id`, `base_id`, `version_id`, `billing_month`, `tax_rate`, `status`, `issued_date`, `created_by`, `created_at`, `updated_at`, `confirmed_by`, `confirmed_at`) VALUES (2,1,1,'2026-11',10.00,'下書き',NULL,'管理者（デモ）','2026-10-09 12:42:21','2026-10-09 12:42:21',NULL,NULL);
/*!40000 ALTER TABLE `billing_statements` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `business_policies` WRITE;
/*!40000 ALTER TABLE `business_policies` DISABLE KEYS */;
INSERT INTO `business_policies` (`policy_id`, `company_id`, `is_agreed`, `markup_rate`, `effective_from`, `effective_to`, `set_by`, `set_reason`, `created_at`) VALUES (1,3,1,20.00,'2026-10-09 11:29:49',NULL,'代表太郎','INITIAL','2026-10-09 11:29:48');
INSERT INTO `business_policies` (`policy_id`, `company_id`, `is_agreed`, `markup_rate`, `effective_from`, `effective_to`, `set_by`, `set_reason`, `created_at`) VALUES (2,4,0,NULL,'2026-10-09 11:37:42',NULL,'山田一郎','INITIAL','2026-10-09 11:37:41');
/*!40000 ALTER TABLE `business_policies` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` (`client_id`, `client_name`, `client_postalcode`, `client_address`, `client_phone`, `client_kana`) VALUES (1,'区立総合病院','1100003','東京都台東区根岸','0300000000','クリツソウゴウビョウイン');
INSERT INTO `clients` (`client_id`, `client_name`, `client_postalcode`, `client_address`, `client_phone`, `client_kana`) VALUES (2,'リハビリテーションクリニック','1120005','東京都文京区水道','0300000000','リハビリテーションクリニック');
INSERT INTO `clients` (`client_id`, `client_name`, `client_postalcode`, `client_address`, `client_phone`, `client_kana`) VALUES (3,'さくらビル','1100006','東京都台東区秋葉原','0300000000','サクラビル');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` (`company_id`, `company_name`, `company_postalcode`, `company_address`, `company_phone`, `company_kana`) VALUES (3,'株式会社サンプルサービス','1100003','東京都台東区根岸','0300000000','カブシキガイシャサンプルサービス');
INSERT INTO `companies` (`company_id`, `company_name`, `company_postalcode`, `company_address`, `company_phone`, `company_kana`) VALUES (4,'サンプル設備株式会社','1120005','東京都文京区水道','0300000000','サンプルセツビカブシキガイシャ');
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` (`doc_id`, `project_id`, `client_id`, `doc_file_path`, `doc_title`, `doc_remarks`, `doc_type`, `doc_created_at`) VALUES (1,NULL,2,'uploads/docs/1791517514380_空調設備機器一覧表_総合病院.pdf','本館機器一覧表','','機器一覧表','2026-10-09 03:45:14');
INSERT INTO `documents` (`doc_id`, `project_id`, `client_id`, `doc_file_path`, `doc_title`, `doc_remarks`, `doc_type`, `doc_created_at`) VALUES (2,NULL,1,'uploads/docs/1791517608936_Gemini_Generated_Image_80tk9780tk9780tk.jpg','設置状況','','画像','2026-10-09 03:46:48');
INSERT INTO `documents` (`doc_id`, `project_id`, `client_id`, `doc_file_path`, `doc_title`, `doc_remarks`, `doc_type`, `doc_created_at`) VALUES (4,NULL,2,'uploads/docs/1791517660646_Gemini_Generated_Image_nx9mm6nx9mm6nx9m.jpg','設置状況','','画像','2026-10-09 03:47:40');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `extra_work_items` WRITE;
/*!40000 ALTER TABLE `extra_work_items` DISABLE KEYS */;
INSERT INTO `extra_work_items` (`extra_work_item_id`, `extra_work_id`, `item_name`, `quantity`, `unit`, `unit_price`, `display_order`) VALUES (1,1,'バキューム処理',1,'式',18000,1);
INSERT INTO `extra_work_items` (`extra_work_item_id`, `extra_work_id`, `item_name`, `quantity`, `unit`, `unit_price`, `display_order`) VALUES (2,1,'出張費',1,'式',8000,2);
INSERT INTO `extra_work_items` (`extra_work_item_id`, `extra_work_id`, `item_name`, `quantity`, `unit`, `unit_price`, `display_order`) VALUES (3,2,'空調機分解洗浄',1,'台',15000,1);
INSERT INTO `extra_work_items` (`extra_work_item_id`, `extra_work_id`, `item_name`, `quantity`, `unit`, `unit_price`, `display_order`) VALUES (4,2,'養生費',1,'式',1000,2);
INSERT INTO `extra_work_items` (`extra_work_item_id`, `extra_work_id`, `item_name`, `quantity`, `unit`, `unit_price`, `display_order`) VALUES (5,2,'主張費',1,'式',8000,3);
INSERT INTO `extra_work_items` (`extra_work_item_id`, `extra_work_id`, `item_name`, `quantity`, `unit`, `unit_price`, `display_order`) VALUES (6,2,'文書作成費',1,'式',1000,4);
/*!40000 ALTER TABLE `extra_work_items` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `extra_works` WRITE;
/*!40000 ALTER TABLE `extra_works` DISABLE KEYS */;
INSERT INTO `extra_works` (`extra_work_id`, `project_id`, `work_type`, `work_date`, `location`, `content`, `requester`, `markup_rate`, `tax_rate`, `status`, `ordered_at`, `ordered_by`, `billed_date`, `created_at`, `updated_at`) VALUES (1,5,'緊急','2026-10-09','本館２０３号室','天カセがドレンエラー','総務課Nさん',20.00,10.00,'受注済み','2026-10-09 12:33:38','管理者（デモ）',NULL,'2026-10-09 12:33:33','2026-10-09 12:33:37');
INSERT INTO `extra_works` (`extra_work_id`, `project_id`, `work_type`, `work_date`, `location`, `content`, `requester`, `markup_rate`, `tax_rate`, `status`, `ordered_at`, `ordered_by`, `billed_date`, `created_at`, `updated_at`) VALUES (2,6,'追加','2026-10-09','本館１F当直','１台洗浄したい','総務課Nさん',20.00,10.00,'下書き',NULL,NULL,NULL,'2026-10-09 12:40:16','2026-10-09 12:40:16');
/*!40000 ALTER TABLE `extra_works` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `facility_survey_items` WRITE;
/*!40000 ALTER TABLE `facility_survey_items` DISABLE KEYS */;
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (1,1,'本館','B1F','空調機',50,'台',0,NULL,'済',1,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (2,1,'本館','B1F','隠ぺい型空調機',10,'台',0,NULL,'済',2,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (3,1,'本館','1F','空調機',50,'台',0,NULL,'済',3,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (4,1,'本館','1F','隠ぺい型空調機',10,'台',0,NULL,'済',4,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (5,1,'本館','2F','空調機',50,'台',0,NULL,'済',5,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (6,1,'本館','2F','隠ぺい型空調機',10,'台',0,NULL,'済',6,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (7,1,'本館','3F','空調機',50,'台',0,NULL,'済',7,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (8,1,'本館','3F','隠ぺい型空調機',10,'台',1,'医療機器があり脚立を立てられないため','済',8,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (9,1,'本館','4F','空調機',50,'台',0,NULL,'済',9,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (10,1,'本館','4F','隠ぺい型空調機',10,'台',0,NULL,'済',10,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (11,1,'本館','4F','エアハン',1,'台',0,NULL,'済',11,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (12,1,'本館','5F','空調機',50,'台',0,NULL,'済',12,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (13,1,'本館','5F','隠ぺい型空調機',10,'台',0,NULL,'済',13,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (14,1,'本館','5F','エアハン',1,'台',0,NULL,'済',14,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (17,1,'新館','1F','空調機',20,'台',0,NULL,'済',16,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (18,1,'新館','1F','隠ぺい型空調機',5,'台',0,NULL,'済',17,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (19,1,'新館','2F','空調機',20,'台',0,NULL,'済',19,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (20,1,'新館','2F','隠ぺい型空調機',5,'台',0,NULL,'済',20,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (21,1,'新館','3F','空調機',20,'台',0,NULL,'済',22,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (22,1,'新館','3F','隠ぺい型空調機',5,'台',0,NULL,'済',23,'2026-10-09 11:54:24','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (23,1,'本館','RF','室外機',25,'台',0,NULL,'済',15,'2026-10-09 12:00:07','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (24,1,'新館','1F','加湿器',5,'台',0,NULL,'済',18,'2026-10-09 12:00:08','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (25,1,'新館','2F','加湿器',5,'台',0,NULL,'済',21,'2026-10-09 12:00:08','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (26,1,'新館','3F','加湿器',5,'台',0,NULL,'済',24,'2026-10-09 12:00:08','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (27,1,'新館','RF','室外機',10,'台',0,NULL,'済',25,'2026-10-09 12:00:08','2026-10-09 12:06:40');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (28,2,'さくらビル','B1F','空調機',15,'台',0,NULL,'済',1,'2026-10-09 12:18:57','2026-10-09 12:21:11');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (29,2,'さくらビル','B1F','全熱交換器',4,'台',0,NULL,'済',2,'2026-10-09 12:18:57','2026-10-09 12:21:11');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (30,2,'さくらビル','1F','空調機',15,'台',0,NULL,'済',3,'2026-10-09 12:18:57','2026-10-09 12:21:11');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (31,2,'さくらビル','1F','全熱交換器',4,'台',0,NULL,'済',4,'2026-10-09 12:18:57','2026-10-09 12:21:11');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (32,2,'さくらビル','2F','空調機',15,'台',0,NULL,'済',5,'2026-10-09 12:18:57','2026-10-09 12:21:11');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (33,2,'さくらビル','2F','全熱交換器',4,'台',0,NULL,'済',6,'2026-10-09 12:18:57','2026-10-09 12:21:11');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (34,2,'さくらビル','3F','空調機',15,'台',0,NULL,'済',7,'2026-10-09 12:18:57','2026-10-09 12:21:11');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (35,2,'さくらビル','3F','全熱交換器',4,'台',0,NULL,'済',8,'2026-10-09 12:18:57','2026-10-09 12:21:11');
INSERT INTO `facility_survey_items` (`survey_item_id`, `survey_id`, `building`, `floor_label`, `item_name`, `quantity`, `unit`, `excluded_quantity`, `excluded_reason`, `order_status`, `display_order`, `created_at`, `updated_at`) VALUES (36,2,'さくらビル','RF','室外機',12,'台',0,NULL,'済',9,'2026-10-09 12:18:57','2026-10-09 12:21:11');
/*!40000 ALTER TABLE `facility_survey_items` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `facility_surveys` WRITE;
/*!40000 ALTER TABLE `facility_surveys` DISABLE KEYS */;
INSERT INTO `facility_surveys` (`survey_id`, `project_id`, `status`, `created_at`, `updated_at`) VALUES (1,3,'draft','2026-10-09 11:54:24','2026-10-09 12:00:08');
INSERT INTO `facility_surveys` (`survey_id`, `project_id`, `status`, `created_at`, `updated_at`) VALUES (2,1,'draft','2026-10-09 12:18:57','2026-10-09 12:18:57');
/*!40000 ALTER TABLE `facility_surveys` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` (`token_id`, `user_id`, `token`, `expires_at`, `used`, `created_at`) VALUES (1,6,'61c359e5f46c4207b368fc5573cab380','2026-10-12 11:35:33',1,'2026-10-09 11:35:33');
INSERT INTO `password_reset_tokens` (`token_id`, `user_id`, `token`, `expires_at`, `used`, `created_at`) VALUES (2,7,'c51813f69639479b92e6cf13a7554bd2','2026-10-12 11:38:04',0,'2026-10-09 11:38:03');
INSERT INTO `password_reset_tokens` (`token_id`, `user_id`, `token`, `expires_at`, `used`, `created_at`) VALUES (3,8,'ab792c1149624dfc923affe636e71e1c','2026-10-12 11:38:43',0,'2026-10-09 11:38:43');
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` (`project_id`, `company_id`, `client_id`, `registration_date`, `project_name`, `contract_type`, `order_route`, `status`, `project_remarks`, `project_staffname`, `updated_at`, `deleted_at`) VALUES (1,3,1,'2026-10-09','空調機フィルター清掃','定期','見積り','進行中','','一般花子','2026-10-09 03:41:06',NULL);
INSERT INTO `projects` (`project_id`, `company_id`, `client_id`, `registration_date`, `project_name`, `contract_type`, `order_route`, `status`, `project_remarks`, `project_staffname`, `updated_at`, `deleted_at`) VALUES (2,3,1,'2026-10-09','空調機分解洗浄','臨時','見積り','進行中','','一般花子','2026-10-09 03:41:31',NULL);
INSERT INTO `projects` (`project_id`, `company_id`, `client_id`, `registration_date`, `project_name`, `contract_type`, `order_route`, `status`, `project_remarks`, `project_staffname`, `updated_at`, `deleted_at`) VALUES (3,3,2,'2026-10-09','フィルター清掃・フロン漏洩簡易/定期点検','定期','見積り','進行中','','代表太郎','2026-10-09 03:01:06',NULL);
INSERT INTO `projects` (`project_id`, `company_id`, `client_id`, `registration_date`, `project_name`, `contract_type`, `order_route`, `status`, `project_remarks`, `project_staffname`, `updated_at`, `deleted_at`) VALUES (4,4,3,'2026-10-09','空調機・換気設備点検(任意)','定期','見積り','進行中','','佐藤次郎','2026-10-09 03:15:55',NULL);
INSERT INTO `projects` (`project_id`, `company_id`, `client_id`, `registration_date`, `project_name`, `contract_type`, `order_route`, `status`, `project_remarks`, `project_staffname`, `updated_at`, `deleted_at`) VALUES (5,3,2,'2026-10-09','【緊急】10/09 本館２０３号室','臨時','事前承認','進行中',NULL,'管理者（デモ）','2026-10-09 03:33:33',NULL);
INSERT INTO `projects` (`project_id`, `company_id`, `client_id`, `registration_date`, `project_name`, `contract_type`, `order_route`, `status`, `project_remarks`, `project_staffname`, `updated_at`, `deleted_at`) VALUES (6,3,2,'2026-10-09','【追加】10/09 本館１F当直','臨時','事前承認','進行中',NULL,'管理者（デモ）','2026-10-09 03:40:16',NULL);
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `quote_histories` WRITE;
/*!40000 ALTER TABLE `quote_histories` DISABLE KEYS */;
INSERT INTO `quote_histories` (`history_id`, `quote_id`, `quote_date`, `quote_filepath`, `quote_status`, `updated_at`, `judge_user`, `judge_user_id`) VALUES (1,3,'2026-10-09','uploads/1791513920275_1781840599735_quotation-03.pdf','発注','2026-10-09 02:45:20','管理者（デモ）（既存案件）',1);
INSERT INTO `quote_histories` (`history_id`, `quote_id`, `quote_date`, `quote_filepath`, `quote_status`, `updated_at`, `judge_user`, `judge_user_id`) VALUES (2,1,'2026-10-09','uploads/1791513745623_1781576389341_quotation-02.pdf','発注','2026-10-09 03:16:36','代表太郎',4);
/*!40000 ALTER TABLE `quote_histories` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `quotes` WRITE;
/*!40000 ALTER TABLE `quotes` DISABLE KEYS */;
INSERT INTO `quotes` (`quote_id`, `project_id`, `quote_date`, `quote_filepath`, `quote_status`, `judge_user`, `deadline_date`, `updated_at`, `quote_type`, `change_reason`, `deleted_at`) VALUES (1,1,'2026-10-09','uploads/1791513745623_1781576389341_quotation-02.pdf','発注','代表太郎','2027-03-31','2026-10-09 02:42:25','通常',NULL,NULL);
INSERT INTO `quotes` (`quote_id`, `project_id`, `quote_date`, `quote_filepath`, `quote_status`, `judge_user`, `deadline_date`, `updated_at`, `quote_type`, `change_reason`, `deleted_at`) VALUES (2,2,'2026-10-09','uploads/1791513807510_1781840599735_quotation-03.pdf','未判定',NULL,'2030-03-31','2026-10-09 02:43:27','通常',NULL,NULL);
INSERT INTO `quotes` (`quote_id`, `project_id`, `quote_date`, `quote_filepath`, `quote_status`, `judge_user`, `deadline_date`, `updated_at`, `quote_type`, `change_reason`, `deleted_at`) VALUES (3,3,'2026-10-09','uploads/1791513920275_1781840599735_quotation-03.pdf','発注','管理者（デモ）（既存案件）',NULL,'2026-10-09 02:45:20','通常',NULL,NULL);
INSERT INTO `quotes` (`quote_id`, `project_id`, `quote_date`, `quote_filepath`, `quote_status`, `judge_user`, `deadline_date`, `updated_at`, `quote_type`, `change_reason`, `deleted_at`) VALUES (4,1,'2026-10-09','uploads/1791516114347_1781840599735_quotation-03.pdf','未判定',NULL,'2030-03-31','2026-10-09 03:21:54','通常',NULL,NULL);
/*!40000 ALTER TABLE `quotes` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `survey_masters` WRITE;
/*!40000 ALTER TABLE `survey_masters` DISABLE KEYS */;
INSERT INTO `survey_masters` (`master_id`, `master_type`, `name`, `default_unit`, `display_order`, `created_at`) VALUES (1,'UNIT','台',NULL,1,'2026-10-09 11:46:31');
INSERT INTO `survey_masters` (`master_id`, `master_type`, `name`, `default_unit`, `display_order`, `created_at`) VALUES (2,'UNIT','式',NULL,2,'2026-10-09 11:46:36');
INSERT INTO `survey_masters` (`master_id`, `master_type`, `name`, `default_unit`, `display_order`, `created_at`) VALUES (3,'ITEM','空調機','台',1,'2026-10-09 11:46:52');
INSERT INTO `survey_masters` (`master_id`, `master_type`, `name`, `default_unit`, `display_order`, `created_at`) VALUES (4,'ITEM','隠ぺい型空調機','台',2,'2026-10-09 11:47:18');
INSERT INTO `survey_masters` (`master_id`, `master_type`, `name`, `default_unit`, `display_order`, `created_at`) VALUES (5,'ITEM','加湿器','台',3,'2026-10-09 11:47:31');
INSERT INTO `survey_masters` (`master_id`, `master_type`, `name`, `default_unit`, `display_order`, `created_at`) VALUES (6,'ITEM','エアハン','台',4,'2026-10-09 11:48:02');
INSERT INTO `survey_masters` (`master_id`, `master_type`, `name`, `default_unit`, `display_order`, `created_at`) VALUES (7,'OTHER','出張費',NULL,1,'2026-10-09 11:48:15');
INSERT INTO `survey_masters` (`master_id`, `master_type`, `name`, `default_unit`, `display_order`, `created_at`) VALUES (9,'OTHER','駐車場代',NULL,3,'2026-10-09 11:48:39');
INSERT INTO `survey_masters` (`master_id`, `master_type`, `name`, `default_unit`, `display_order`, `created_at`) VALUES (10,'OTHER','文書作成費',NULL,4,'2026-10-09 11:48:53');
INSERT INTO `survey_masters` (`master_id`, `master_type`, `name`, `default_unit`, `display_order`, `created_at`) VALUES (11,'ITEM','高所作業費','式',6,'2026-10-09 11:49:22');
INSERT INTO `survey_masters` (`master_id`, `master_type`, `name`, `default_unit`, `display_order`, `created_at`) VALUES (12,'ITEM','養生費','式',7,'2026-10-09 11:49:42');
INSERT INTO `survey_masters` (`master_id`, `master_type`, `name`, `default_unit`, `display_order`, `created_at`) VALUES (13,'ITEM','室外機','台',5,'2026-10-09 11:54:36');
/*!40000 ALTER TABLE `survey_masters` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `user_change_histories` WRITE;
/*!40000 ALTER TABLE `user_change_histories` DISABLE KEYS */;
INSERT INTO `user_change_histories` (`history_id`, `user_id`, `company_id`, `change_type`, `old_value`, `new_value`, `operated_by`, `created_at`) VALUES (1,5,3,'USER_ADDED',NULL,'demo-general@example.com','代表太郎','2026-10-09 11:30:06');
INSERT INTO `user_change_histories` (`history_id`, `user_id`, `company_id`, `change_type`, `old_value`, `new_value`, `operated_by`, `created_at`) VALUES (2,6,4,'PASSWORD_RESET_COMPLETED',NULL,NULL,'本人','2026-10-09 11:36:44');
INSERT INTO `user_change_histories` (`history_id`, `user_id`, `company_id`, `change_type`, `old_value`, `new_value`, `operated_by`, `created_at`) VALUES (3,7,4,'USER_ADDED',NULL,'b-general@example.com','山田一郎','2026-10-09 11:38:03');
INSERT INTO `user_change_histories` (`history_id`, `user_id`, `company_id`, `change_type`, `old_value`, `new_value`, `operated_by`, `created_at`) VALUES (4,8,3,'USER_ADDED',NULL,'demo-spare@example.com','代表太郎','2026-10-09 11:38:43');
/*!40000 ALTER TABLE `user_change_histories` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`user_id`, `login_id`, `password`, `name`, `role_flag`, `company_id`, `email`, `is_active`) VALUES (1,'demo-admin@example.com','DEMO-NO-PASSWORD','管理者（デモ）',1,NULL,'demo-admin@example.com',1);
INSERT INTO `users` (`user_id`, `login_id`, `password`, `name`, `role_flag`, `company_id`, `email`, `is_active`) VALUES (4,'demo-master@example.com','$2a$10$UtNcwxZfLjpxtAvL2mOS0ugPu2zpLItPOVDjaujSN9OgfchZME6Tu','代表太郎',2,3,'demo-master@example.com',1);
INSERT INTO `users` (`user_id`, `login_id`, `password`, `name`, `role_flag`, `company_id`, `email`, `is_active`) VALUES (5,'demo-general@example.com','$2a$10$ldVrhu4vViZ8TT9//vxvAevQu5d42VwUdprUnPfCw5FpV7du1QsbC','一般花子',3,3,'demo-general@example.com',1);
INSERT INTO `users` (`user_id`, `login_id`, `password`, `name`, `role_flag`, `company_id`, `email`, `is_active`) VALUES (6,'b-master@example.com','$2a$10$ClILKODNHe02n.baVQf/9ennKyEaDMTd95BA/263yqHC7ezoJxKie','山田一郎',2,4,'b-master@example.com',1);
INSERT INTO `users` (`user_id`, `login_id`, `password`, `name`, `role_flag`, `company_id`, `email`, `is_active`) VALUES (7,'b-general@example.com','$2a$10$H8KJpZp2Xph4ST.kai1FeeStRKS/HoUFRDbBktzp.3te5sk3zmSZi','佐藤次郎',3,4,'b-general@example.com',1);
INSERT INTO `users` (`user_id`, `login_id`, `password`, `name`, `role_flag`, `company_id`, `email`, `is_active`) VALUES (8,'demo-spare@example.com','$2a$10$eAYDMb0yE0/V/eyNZpX6me5cExdcRVepLwDty11zO1UYyYvrzzW4K','予備三郎',3,3,'demo-spare@example.com',1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

