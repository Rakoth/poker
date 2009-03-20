CREATE TABLE `actions` (
  `id` int(11) NOT NULL auto_increment,
  `game_id` int(11) default NULL,
  `player_id` int(11) default NULL,
  `kind` int(11) default NULL,
  `value` int(11) default NULL,
  `created_at` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

CREATE TABLE `blind_values` (
  `level` int(11) default NULL,
  `value` int(11) default NULL,
  `ante` int(11) default NULL,
  `game_type_id` int(11) default NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `game_types` (
  `id` int(11) NOT NULL auto_increment,
  `title` varchar(255) default NULL,
  `max_players` int(11) default NULL,
  `start_stack` int(11) default NULL,
  `start_cash` decimal(10,2) default NULL,
  `additional_cash` decimal(10,2) default NULL,
  `start_blind` int(11) default NULL,
  `bet_multiplier` int(11) default NULL,
  `change_level_time` int(11) default NULL,
  `action_time` int(11) default NULL,
  `template` varchar(255) default NULL,
  `min_level` int(11) default NULL,
  `max_level` int(11) default NULL,
  `created_at` datetime default NULL,
  `updated_at` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

CREATE TABLE `games` (
  `id` int(11) NOT NULL auto_increment,
  `status` varchar(255) default 'wait',
  `turn` int(11) default '0',
  `blind_position` int(11) default '0',
  `blind_size` int(11) default NULL,
  `blind_level` int(11) default '0',
  `ante` int(11) default '0',
  `current_bet` int(11) default NULL,
  `next_level_time` datetime default NULL,
  `players_count` int(11) default '0',
  `bank` int(11) default '0',
  `type_id` int(11) default NULL,
  `created_at` datetime default NULL,
  `updated_at` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

CREATE TABLE `notes` (
  `user_id` int(11) default NULL,
  `about_user_id` int(11) default NULL,
  `color` int(11) default NULL,
  `description` varchar(255) default NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `players` (
  `id` int(11) NOT NULL auto_increment,
  `sit` int(11) default NULL,
  `stack` int(11) default NULL,
  `for_call` int(11) default '0',
  `in_pot` int(11) default '0',
  `state` varchar(255) default 'active',
  `hand` varchar(255) default NULL,
  `action_time` datetime default NULL,
  `control_action_time` datetime default NULL,
  `user_id` int(11) default NULL,
  `game_id` int(11) default NULL,
  `created_at` datetime default NULL,
  `updated_at` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;

CREATE TABLE `schema_migrations` (
  `version` varchar(255) NOT NULL,
  UNIQUE KEY `unique_schema_migrations` (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL auto_increment,
  `session_id` varchar(255) NOT NULL,
  `data` text,
  `created_at` datetime default NULL,
  `updated_at` datetime default NULL,
  PRIMARY KEY  (`id`),
  KEY `index_sessions_on_session_id` (`session_id`),
  KEY `index_sessions_on_updated_at` (`updated_at`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

CREATE TABLE `user_balance_actions` (
  `user_id` int(11) default NULL,
  `direction` varchar(255) default NULL,
  `value` float default NULL,
  `comment` varchar(255) default NULL,
  `created_at` datetime default NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `user_infos` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(255) default NULL,
  `country` varchar(255) default NULL,
  `birthday` date default NULL,
  `language` varchar(255) default NULL,
  `user_id` int(11) default NULL,
  `created_at` datetime default NULL,
  `updated_at` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `users` (
  `id` int(11) NOT NULL auto_increment,
  `login` varchar(255) default NULL,
  `crypted_password` varchar(255) default NULL,
  `salt` varchar(255) default NULL,
  `type` int(11) default NULL,
  `email` varchar(255) default NULL,
  `locate` varchar(255) default NULL,
  `cash` decimal(10,2) default '0.00',
  `chips` int(11) default '1000',
  `level` int(11) default '0',
  `created_at` datetime default NULL,
  `updated_at` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

INSERT INTO schema_migrations (version) VALUES ('1');

INSERT INTO schema_migrations (version) VALUES ('2');

INSERT INTO schema_migrations (version) VALUES ('20090201194409');

INSERT INTO schema_migrations (version) VALUES ('20090206182009');

INSERT INTO schema_migrations (version) VALUES ('20090222204154');

INSERT INTO schema_migrations (version) VALUES ('20090226132804');

INSERT INTO schema_migrations (version) VALUES ('3');

INSERT INTO schema_migrations (version) VALUES ('4');

INSERT INTO schema_migrations (version) VALUES ('5');

INSERT INTO schema_migrations (version) VALUES ('6');