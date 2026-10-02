-- Initial content: only information that was already on the site or was
-- provided by the server owner. Everything else is left empty on purpose.

INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('server_address', 'overthronesmp.net'),
  ('discord_url', 'https://discord.gg/overthonesmp'),
  ('minecraft_version', '1.21.1'),
  ('mod_loader', 'NeoForge'),
  ('core_mod', 'Tensura: Reincarnated'),
  ('hero_tagline', 'Don’t reach the throne. Overthrow it.');

INSERT INTO realms (name, slug, subtitle, description, status, sort_order) VALUES
  ('OVERTHRONE', 'overthrone', 'Hub', 'The hub and central starting area.', '', 10),
  ('THE REALM', 'the-realm', 'Survival', 'The main survival world.', '', 20),
  ('THE FRONTIER', 'the-frontier', 'Resource', 'The resource and exploration world.', '', 30),
  ('THE GATES', 'the-gates', 'Dungeon / Gate System', 'The planned dungeon and gate system.', 'Under Development', 40),
  ('AEONIA', 'aeonia', 'Realm of the Divine', 'A divine realm inspired by the Greek gods: ancient temples, divine architecture and a celestial, mythological atmosphere.', 'Coming Soon', 50),
  ('NETHERFALL', 'netherfall', 'Realm of the Dead', 'An underworld of volcanic wastes, ancient ruins, souls and the abyss. Extremely dangerous.', 'Coming Soon', 60);

INSERT INTO hunter_ranks (code, sort_order) VALUES
  ('E', 10), ('D', 20), ('C', 30), ('B', 40), ('A', 50), ('S', 60), ('???', 70);

INSERT INTO forum_categories (section, name, slug, description, icon, sort_order) VALUES
  ('OVERTHRONE Information', 'Announcements', 'announcements', 'Official news from the OVERTHRONE team.', 'megaphone', 10),
  ('OVERTHRONE Information', 'Rules', 'rules', 'Server and community rules.', 'scroll', 20),
  ('OVERTHRONE Information', 'Server Updates', 'server-updates', 'Updates to the server and its systems.', 'refresh', 30),
  ('OVERTHRONE Information', 'Changelog', 'changelog', 'Detailed lists of changes.', 'list', 40),
  ('Community', 'General Discussion', 'general-discussion', 'Talk about anything OVERTHRONE.', 'chat', 110),
  ('Community', 'Introductions', 'introductions', 'New to the server? Introduce yourself.', 'user', 120),
  ('Community', 'Screenshots & Media', 'screenshots-media', 'Builds, moments and videos from the server.', 'image', 130),
  ('Community', 'Suggestions', 'suggestions', 'Ideas to improve OVERTHRONE.', 'bulb', 140),
  ('OVERTHRONE Gameplay', 'Hunter Progression', 'hunter-progression', 'The Hunter rank path from E to ???.', 'crown', 210),
  ('OVERTHRONE Gameplay', 'Tensura Skills', 'tensura-skills', 'Skills, magics and battlewills from Tensura: Reincarnated.', 'spark', 220),
  ('OVERTHRONE Gameplay', 'Realms', 'realms', 'The realms of OVERTHRONE.', 'globe', 230),
  ('OVERTHRONE Gameplay', 'Gates', 'gates', 'The dungeon and gate system.', 'gate', 240),
  ('OVERTHRONE Gameplay', 'Bosses', 'bosses', 'Bosses and how to face them.', 'skull', 250),
  ('OVERTHRONE Gameplay', 'Quests', 'quests', 'Quests and storylines.', 'compass', 260),
  ('OVERTHRONE Gameplay', 'Guilds', 'guilds', 'Guilds and recruitment.', 'shield', 270),
  ('OVERTHRONE Gameplay', 'Economy', 'economy', 'Trading and the server economy.', 'coin', 280),
  ('Support', 'Help', 'help', 'Questions about playing on the server.', 'help', 310),
  ('Support', 'Bug Reports', 'bug-reports', 'Report problems with the server.', 'bug', 320),
  ('Support', 'Player Reports', 'player-reports', 'Report rule breaks to staff.', 'flag', 330);

INSERT INTO home_sections (title, body, sort_order) VALUES
  ('Getting Started', 'OVERTHRONE SMP is a dark-fantasy MMORPG Minecraft server and is currently under development.

Join the Discord to follow development.', 10);
