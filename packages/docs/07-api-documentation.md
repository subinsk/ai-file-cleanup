# AI File Cleanup - API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3001` (Development) | `https://your-api.render.com` (Production)

## Table of Contents

1. [Authentication](#authentication)
2. [Error Codes](#error-codes)
3. [Rate Limiting](#rate-limiting)
4. [Endpoints](#endpoints)
   - [Health & System](#health--system)
   - [Authentication](#authentication-endpoints)
   - [File Operations](#file-operations)
   - [Deduplication](#deduplication)
   - [User Quota](#user-quota)
   - [License Management](#license-management)
5. [Request/Response Examples](#examples)
6. [SDK & Client Libraries](#sdk--client-libraries)

---

## Authentication

The API uses JWT (JSON Web Token) authentication with two methods:

### Method 1: Cookie-Based (Recommended for Web)

```http
Cookie: access_token=<jwt_token>
```

### Method 2: Authorization Header (Recommended for Desktop/Mobile)

```http
Authorization: Bearer <jwt_token>
```

### Obtaining a Token

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "YourPassword123"
  }'
```

**Response:**

```json
{
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "usr_123456",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning               | Description                       |
| ---- | --------------------- | --------------------------------- |
| 200  | OK                    | Request succeeded                 |
| 201  | Created               | Resource created successfully     |
| 400  | Bad Request           | Invalid request parameters        |
| 401  | Unauthorized          | Authentication required or failed |
| 403  | Forbidden             | Insufficient permissions          |
| 404  | Not Found             | Resource not found                |
| 413  | Payload Too Large     | Request entity too large          |
| 422  | Unprocessable Entity  | Validation error                  |
| 429  | Too Many Requests     | Rate limit exceeded               |
| 500  | Internal Server Error | Server error                      |

### Error Response Format

All errors return a consistent format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Error Scenarios

#### 401 Unauthorized

```json
{
  "detail": "Not authenticated"
}
```

#### 422 Validation Error

```json
{
  "detail": {
    "errors": [
      "Password must be at least 8 characters long",
      "Password must contain at least one uppercase letter"
    ]
  }
}
```

#### 429 Rate Limit

```json
{
  "detail": "Rate limit exceeded. Maximum 100 requests per 60 seconds."
}
```

---

## Rate Limiting

### Limits by Endpoint Type

| Endpoint Type  | Limit        | Window     |
| -------------- | ------------ | ---------- |
| General API    | 100 requests | 60 seconds |
| Authentication | 10 attempts  | 5 minutes  |
| File Upload    | 20 uploads   | 5 minutes  |

### Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Window: 60
```

### Handling Rate Limits

When rate limited, wait for the window to reset before retrying. Implement exponential backoff in client applications.

---

## Endpoints

### Health & System

#### GET /health

Check API health status.

**Authentication:** Not required

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "version": "1.0.0"
}
```

#### GET /

API root endpoint with service information.

**Authentication:** Not required

**Response:**

```json
{
  "service": "AI File Cleanup API",
  "version": "1.0.0",
  "status": "running",
  "docs": "/docs"
}
```

#### GET /metrics

Get API metrics and statistics.

**Authentication:** Not required

**Response:**

```json
{
  "requests_total": 1523,
  "requests_per_second": 2.5,
  "average_response_time_ms": 145,
  "active_connections": 12
}
```

---

### Authentication Endpoints

#### POST /auth/register

Register a new user account.

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "name": "Jane Doe"
}
```

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit

**Response (201 Created):**

```json
{
  "id": "usr_789012",
  "email": "newuser@example.com",
  "name": "Jane Doe",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Errors:**

- `400`: Email already registered
- `422`: Password doesn't meet requirements

#### POST /auth/login

Login with email and password.

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**

```json
{
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "usr_123456",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

**Errors:**

- `401`: Invalid credentials

#### POST /auth/logout

Logout current user.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "message": "Logged out successfully"
}
```

#### GET /auth/me

Get current user information.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "id": "usr_123456",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### File Operations

#### POST /files/upload

Upload and process multiple files.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request:**

```bash
curl -X POST http://localhost:3001/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "files=@document.pdf" \
  -F "files=@image.jpg" \
  -F "files=@text.txt"
```

**Limits:**

- Maximum 100 files per request
- Maximum 50MB per file
- Maximum 500MB total

**Response (200 OK):**

```json
{
  "results": [
    {
      "success": true,
      "file_id": "a7f9e3b2c1d4...",
      "filename": "document.pdf",
      "mime_type": "application/pdf",
      "file_hash": "a7f9e3b2c1d4e5f6...",
      "file_type": "pdf",
      "text_content": "Extracted text from PDF...",
      "text_excerpt": "First 500 characters...",
      "metadata": {
        "size": 1048576,
        "pages": 5
      },
      "processing_info": {
        "processing_time_ms": 234
      }
    }
  ],
  "total_files": 3,
  "successful_files": 3,
  "failed_files": 0,
  "groups": []
}
```

**Errors:**

- `400`: Too many files or invalid file type
- `413`: File too large
- `429`: Quota exceeded

#### GET /files/supported-types

Get list of supported file types and processing capabilities.

**Authentication:** Not required

**Response (200 OK):**

```json
{
  "supported_types": {
    "images": ["image/jpeg", "image/png", "image/gif", "image/webp"],
    "documents": ["application/pdf"],
    "text": ["text/plain", "text/csv"]
  },
  "processing_capabilities": {
    "pdf_text_extraction": true,
    "image_normalization": true,
    "perceptual_hashing": true,
    "text_embedding": true,
    "image_embedding": true
  }
}
```

---

### Deduplication

#### POST /dedupe/preview

Generate duplicate detection preview with AI analysis.

**Authentication:** Required

**Request Body:**

```json
{
  "files": [
    {
      "name": "document1.pdf",
      "type": "application/pdf",
      "size": 1048576,
      "path": "/path/to/document1.pdf"
    },
    {
      "name": "document2.pdf",
      "type": "application/pdf",
      "size": 1050000,
      "path": "/path/to/document2.pdf"
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "uploadId": "upl_abc123",
  "files": [
    {
      "id": "file_0",
      "fileName": "document1.pdf",
      "sizeBytes": 1048576,
      "mimeType": "application/pdf",
      "sha256": "a7f9e3b2...",
      "success": true,
      "text_content": "Document content...",
      "file_hash": "a7f9e3b2..."
    }
  ],
  "groups": [
    {
      "id": "group_0",
      "groupIndex": 0,
      "keepFile": {
        "id": "file_0",
        "fileName": "document1.pdf",
        "sizeBytes": 1048576
      },
      "duplicates": [
        {
          "file": {
            "id": "file_1",
            "fileName": "document2.pdf",
            "sizeBytes": 1050000
          },
          "similarity": 1.0,
          "reason": "Exact hash match",
          "isKept": false
        }
      ],
      "reason": "Exact hash match",
      "totalSizeSaved": 1050000
    }
  ],
  "processing_stats": {
    "total_files": 2,
    "successful_files": 2,
    "duplicate_groups": 1,
    "total_duplicates": 1,
    "text_embeddings_generated": 2,
    "image_embeddings_generated": 0
  }
}
```

**Errors:**

- `400`: Invalid file data
- `422`: Validation error (too many files, file too large)
- `500`: Processing failed

#### POST /dedupe/zip

Create ZIP file of selected files (after deduplication).

**Authentication:** Required

**Request Body:**

```json
{
  "uploadId": "upl_abc123",
  "fileIds": ["file_0", "file_3", "file_5"]
}
```

**Response:**
Streaming ZIP file download with headers:

```http
Content-Type: application/zip
Content-Disposition: attachment; filename=cleaned-files-upl_abc123.zip
Content-Length: 3145728
```

**Errors:**

- `404`: Upload ID not found
- `500`: ZIP creation failed

---

### User Quota

#### GET /quota

Get current user's quota usage.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "user_id": "usr_123456",
  "email": "user@example.com",
  "quota": {
    "storage_used_bytes": 52428800,
    "storage_limit_bytes": 1073741824,
    "storage_used_mb": 50.0,
    "storage_limit_mb": 1000,
    "storage_percentage": 4.88,
    "uploads_count": 5,
    "uploads_limit": 50,
    "files_count": 23
  }
}
```

---

### License Management

#### POST /license/generate

Generate a new license key (Admin only).

**Authentication:** Required (Admin)

**Request Body:**

```json
{
  "userId": "usr_123456",
  "expiresInDays": 365
}
```

**Response (201 Created):**

```json
{
  "license_key": "lic_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "usr_123456",
  "expires_at": "2026-01-15T10:00:00Z"
}
```

#### POST /desktop/validate-license

Validate a license key (Desktop app).

**Authentication:** Not required

**Request Body:**

```json
{
  "licenseKey": "lic_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "valid": true,
  "user_id": "usr_123456",
  "email": "user@example.com",
  "expires_at": "2026-01-15T10:00:00Z"
}
```

**Errors:**

- `401`: Invalid or expired license key

---

## Examples

### Complete Workflow Example

```bash
#!/bin/bash

API_URL="http://localhost:3001"

# 1. Register a new user
echo "Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "DemoPass123",
    "name": "Demo User"
  }')

# 2. Login
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "DemoPass123"
  }')

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "Token: $TOKEN"

# 3. Check quota
echo "Checking quota..."
curl -s -X GET "$API_URL/quota" \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Upload files
echo "Uploading files..."
curl -X POST "$API_URL/files/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@document1.pdf" \
  -F "files=@document2.pdf" \
  -F "files=@image.jpg" | jq

# 5. Get dedupe preview
echo "Getting dedupe preview..."
curl -X POST "$API_URL/dedupe/preview" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "name": "document1.pdf",
        "type": "application/pdf",
        "size": 1048576,
        "path": "./document1.pdf"
      }
    ]
  }' | jq

# 6. Logout
echo "Logging out..."
curl -s -X POST "$API_URL/auth/logout" \
  -H "Authorization: Bearer $TOKEN"
```

### Python SDK Example

```python
import requests
import json

class AIFileCleanupClient:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
        self.token = None

    def login(self, email, password):
        """Login and store token"""
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["access_token"]
        return data["user"]

    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"}

    def upload_files(self, file_paths):
        """Upload files for processing"""
        files = [
            ("files", open(path, "rb"))
            for path in file_paths
        ]

        response = requests.post(
            f"{self.base_url}/files/upload",
            files=files,
            headers=self.get_headers()
        )
        response.raise_for_status()
        return response.json()

    def get_dedupe_preview(self, files_data):
        """Get duplicate detection preview"""
        response = requests.post(
            f"{self.base_url}/dedupe/preview",
            json={"files": files_data},
            headers=self.get_headers()
        )
        response.raise_for_status()
        return response.json()

    def get_quota(self):
        """Get user quota information"""
        response = requests.get(
            f"{self.base_url}/quota",
            headers=self.get_headers()
        )
        response.raise_for_status()
        return response.json()

# Usage example
client = AIFileCleanupClient()
user = client.login("demo@example.com", "DemoPass123")
print(f"Logged in as {user['email']}")

# Upload files
result = client.upload_files(["document1.pdf", "document2.pdf"])
print(f"Uploaded {result['successful_files']} files")

# Check quota
quota = client.get_quota()
print(f"Storage used: {quota['quota']['storage_used_mb']}MB / {quota['quota']['storage_limit_mb']}MB")
```

### JavaScript/TypeScript SDK Example

```typescript
class AIFileCleanupClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error('Login failed');

    const data = await response.json();
    this.token = data.access_token;
    return data.user;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  async uploadFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    return await response.json();
  }

  async getQuota() {
    const response = await fetch(`${this.baseUrl}/quota`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to get quota');
    return await response.json();
  }
}

// Usage
const client = new AIFileCleanupClient();
await client.login('demo@example.com', 'DemoPass123');
const quota = await client.getQuota();
console.log(`Storage: ${quota.quota.storage_used_mb}MB used`);
```

---

## Best Practices

### 1. Error Handling

Always check response status codes and handle errors gracefully:

```python
try:
    response = requests.post(url, json=data)
    response.raise_for_status()
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 429:
        # Rate limited - wait and retry
        time.sleep(60)
        response = requests.post(url, json=data)
    else:
        # Handle other errors
        print(f"Error: {e.response.json()['detail']}")
```

### 2. Token Management

Store tokens securely and refresh when needed:

```typescript
// Store in httpOnly cookie (web) or secure storage (mobile)
localStorage.setItem('token', token); // Not recommended for production

// Better: Use httpOnly cookies
// Server sets: Set-Cookie: access_token=<token>; HttpOnly; Secure; SameSite=Strict
```

### 3. File Upload Optimization

For large files, implement chunking and progress tracking:

```python
def upload_with_progress(file_path, client):
    with open(file_path, "rb") as f:
        # Monitor upload progress
        response = client.upload_files([file_path])
    return response
```

### 4. Rate Limit Handling

Implement exponential backoff:

```python
def api_call_with_backoff(func, max_retries=3):
    for i in range(max_retries):
        try:
            return func()
        except RateLimitError:
            wait_time = 2 ** i  # Exponential backoff
            time.sleep(wait_time)
    raise Exception("Max retries exceeded")
```

---

## Interactive API Documentation

Visit `/docs` (Swagger UI) for interactive API documentation where you can test endpoints directly:

**URL:** http://localhost:3001/docs

Features:

- Try out endpoints directly from browser
- See request/response schemas
- View all available endpoints
- Authentication testing

---

## Support

For API issues or questions:

- GitHub Issues: [Repository URL]
- Email: support@aifilecleanup.com
- Documentation: [Docs URL]

**API Version:** 1.0.0  
**Last Updated:** January 2025
