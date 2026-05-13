CREATE TABLE IF NOT EXISTS violations (
  id                 SERIAL PRIMARY KEY,
  address            TEXT NOT NULL,
  violation_date     DATE,
  violation_code     TEXT,
  status             TEXT,
  description        TEXT,
  inspector_comments TEXT
);

CREATE TABLE IF NOT EXISTS scofflaws (
  id      SERIAL PRIMARY KEY,
  address TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  address    TEXT NOT NULL,
  author     TEXT NOT NULL,
  comment    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_violations_address ON violations (address);
CREATE INDEX IF NOT EXISTS idx_scofflaws_address ON scofflaws (address);
CREATE INDEX IF NOT EXISTS idx_violations_date ON violations (violation_date);