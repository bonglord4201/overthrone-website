-- Session code shown under the dice.
--
-- Each page visit gets a random session code. Every roll made during that visit
-- is tagged with it, so verifying one code shows the whole visit's rolls in order
-- (re-rolls included). Refreshing the page starts a new code. The per-roll id and
-- the longer-lived roller id still exist; this just groups a visit for viewers.

ALTER TABLE rolls ADD COLUMN session TEXT NOT NULL DEFAULT '';
CREATE INDEX rolls_by_session ON rolls (session, created_at);
