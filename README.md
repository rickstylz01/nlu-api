# nlu-api

A REST API service built on Chicago open data that allows users to look up building violations, check scofflaw status, and post comments on properties.

Built with Node.js, Express, and PostgreSQL. No ORM — all queries written in raw SQL.

---

## Tech Stack

- **Runtime:** Node.js v20
- **Framework:** Express
- **Database:** PostgreSQL 14
- **Libraries:** `pg`, `dotenv`, `csv-parse`

---

## Project Structure

nlu-api/  
├── controllers/  
│   └── propertyController.js   # Request/response logic for all endpoints
├── db/  
│   └── db.js                   # PostgreSQL connection pool
├── docs/  
│   └── api.md                  # Full API schema documentation
├── routes/  
│   └── property.js             # Route definitions
├── scripts/  
│   └── ingest.js               # One-time CSV data loader
├── sql/  
│   └── create_tables.sql       # Database schema
├── .env                        # Environment variables (not committed)
├── index.js                    # Express app entry point
└── README.md

---

## Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL 14
- npm

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/nlu-api.git
cd nlu-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create the `.env` file
```bash
cp .env.example .env
```

local values:
PORT=3000  
DB_USER=your_postgres_username  
DB_HOST=localhost  
DB_NAME=nlu_api  
DB_PASSWORD=  
DB_PORT=5432

### 4. Create the database
```bash
psql -U your_postgres_username postgres
```
```sql
CREATE DATABASE nlu_api;
\q
```

### 5. Create the tables
```bash
psql -U your_postgres_username nlu_api -f sql/create_tables.sql
```

### 6. Download the datasets
Download the following datasets from the Chicago Data Portal and place them in a local `datasets/` folder:
- [Chicago Building Violations](https://data.cityofchicago.org/Buildings/Building-Violations/22u3-xenr)
- [Building Code Scofflaw List](https://data.cityofchicago.org/Buildings/Building-Code-Scofflaw-List/hgtm-cm34)

Then update the file paths in `scripts/ingest.js` to point to your local copies.

### 7. Run the ingestion script
```bash
node scripts/ingest.js
```

This loads 77,492 violations and 555 scofflaw records into the database. Run once.

### 8. Start the server
```bash
node index.js
```

Server runs on `http://localhost:3000`.

---

## API Endpoints

See [`docs/api.md`](docs/api.md) for full schema documentation.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/property/:address` | Get violations and scofflaw status for an address |
| POST | `/property/:address/comments` | Post a comment on a property |
| GET | `/property/scofflaws/violations?since=<date>` | Get scofflaws with recent violations |

### Quick Examples

```bash
# Get violations for an address
curl "http://localhost:3000/property/7120%20S%20ROCKWELL%20ST"

# Post a comment
curl -X POST "http://localhost:3000/property/7120%20S%20ROCKWELL%20ST/comments" \
-H "Content-Type: application/json" \
-d '{"author": "Rick Maya", "comment": "Ongoing issues at this property"}'

# Get scofflaws with violations since a date
curl "http://localhost:3000/property/scofflaws/violations?since=2024-01-01" | json_pp
```

---

## Database Schema

### `violations`
Sourced from the Chicago Building Violations dataset (77,492 rows).

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| address | TEXT | Property address |
| violation_date | DATE | Date of violation |
| violation_code | TEXT | City violation code |
| status | TEXT | OPEN, COMPLIED, or NO ENTRY |
| description | TEXT | Human-readable description |
| inspector_comments | TEXT | Inspector notes |

### `scofflaws`
Sourced from the Chicago Building Code Scofflaw List (555 rows).

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| address | TEXT | Property address |

### `comments`
User-submitted comments stored by the API.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| address | TEXT | Property address |
| author | TEXT | Commenter name |
| comment | TEXT | Comment text |
| created_at | TIMESTAMP | Auto-generated timestamp |

---

## Design Decisions

**No ORM** — All queries use raw SQL via the `pg` library as required by the project spec. This keeps the data layer transparent and explicit.

**Address matching** — All address comparisons use `LOWER()` on both sides to handle case inconsistencies between the two datasets.

**Indexes** — Indexes are applied to `address` on both `violations` and `scofflaws`, and to `violation_date` on `violations`. Every query in this API filters or joins on these columns so the indexes have real impact at scale.

**Deduplication** — The scofflaws dataset contains duplicate addresses. The join between scofflaws and violations was multiplying results. Fixed using `DISTINCT` inside `json_agg` with `jsonb_build_object` to deduplicate at the query level.

**Route ordering** — `/scofflaws/violations` is registered before `/:address` in the router. Express matches routes in order and would otherwise interpret `scofflaws` as an address parameter.

**201 vs 200** — The comments endpoint returns HTTP `201 Created` rather than `200 OK` to accurately reflect that a new resource was created.
