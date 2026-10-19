-- Admin panel: top streamers shown beside the dice, their avatar images, and
-- failed admin sign-ins (used to lock out password guessing).

CREATE TABLE media (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       TEXT NOT NULL,                -- image/webp, image/png or image/jpeg
  data       BLOB NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE streamers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,                -- display name, e.g. "Kaz"
  handle     TEXT NOT NULL,                -- TikTok username without the @
  avatar_id  INTEGER REFERENCES media(id),
  verified   INTEGER NOT NULL DEFAULT 1,   -- show the check badge
  live       INTEGER NOT NULL DEFAULT 0,   -- show the red Live badge (set by hand)
  visible    INTEGER NOT NULL DEFAULT 1,
  side       TEXT NOT NULL DEFAULT 'auto', -- left, right or auto
  sort       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE login_attempts (
  ip TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX login_attempts_by_ip ON login_attempts (ip, at);
