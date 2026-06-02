CREATE TABLE IF NOT EXISTS app_settings (
    section VARCHAR(100) PRIMARY KEY,
    value_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
