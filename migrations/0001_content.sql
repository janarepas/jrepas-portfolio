CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY CHECK (id IN ('draft', 'published')),
  content_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by TEXT
);
INSERT OR IGNORE INTO site_content (id, content_json) VALUES ('draft', '{"translations":{},"images":{}}');
