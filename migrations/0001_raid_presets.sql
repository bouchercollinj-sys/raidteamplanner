CREATE TABLE IF NOT EXISTS raid_preset (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  raid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS raid_preset_user_id_idx ON raid_preset (user_id);
CREATE INDEX IF NOT EXISTS raid_preset_slug_idx ON raid_preset (slug);
