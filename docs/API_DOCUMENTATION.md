# Code API


> **API Documentation** | Generated on 2026-03-10 15:58:05

---

# Code API Documentation

---

## 1. Overview

* **API Name:** Code API
* **Purpose / Business Value:** Code API provides endpoints to upload audio for processing (transcription/LLM-driven processing) and to download generated documents. It accepts audio file uploads, processes them using selectable engines (e.g., whisper_local for speech-to-text and ollama as an LLM engine), and exposes generated DOCX files for download.
* **Base URL:** `None`
* **API Version:** v1
* **Supported Formats:** multipart/form-data (for file upload), application/json (API responses), application/vnd.openxmlformats-officedocument.wordprocessingml.document (DOCX download)
* **Detected Frameworks:** Flask
* **Total Endpoints:** 3
* **Last Updated:** 2026-03-10 15:58:05

### Key Features

* Upload audio files for speech-to-text and LLM processing
* Select processing engines via form fields (e.g., engine, llm_engine)
* Download generated DOCX documents
* Simple error responses in JSON when resources are missing or operations fail

### Endpoint Distribution

| Method | Count | Description |
|--------|-------|-------------|
| `GET` | 2 | Data retrieval, data transfer |
| `POST` | 1 | Data transfer |

---

## 2. Authentication & Authorization

* **Authentication Type:** Token
* **How to Obtain Credentials:** No authentication scheme detected in the provided code patterns. Endpoints appear to be publicly accessible.
* **How to Pass Credentials:** Header

### Authentication Endpoints

* `GET /` - Authentication
* `POST /upload-audio` - Authentication
* `GET /download/{filename}` - Authentication

**Example Header:**

```
Authorization: Token <token>
```

---

## 3. Common Headers

The following headers are commonly used across all endpoints:

| Header | Required | Description |
|:-------|:--------:|:------------|
| Content-Type | Yes | For POST /upload-audio use multipart/form-data; for file download the response uses the DOCX media type |
| Accept | Optional | Preferred response format (e.g., application/json) |
| Authorization | Optional | Not required — no auth detected. Present only if deployment adds auth later. |

---

## 4. Error Handling

| Status Code | Meaning |
|:-----------:|:--------|
| 200 | Success |
| 400 | Bad Request (e.g., missing form fields or invalid input) |
| 404 | Not Found (e.g., requested file does not exist) |
| 500 | Internal Server Error (unhandled exceptions during processing) |

**Error Response Format:**

```json
{
  "status": 400,
  "message": "Human-readable error message (e.g., \"File not found\")",
  "data": null
}
```

### Common Error Types

| Error Code | Description |
|:----------:|:------------|
| `FILE_NOT_FOUND` | Returned when a requested download filename does not exist. Implementation returns JSON {"error": "File not found"} with HTTP 404. |
| `VALIDATION_ERROR` | Input validation failed (missing file, unsupported form fields, etc.) |
| `PROCESSING_ERROR` | Server-side error during audio processing or file generation. |

---

## 5. Resource Endpoints

### Downloads

#### GET – Fetch Resource

*Retrieve operations using the GET method*

#### Download File

**Method:** GET
**Endpoint:** `/download/{filename}`

🔄 **Idempotent:** This operation is idempotent - multiple identical requests have the same effect as a single request.

**Description:** This GET endpoint returns a generated DOCX file specified by the path parameter 'filename' and is used to download a previously created Word document.

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

**Description:** Primary purpose: This endpoint accepts an uploaded audio file, runs speech-to-text (using selectable engines), applies post-processing/correction, and returns the corrected transcript plus a generated .

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

**Description:** Primary Purpose: This GET root endpoint returns a simple JSON status message confirming the Speech-to-Text + Grammar Correction API is running, primarily used as a health/readiness or connectivity check.

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
| 1.0.0 | 2026-03-10 | Initial release with Upload Audio endpoints, Download endpoints |

---

## API Documentation Best Practices

* Use nouns instead of verbs in URLs
* Return correct HTTP status codes
* Keep response formats consistent
* Always include example requests and responses
* Clearly document validation rules and edge cases
