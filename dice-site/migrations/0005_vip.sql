-- VIP logins: a streamer can be given their own username + password so they can
-- sign in at /vip and flip their own "Live now" switch, instead of the owner
-- doing it. The password is stored only as a PBKDF2 hash with a per-user salt.

ALTER TABLE streamers ADD COLUMN vip_user TEXT;
ALTER TABLE streamers ADD COLUMN vip_hash TEXT;
ALTER TABLE streamers ADD COLUMN vip_salt TEXT;
CREATE UNIQUE INDEX streamers_vip_user ON streamers (vip_user) WHERE vip_user IS NOT NULL;
