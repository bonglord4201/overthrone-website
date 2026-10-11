-- OVERTHRONE modpack 4.0 (Google Drive). Shows the "Download the modpack" button on the Player Guide.
-- Can be changed later in /admin -> Site Settings -> Modpack download URL.
INSERT INTO site_settings (key, value, updated_at)
VALUES ('modpack_url', 'https://drive.google.com/file/d/1oirCOR5-JsE00fBgCluBw5iMRnLsX_Kx/view?usp=sharing', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;
