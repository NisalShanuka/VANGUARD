SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for kv_store
-- ----------------------------
CREATE TABLE IF NOT EXISTS `kv_store` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key_name` varchar(255) NOT NULL,
  `value_data` longtext NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_name` (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for knowledgebase_pages
-- ----------------------------
CREATE TABLE IF NOT EXISTS `knowledgebase_pages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(255) NOT NULL,
  `data_en` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data_en`)),
  `data_si` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data_si`)),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records for kv_store
-- ----------------------------
INSERT INTO `kv_store` (`id`, `key_name`, `value_data`, `updated_at`) VALUES (1, 'knowledgebase_categories', '{"en":[{"title":"Getting Started","status":"Available","to":"/knowledgebase/getting-started"},{"title":"General Rules","status":"Available","to":"/rules/general"},{"title":"Server Rules","status":"Available","to":"/rules/server"},{"title":"RolePlay Rules","status":"Available","to":"/rules/roleplay"},{"title":"General Situation Count","status":"Available","to":"/counts/general-situation"},{"title":"Robbery Situation Count","status":"Available","to":"/counts/robbery-situation"},{"title":"Factions","status":"Unavailable"},{"title":"Crew / Gang","status":"Unavailable"}],"si":[{"title":"ආරම්භ කිරීම","status":"ලබාගත හැක","to":"/knowledgebase/getting-started"},{"title":"සාමාන්්‍ය නීති","status":"ලබාගත හැක","to":"/rules/general"},{"title":"සේවාදායක නීති","status":"ලබාගත හැක","to":"/rules/server"},{"title":"RolePlay නීති","status":"ලබාගත හැක","to":"/rules/roleplay"},{"title":"සාමාන්්‍ය සිදුවීම් ගණන","status":"ලබාගත හැක","to":"/counts/general-situation"},{"title":"රොබරි සිදුවීම් ගණන","status":"ලබාගත හැක","to":"/counts/robbery-situation"},{"title":"කණ්ඩායම්","status":"ලබාගත නොහැක"},{"title":"Crew / Gang","status":"ලබාගත නොහැක"}]}', '2026-02-22 18:10:33');

-- ----------------------------
-- Records for knowledgebase_pages
-- ----------------------------
INSERT INTO `knowledgebase_pages` (`id`, `slug`, `data_en`, `data_si`, `updated_at`) VALUES (1, 'getting-started', '{"title":"Getting Started with Vanguard","content":"<p>Welcome to Vanguard Roleplay! To get started, follow these steps:</p><ul><li>Join our Discord server.</li><li>Read the rules in the Knowledgebase.</li><li>Apply for whitelist.</li></ul>"}', '{"title":"Vanguard සමඟ ආරම්භ කිරීම","content":"<p>Vanguard Roleplay වෙත සාදරයෙන් පිළිගනිමු! ආරම්භ කිරීමට, මෙම පියවර අනුගමනය කරන්න:</p><ul><li>අපගේ Discord server එකට සම්බන්ධ වන්න.</li><li>Knowledgebase හි නීති කියවන්න.</li><li>Whitelist සඳහා අයදුම් කරන්න.</li></ul>"}', '2026-02-22 18:10:33');
INSERT INTO `knowledgebase_pages` (`id`, `slug`, `data_en`, `data_si`, `updated_at`) VALUES (3, 'general', '{"title":"General Rules","sections":[{"title":"Section 1","items":["Rule 1","Rule 2"]}]}', '{"title":"general නීති","sections":[{"title":"පළමු කොටස","items":["නීතිය 1","නීතිය 2"]}]}', '2026-02-22 18:13:09');
INSERT INTO `knowledgebase_pages` (`id`, `slug`, `data_en`, `data_si`, `updated_at`) VALUES (4, 'server', '{"title":"Server Rules","sections":[{"title":"Section 1","items":["Rule 1","Rule 2"]}]}', '{"title":"server නීති","sections":[{"title":"පළමු කොටස","items":["නීතිය 1","නීතිය 2"]}]}', '2026-02-22 18:13:09');
INSERT INTO `knowledgebase_pages` (`id`, `slug`, `data_en`, `data_si`, `updated_at`) VALUES (5, 'roleplay', '{"title":"Roleplay Rules","sections":[{"title":"Section 1","items":["Rule 1","Rule 2"]}]}', '{"title":"roleplay නීති","sections":[{"title":"පළමු කොටස","items":["නීතිය 1","නීතිය 2"]}]}', '2026-02-22 18:13:09');

SET FOREIGN_KEY_CHECKS = 1;
