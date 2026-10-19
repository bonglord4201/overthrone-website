-- Moderation: the owner can flag or ban a roller caught re-rolling or scamming,
-- and players can report a roll. Rolls themselves are never changed; a flag or
-- ban only adds a public warning and (for a ban) stops that roller from rolling.

CREATE TABLE roller_flags (
  roller     TEXT PRIMARY KEY,            -- the public roller ID (matches rolls.roller)
  banned     INTEGER NOT NULL DEFAULT 0,  -- 1 = blocked from rolling on this site
  label      TEXT NOT NULL DEFAULT '',    -- short public reason, e.g. "Caught re-rolling"
  note       TEXT NOT NULL DEFAULT '',    -- private note, owner only
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  roll_id     TEXT,                        -- the roll ID the reporter pasted (may be blank)
  roller      TEXT,                        -- filled in from the roll, when the ID is real
  message     TEXT NOT NULL,               -- what the reporter said
  reporter_ip TEXT,                        -- to rate-limit and group reports
  status      TEXT NOT NULL DEFAULT 'new', -- new or reviewed
  created_at  TEXT NOT NULL
);
CREATE INDEX reports_by_status ON reports (status, created_at DESC);
CREATE INDEX reports_by_ip ON reports (reporter_ip, created_at);
