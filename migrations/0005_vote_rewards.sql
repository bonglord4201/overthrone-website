-- Default vote rewards text. Only fills it in if the owner hasn't written their own in /admin.
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('vote_rewards', 'Every vote rewards you with 1x Vote Key and $50,000 in-game balance.');
UPDATE site_settings SET value = 'Every vote rewards you with 1x Vote Key and $50,000 in-game balance.' WHERE key = 'vote_rewards' AND value = '';
