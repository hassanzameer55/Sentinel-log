# Sentinel Log: API Reference v1.0

Welcome to the Sentinel Log Developer Portal. This document describes the REST API endpoints for ingestion, querying, and management.

## Authentication
All requests (except `/auth/login`) require a valid JWT cookie OR an API Key header.

**API Key Header:**
`x-api-key: <YOUR_API_KEY>`

---

## 1. Log Ingestion

### Single Log Ingestion
`POST /api/v1/logs`

**Body:**
```json
{
  "level": "ERROR",
  "service_id": "payment-gateway",
  "message": "Failed to process transaction",
  "request_id": "uuid-v4",
  "metadata": { "user_id": 123 }
}
```

### Bulk Ingestion (NDJSON)
`POST /api/v1/logs/bulk`
Stream multiple JSON objects separated by newlines.

---

## 2. Query & Search

### Fetch Logs
`GET /api/v1/logs`

**Parameters:**
- `service_id`: Filter by service name.
- `level`: Filter by level (INFO, ERROR, etc).
- `search`: Full-text search query.
- `limit`: Results per page (Default 50).
- `next_cursor`: Pagination cursor from previous response.

### Distributed Trace
`GET /api/v1/logs/trace/:requestId`
Returns the chronological flow of a specific request.

---

## 3. Analytics & Export

### Aggregated Stats
`GET /api/v1/logs/stats`
Returns trends and distribution data for dashboarding.

### Export Logs
`GET /api/v1/logs/export?format=csv`
Downloads logs as a CSV file.

---

## Error Codes
| Code | Description |
|---|---|
| `UNAUTHORIZED` | Missing or invalid authentication. |
| `FORBIDDEN` | User does not have required permissions (RBAC). |
| `BAD_REQUEST` | Validation failed for input data. |
| `INTERNAL_ERROR` | Server-side exception. |
