# NLU Back-End Take-Home Assessment — Session Log

> **Project:** Chicago Building Violations API
> **Stack:** Node.js · Express · PostgreSQL · no ORM
> **Developer:** Rick Maya
> **Repo:** `nlu-api`

---

## Session 1 — Project Setup & Scaffolding

### Goals
- Decide on tech stack
- Create GitHub repo
- Scaffold project structure
- Get a running Express server

### Decisions Made
- **Stack chosen:** Node.js + Express + PostgreSQL (`pg` library, no ORM)
- Chose Node over Java intentionally — project spec said "use what you're most comfortable with" and clean, confident code matters more than language choice in this evaluation
- No frontend needed — this is a pure backend API project

### Environment
- MacOS (Intel) · Homebrew at `/usr/local`
- Node v20.8.0 · npm 10.1.0 · psql 14.17 · git 2.48.1

### Steps Completed

#### GitHub Repo
- Created repo `nlu-api` on GitHub with Node `.gitignore` and README

#### Project Scaffolded
```
nlu-api/
├── controllers/
│   └── propertyController.js
├── db/
│   └── db.js
├── docs/
│   └── api.md
├── routes/
│   └── property.js
├── scripts/
│   └── ingest.js
├── sql/
│   └── create_tables.sql
├── .env
├── .gitignore
├── index.js
└── README.md
```

#### Dependencies Installed
```bash
npm install express pg dotenv csv-parse
```

#### `index.js` — Express server wired up
```javascript
require('dotenv').config();
const express = require('express');
const propertyRoutes = require('./routes/property');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/property', propertyRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### `.env` configured
```
PORT=3000
DB_USER=slickrick
DB_HOST=localhost
DB_NAME=nlu_api
DB_PASSWORD=
DB_PORT=5432
```

### Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `psql: No such file or directory` | PostgreSQL service not running | Started manually with `pg_ctl` |
| `brew services start` bootstrap error (I/O error 5) | Missing plist file | Ran `brew unlink` + `brew link postgresql@14` to regenerate plist |
| `pg_ctl` data directory not found | Intel Mac uses `/usr/local` not `/opt/homebrew` | Used `brew --prefix postgresql@14` to find correct path |
| Stale `postmaster.pid` lock file | Postgres crashed without cleanup | Deleted `postmaster.pid` manually |
| `psql` connection refused | No `-U` flag specified | Used `psql -U slickrick postgres` |

### PostgreSQL Setup
- Database created: `nlu_api`
- Postgres now auto-starts on login via `brew services`
- Connect going forward: `psql -U slickrick nlu_api`

---

## Session 2 — Database Tables & Ingestion

### Goals
- Write and run `CREATE TABLE` SQL scripts
- Wire up `db.js` connection pool
- Write and run `scripts/ingest.js` to load Chicago CSV data

### Steps Completed

#### `sql/create_tables.sql`
```sql
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
```

**Design decisions worth knowing for round 3:**
- `address` is `TEXT` on all tables — no truncation risk
- Indexes on `address` in both tables — every query filters on it
- Index on `violation_date` — endpoint 3 filters by date
- `SERIAL PRIMARY KEY` — no need for UUIDs here

#### `db/db.js` — Connection pool
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT,
});

module.exports = pool;
```

#### `scripts/ingest.js` — CSV loader
- Reads both CSV files using `csv-parse`
- Inserts rows one at a time using `pool.query()` with parameterized queries
- Logs progress every 1,000 rows
- CSV files location: `~/Desktop/NLU_backEnd_takeHome_assessment_final/datasets/`

#### Ingest Results
```
Violations done - 77,492 rows inserted
Scofflaws done - 555 rows inserted
```

### Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| Script ran silently with no output | `main()` was never called at the bottom of the file | Added `main()` call |
| `pool.query is not a function` | `db.js` was empty | Added Pool setup and `module.exports = pool` |
| `module.exports` missing | Forgot the last line of `db.js` | Added `module.exports = pool` |
| `dotenv` v17 swallowing logs | npm installed `dotenvx` rebranded as dotenv v17 | Downgraded to `dotenv@16` |

### Key Lessons
- The terminal and SQL files are separate — psql executes against the DB, files must be written manually
- `\i /path/to/file.sql` runs a SQL file from inside psql
- Always write SQL in the file first, run it second — the file is the source of truth

---

## Session 3 — Building the API Endpoints

### Goals
- Build all three API endpoints
- Test each with `curl`

### Steps Completed

#### Endpoint 1 — `GET /property/:address`
Returns violations history and scofflaw status for a given address.

**`controllers/propertyController.js`**
```javascript
const pool = require('../db/db.js');

const getPropertyByAddress = async (req, res) => {
  const { address } = req.params;

  try {
    const violationsResult = await pool.query(
      `SELECT id, violation_date, violation_code, status, description, inspector_comments
       FROM violations
       WHERE LOWER(address) = LOWER($1)
       ORDER BY violation_date DESC`,
      [address]
    );

    const scofflawsResult = await pool.query(
      `SELECT id FROM scofflaws
       WHERE LOWER(address) = LOWER($1)
       LIMIT 1`,
      [address]
    );

    res.json({
      address,
      is_scofflaw: scofflawsResult.rows.length > 0,
      violations: violationsResult.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getPropertyByAddress };
```

**`routes/property.js`**
```javascript
const express = require('express');
const router = express.Router();
const { getPropertyByAddress } = require('../controllers/propertyController');

router.get('/:address', getPropertyByAddress);

module.exports = router;
```

**Test:**
```bash
curl "http://localhost:3000/property/7120%20S%20ROCKWELL%20ST"
```

**Response:**
```json
{
  "address": "7120 S ROCKWELL ST",
  "is_scofflaw": false,
  "violations": [
    {
      "id": 1,
      "violation_date": "2025-08-14T05:00:00.000Z",
      "violation_code": "CN104035",
      "status": "OPEN",
      "description": "MAINTAIN WINDOW",
      "inspector_comments": "BASEMENT - WINDOWS PANES BROKEN.14X-3-303.13"
    }
  ]
}
```

### Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| curl returned nothing | `res.json()` was missing from controller | Added response with `violations` and `is_scofflaw` |
| Violations array empty | Testing with address not in DB | Used `SELECT DISTINCT address FROM violations LIMIT 5` to get real addresses |

### In Progress
- Endpoint 2 — `POST /property/:address/comments`
- Endpoint 3 — `GET /property/scofflaws/violations?since=<date>`

---

## Next Session
- Complete and test endpoint 2
- Build and test endpoint 3
- Write `docs/api.md` JSON schema documentation
- Final cleanup and README

---

*Last updated: Session 3*
