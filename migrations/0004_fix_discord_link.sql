-- The Discord invite is discord.gg/overthronesmp (with the "r"). Fix the stored setting if it
-- still holds the old misspelled default; a link the owner changed in /admin is left alone.
UPDATE site_settings
SET value = 'https://discord.gg/overthronesmp', updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE key = 'discord_url' AND value = 'https://discord.gg/overthonesmp';
