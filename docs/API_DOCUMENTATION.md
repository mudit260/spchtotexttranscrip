# Code API


> **API Documentation** | Generated on 2026-03-13 12:48:34

---

# Code API Documentation

---

## 1. Overview

* **API Name:** Code API
* **Purpose / Business Value:** Provides a small file-processing API to accept audio uploads, run a transcription/workflow (using local Whisper and an LLM engine), and return generated documents. Includes a root health/metadata endpoint, an upload endpoint that accepts audio via multipart/form-data, and a download endpoint to retrieve generated DOCX files.
* **Base URL:** `None`
* **API Version:** v1
* **Supported Formats:** application/json, multipart/form-data (for file upload), application/vnd.openxmlformats-officedocument.wordprocessingml.document (DOCX binary download)
* **Detected Frameworks:** Flask
* **Total Endpoints:** 3
* **Last Updated:** 2026-03-13 12:48:34

### Key Features

* Upload audio files for transcription/processing
* Integrates with local Whisper engine and an LLM engine (e.g. Ollama) via form parameters
* Download generated DOCX documents
* Simple health/root endpoint

### Endpoint Distribution

| Method | Count | Description |
|--------|-------|-------------|
| `GET` | 2 | Data retrieval, data transfer |
| `POST` | 1 | Data transfer |

---

## 2. Authentication & Authorization

* **Authentication Type:** Token
* **How to Obtain Credentials:** This codebase contains no authentication patterns; no credentials or tokens are required by the detected endpoints.
* **How to Pass Credentials:** None

### Authentication Endpoints

* `GET /` - Authentication
* `POST /upload-audio` - Authentication
* `GET /download/{filename}` - Authentication

**Example Query Parameter:**

```
?api_key=Token <token>
```

---

## 3. Common Headers

The following headers are commonly used across all endpoints:

| Header | Required | Description |
|:-------|:--------:|:------------|
| Authorization | Optional | Not required by the detected code. Present only if you add authentication to the API. |
| Content-Type | Yes | For upload endpoint: multipart/form-data; for JSON responses: application/json. For download responses: binary DOCX content type. |

---

## 4. Error Handling

| Status Code | Meaning |
|:-----------:|:--------|
| 200 | Success |
| 400 | Bad Request (e.g. invalid input or missing form fields) |
| 401 | Unauthorized (not used in current codebase) |
| 404 | Not Found (e.g. requested file for download does not exist) |
| 500 | Internal Server Error (unhandled exceptions during processing) |

**Error Response Format:**

```json
{
  "status": 400,
  "message": "Error message (string) - used in code, e.g. {\"error\": \"File not found\"}",
  "data": null
}
```

### Common Error Types

| Error Code | Description |
|:----------:|:------------|
| `FILE_NOT_FOUND` | Download requested for a filename that does not exist (maps to JSONResponse with 404 and {"error": "File not found"}). |
| `VALIDATION_ERROR` | Input validation failed (missing file, wrong form fields or invalid parameters). |
| `PROCESSING_ERROR` | Server-side error during file save/transcription/LLM processing. |

---

## 5. Resource Endpoints

### Downloads

#### GET – Fetch Resource

*Retrieve operations using the GET method*

#### Download File

**Method:** GET
**Endpoint:** `/download/{filename}`

🔄 **Idempotent:** This operation is idempotent - multiple identical requests have the same effect as a single request.

**Description:** Returns a generated DOCX file identified by the path parameter filename.

**Request Headers:**

| Header | Required | Value |
|:-------|:--------:|:------|
| Authorization | Yes | Token |

**Path Parameters:**

| Parameter | Type | Required | Description |
|:----------|:----:|:--------:|:------------|
| `filename` | string | Yes | Resource identifier |

**Response**

**Status Code:** `200 OK`

```json
{
  "id": 1,
  "name": "Example download",
  "status": "active"
}
```

**Possible Status Codes:**

| Status Code | Scenario | Description |
|:------------|:---------|:------------|
| `200` | Successful request | Successful request |
| `404` | Resource not found | Source: FastAPI |


**Response Examples by Status Code:**

**404 Not Found:**
```json
{
  "error": "Error 404: Not Found",
  "status_code": 404
}
```


**Code Examples:**

**cURL:**
```bash
curl -X GET '/download/{filename}' \
  -H 'Authorization: Token <token> YOUR_TOKEN'
```

