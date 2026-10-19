-- ColorRoll roll log (Cloudflare D1). Every roll is decided by the Worker and
-- written here before the browser sees it, so a roll ID always points at the
-- one official result. Rows are never updated or deleted.

CREATE TABLE rolls (
  id         TEXT PRIMARY KEY,          -- public roll ID shown under the dice
  roller     TEXT NOT NULL,             -- public roller ID (hash of the browser's secret key)
  seq        INTEGER NOT NULL,          -- this roller's roll number: 1, 2, 3, ...
  dice       INTEGER NOT NULL,          -- how many dice (1-6)
  kind       TEXT NOT NULL DEFAULT 'color',
  faces      TEXT NOT NULL,             -- comma list of 0-5; colors in order red, orange, yellow, green, blue, purple
  created_at TEXT NOT NULL,             -- ISO-8601 UTC with milliseconds
  UNIQUE (roller, seq)
);

CREATE INDEX rolls_by_roller ON rolls (roller, seq);
