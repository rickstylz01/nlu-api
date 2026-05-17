# API Documentation

## Base URL
http://localhost:3000
---
## ENDPOINTS  

### 1. Get Property Violations & Scofflaw Status

**`GET /property/:address`**
Returns all building violations for a given address and whether the address appears on the Chicago Building Code Scofflaw List.

#### URL Parameters

| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| address   | string | Yes      | Full property address (e.g. `7120 S ROCKWELL ST`) |

#### Response -- 200 OK

```json
{
  "address": "7120 S ROCKWELL ST",
  "is_scofflaw": false,
  "violations": [
    {
      "id": 1,
      "violation_date": "2025-08-14",
      "status": "OPEN",
      "description": "MAINTAIN WINDOW",
      "inspector_comments": "BASEMENT - WINDOW PANES BROKEN"
    }
  ]
}
```

#### Response Fields

| Field               | Type    | Description                                      |
|---------------------|---------|--------------------------------------------------|
| address             | string  | The queried address                              |
| is_scofflaw         | boolean | Whether the address appears on the scofflaw list |
| violations          | array   | List of all violations for this address          |
| violations[].id     | integer | Unique violation ID                              |
| violations[].violation_date | string | Date of violation (YYYY-MM-DD)        |
| violations[].violation_code | string | City violation code                   |
| violations[].status | string  | Violation status (OPEN, COMPLIED, NO ENTRY)      |
| violations[].description | string | Human-readable violation description        |
| violations[].inspector_comments | string | Inspector notes (may be null)      |

#### Example Request
```bash
curl "http://localhost:3000/property/7120%20S%20ROCKWELL%20ST"
```

---

### 2. Post a Comment on a Property

**`POST /property/:address/comments`**

Saves a comment associated with a given property address.

#### URL Parameters

| Parameter | Type   | Required | Description          |
|-----------|--------|----------|----------------------|
| address   | string | Yes      | Full property address |

#### Request Body

```json
{
  "author": "Rick Maya",
  "comment": "This building has been a problem for years"
}
```

#### Request Body Fields

| Field   | Type   | Required | Description              |
|---------|--------|----------|--------------------------|
| author  | string | Yes      | Name of the commenter    |
| comment | string | Yes      | The comment text         |

#### Response — 201 Created

```json
{
  "id": 1,
  "address": "7120 S ROCKWELL ST",
  "author": "Rick Maya",
  "comment": "This building has been a problem for years",
  "created_at": "2026-05-16T01:32:33.999Z"
}
```

#### Response Fields

| Field      | Type    | Description                        |
|------------|---------|------------------------------------|
| id         | integer | Auto-generated comment ID          |
| address    | string  | The property address               |
| author     | string  | Name of the commenter              |
| comment    | string  | The comment text                   |
| created_at | string  | ISO 8601 timestamp of creation     |

#### Error Response — 400 Bad Request
```json
{
  "error": "author and comment are required"
}
```

#### Example Request
```bash
curl -X POST "http://localhost:3000/property/7120%20S%20ROCKWELL%20ST/comments" \
-H "Content-Type: application/json" \
-d '{"author": "Rick Maya", "comment": "This building has been a problem for years"}'
```

---

### 3. Get Scofflaws With Recent Violations

**`GET /property/scofflaws/violations?since=<date>`**

Returns all addresses on the Chicago Building Code Scofflaw List that also have at least one building violation on or after the specified date.

#### Query Parameters

| Parameter | Type   | Required | Description                              |
|-----------|--------|----------|------------------------------------------|
| since     | string | Yes      | Filter violations on or after this date (YYYY-MM-DD) |

#### Response — 200 OK

```json
{
  "since": "2024-01-01",
  "count": 27,
  "results": [
    {
      "address": "1115 E 81ST ST",
      "violations": [
        {
          "id": 1452,
          "violation_date": "2025-07-31",
          "violation_code": "PL157047",
          "status": "OPEN",
          "description": "STOP LEAKING WATER"
        }
      ]
    }
  ]
}
```

#### Response Fields

| Field                        | Type    | Description                                      |
|------------------------------|---------|--------------------------------------------------|
| since                        | string  | The date filter used in the query                |
| count                        | integer | Number of scofflaw addresses returned            |
| results                      | array   | List of scofflaw addresses with their violations |
| results[].address            | string  | Scofflaw property address                        |
| results[].violations         | array   | Violations on or after the since date            |
| results[].violations[].id   | integer | Unique violation ID                              |
| results[].violations[].violation_date | string | Date of violation (YYYY-MM-DD)      |
| results[].violations[].violation_code | string | City violation code               |
| results[].violations[].status | string | Violation status                               |
| results[].violations[].description | string | Human-readable violation description      |

#### Error Response — 400 Bad Request
```json
{
  "error": "since query parameter is required"
}
```

#### Example Request
```bash
curl "http://localhost:3000/property/scofflaws/violations?since=2024-01-01" | json_pp
```

---

## Error Responses

All endpoints return the following structure for server errors:

```json
{
  "error": "Internal server error"
}
```

| Status Code | Meaning                                      |
|-------------|----------------------------------------------|
| 200         | Success                                      |
| 201         | Resource created successfully                |
| 400         | Bad request — missing required parameters    |
| 500         | Internal server error                        |