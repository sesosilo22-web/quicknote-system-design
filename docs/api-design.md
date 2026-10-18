
# QuickNotes REST API Design

## 1. Overview

QuickNotes provides a REST API for authenticated users to create,
read, update and delete notes and manage tags.

Base URL: `https://api.quicknotes.example/v1`

All request and response bodies use JSON unless otherwise specified.
Authenticated endpoints require a valid bearer access token.

## 2. Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| POST | /auth/register | Register a user | 201 Created |
| POST | /auth/login | Authenticate a user | 200 OK |
| GET | /notes | List the authenticated user's notes | 200 OK |
| POST | /notes | Create a note | 201 Created |
| GET | /notes/{noteId} | Retrieve one note | 200 OK |
| PATCH | /notes/{noteId} | Update a note | 200 OK |
| DELETE | /notes/{noteId} | Delete a note | 204 No Content |
| GET | /tags | List the user's tags | 200 OK |
| POST | /tags | Create a tag | 201 Created |
| PUT | /notes/{noteId}/tags/{tagId} | Attach a tag to a note | 200 OK |
| DELETE | /notes/{noteId}/tags/{tagId} | Remove a tag from a note | 204 No Content |

## 3. List notes

Request:

GET /v1/notes?page=1&limit=20

Authorization: Bearer <access-token>

Successful response (200 OK):

{
  "data": [
    {
      "id": 42,
      "title": "Study plan",
      "body": "Revise chemistry",
      "createdAt": "2026-10-17T10:00:00Z",
      "updatedAt": "2026-10-17T10:00:00Z",
      "tags": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}

## 4. Create a note

Request:

POST /v1/notes

Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "My first note",
  "body": "Learn how APIs work"
}

Successful response (201 Created):

{
  "data": {
    "id": 101,
    "title": "My first note",
    "body": "Learn how APIs work",
    "createdAt": "2026-10-17T10:00:00Z",
    "updatedAt": "2026-10-17T10:00:00Z",
    "tags": []
  }
}

The server generates the note ID and timestamps and associates the note
with the authenticated user. Clients must not choose another user's ID.

## 5. Update and delete

PATCH /v1/notes/101

Request body:

{
  "title": "Updated title"
}

Response: 200 OK with the updated note.

DELETE /v1/notes/101

Response: 204 No Content. The response has no JSON body.

A user can only update or delete notes they own.

## 6. Error responses

| Status | Name | Meaning |
|---|---|---|
| 400 | Bad Request | Invalid JSON, fields or pagination |
| 401 | Unauthorized | Missing, invalid or expired token |
| 403 | Forbidden | Authenticated user lacks permission |
| 404 | Not Found | Resource does not exist or is unavailable to the user |
| 409 | Conflict | Duplicate resource or conflicting operation |
| 422 | Unprocessable Content | Valid JSON but invalid field values |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server-side failure |
| 503 | Service Unavailable | Service temporarily unavailable |

Example error body:

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title must be between 1 and 100 characters.",
    "details": {
      "field": "title"
    },
    "requestId": "req-example-123"
  }
}

The API must never return passwords, access tokens or private data
belonging to other users in an error response.

## 7. Design decisions

- Use nouns for resources and HTTP methods for actions.
- Use pagination to prevent excessively large list responses.
- Require authentication for private notes and tags.
- Validate title length and all incoming fields on the server.
- Enforce ownership checks on every note and tag operation.
- Use 201 for successful creation and 204 for deletion without a body.
- Use TLS, rate limits, structured logging and consistent error responses.
