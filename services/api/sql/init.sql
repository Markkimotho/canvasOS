-- CanvasOS database schema

CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    owner_id    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    yjs_state   BYTEA,               -- Y.Doc snapshot
    metadata    JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS plugins (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    version     TEXT NOT NULL,
    description TEXT,
    author      TEXT,
    category    TEXT,
    install_url TEXT NOT NULL,
    downloads   INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_plugins_category ON plugins(category);

-- Example seed data for plugins
INSERT INTO plugins (id, name, version, description, author, category, install_url, downloads, is_verified)
VALUES
    ('example-color-palette', 'Auto Color Palette', '1.0.0', 'Extracts a color palette from the active layer', 'CanvasOS Team', 'color', '/plugins/example-color-palette/index.js', 1200, TRUE),
    ('example-noise-generator', 'Noise Generator', '1.2.0', 'Generates Perlin/Simplex noise layers', 'CanvasOS Team', 'generation', '/plugins/example-noise-generator/index.js', 980, TRUE)
ON CONFLICT (id) DO NOTHING;