**Python (requests):**
```python
import requests

url = '/download/{filename}'
headers = {
    'Authorization': 'Token <token> YOUR_TOKEN',
}

response = requests.get(url, headers=headers)
print(response.json())
```

**JavaScript (fetch):**
```javascript
const url = '/download/{filename}';
const options = {
  method: 'GET',
  headers: {
    'Authorization': 'Token <token> YOUR_TOKEN',
  }
};

fetch(url, options)
  .then(response => response.json())
  .then(data => console.log(data));
```

---

*Source: `attached_assets/spchtotextdeploy_1756818552800.py`*

### Upload-audios

#### POST – Create Resource

*Create operations using the POST method*

#### Retrieve Upload Audio

**Method:** POST
**Endpoint:** `/upload-audio`

**Description:** Uploads an audio file, runs speech-to-text (using the specified ASR engine) and post-processes the transcript with an LLM to produce a corrected text and a .

**Request Headers:**

| Header | Required | Value |
|:-------|:--------:|:------|
| Authorization | Yes | Token |

**Response**

**Status Code:** `200 OK`

```json
{
  "type": "object",
  "properties": {
    "corrected_text": {
      "type": "string",
      "example": "example_corrected_text"
    },
    "docx_file": {
      "type": "string",
      "example": "example_docx_file"
    }
  }
}
```

**Possible Status Codes:**

| Status Code | Scenario | Description |
|:------------|:---------|:------------|
| `200` | Successful request | Successful request |
| `400` | Bad request - invalid input parameters | Source: FastAPI |
| `500` | Internal server error | Source: FastAPI |


**Response Examples by Status Code:**

**200 OK:**
```json
{
  "type": "object",
  "properties": {
    "corrected_text": {
      "type": "string",
      "example": "example_corrected_text"
    },
    "docx_file": {
      "type": "string",
      "example": "example_docx_file"
    }
  }
}
```

**400 Bad Request:**
```json
{
  "error": "Error 400: Bad Request",
  "status_code": 400
}
```

**500 Internal Server Error:**
```json
{
  "error": "Error 500: Internal Server Error",
  "status_code": 500
}
```


**Code Examples:**

**cURL:**
```bash
curl -X POST '/upload-audio' \
  -H 'Authorization: Token <token> YOUR_TOKEN'
```

**Python (requests):**
```python
import requests

url = '/upload-audio'
headers = {
    'Authorization': 'Token <token> YOUR_TOKEN',
}

response = requests.post(url, headers=headers)
print(response.json())
```

**JavaScript (fetch):**
```javascript
const url = '/upload-audio';
const options = {
  method: 'POST',
  headers: {
    'Authorization': 'Token <token> YOUR_TOKEN',
  }
};

fetch(url, options)
  .then(response => response.json())
  .then(data => console.log(data));
```

---

*Source: `attached_assets/spchtotextdeploy_1756818552800.py`*

#### GET – Fetch Resource

*Retrieve operations using the GET method*

#### Root

**Method:** GET
**Endpoint:** `/`

🔄 **Idempotent:** This operation is idempotent - multiple identical requests have the same effect as a single request.

**Description:** Primary purpose: this GET / endpoint serves as a lightweight health/readiness check that returns a brief status message confirming the Speech-to-Text + Grammar Correction API is running.

**Request Headers:**

| Header | Required | Value |
|:-------|:--------:|:------|
| Authorization | Yes | Token |

**Response**

**Status Code:** `200 OK`

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "example": "example_message"
    }
  }
}
```

**Code Examples:**

**cURL:**
```bash
curl -X GET '/' \
  -H 'Authorization: Token <token> YOUR_TOKEN'
```

**Python (requests):**
```python
import requests

url = '/'
headers = {
    'Authorization': 'Token <token> YOUR_TOKEN',
}

response = requests.get(url, headers=headers)
print(response.json())
```

**JavaScript (fetch):**
```javascript
const url = '/';
const options = {
  method: 'GET',
  headers: {
    'Authorization': 'Token <token> YOUR_TOKEN',
  }
};

fetch(url, options)
  .then(response => response.json())
  .then(data => console.log(data));
```

---

*Source: `attached_assets/spchtotextdeploy_1756818552800.py`*


---

## 6. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-13 | Initial release with Upload Audio endpoints, Download endpoints |

---

## API Documentation Best Practices

* Use nouns instead of verbs in URLs
* Return correct HTTP status codes
* Keep response formats consistent
* Always include example requests and responses
* Clearly document validation rules and edge cases
