# ZIP Generation Endpoint

## Overview

The ZIP generation endpoint allows users to download selected files as a compressed ZIP archive. This endpoint is part of the AI File Cleanup API and supports both web and desktop applications.

## Endpoint Details

- **URL**: `POST /dedupe/zip`
- **Authentication**: Required (Bearer token)
- **Content-Type**: `application/json`
- **Response**: ZIP file stream

## Request Format

```json
{
  "uploadId": "string",
  "fileIds": ["string", "string", ...]
}
```

### Parameters

- `uploadId` (string, required): Unique identifier for the upload session
- `fileIds` (array, required): List of file IDs to include in the ZIP

## Response Format

- **Content-Type**: `application/zip`
- **Content-Disposition**: `attachment; filename=cleaned-files-{uploadId}.zip`
- **Content-Length**: File size in bytes
- **Cache-Control**: `no-cache`

## Implementation Details

### Architecture

The ZIP generation is handled by a dedicated service (`ZipService`) that:

1. **Creates temporary ZIP files** in a secure temporary directory
2. **Processes file metadata** to generate appropriate content
3. **Streams the response** for efficient memory usage
4. **Cleans up temporary files** after serving

### File Structure

```
services/api/
├── app/
│   ├── api/
│   │   └── dedupe.py          # Main endpoint
│   └── services/
│       └── zip_service.py     # ZIP generation logic
├── requirements.txt           # Dependencies
└── test_zip_endpoint.py       # Test script
```

### Key Features

- **Async Processing**: Non-blocking ZIP creation
- **Memory Efficient**: Streaming response for large files
- **Error Handling**: Comprehensive error management
- **Cleanup**: Automatic temporary file cleanup
- **Security**: Authentication required for all operations

## Usage Examples

### JavaScript/TypeScript (Web Client)

```typescript
const response = await fetch('/api/dedupe/zip', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    uploadId: 'upload-123',
    fileIds: ['file1', 'file2', 'file3'],
  }),
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cleaned-files.zip';
  a.click();
  window.URL.revokeObjectURL(url);
}
```

### Python (Desktop Client)

```python
import requests

response = requests.post(
    'http://localhost:3001/dedupe/zip',
    json={
        'uploadId': 'upload-123',
        'fileIds': ['file1', 'file2', 'file3']
    },
    headers={'Authorization': f'Bearer {token}'}
)

if response.status_code == 200:
    with open('cleaned-files.zip', 'wb') as f:
        f.write(response.content)
```

## Testing

### Manual Testing

1. **Start the API server**:

   ```bash
   cd services/api
   python start_test.py
   ```

2. **Run the test script**:
   ```bash
   python test_zip_endpoint.py
   ```

### Test Coverage

The test script verifies:

- ✅ Endpoint accessibility
- ✅ Request/response format
- ✅ ZIP file creation
- ✅ File content validation
- ✅ Error handling

## Error Handling

### Common Errors

| Status Code | Error                 | Description                       |
| ----------- | --------------------- | --------------------------------- |
| 400         | Bad Request           | Invalid request format            |
| 401         | Unauthorized          | Missing or invalid authentication |
| 500         | Internal Server Error | ZIP creation failed               |

### Error Response Format

```json
{
  "detail": "Error message description"
}
```

## Security Considerations

- **Authentication Required**: All requests must include valid authentication
- **File Validation**: Input validation for file IDs and upload IDs
- **Temporary Files**: Secure temporary file handling with automatic cleanup
- **Rate Limiting**: Built-in rate limiting to prevent abuse

## Performance Considerations

- **Streaming Response**: Large ZIP files are streamed to prevent memory issues
- **Background Cleanup**: Temporary files are cleaned up asynchronously
- **Compression**: ZIP files use DEFLATE compression for optimal size
- **Chunked Transfer**: Files are transferred in 8KB chunks for efficiency

## Dependencies

- `aiofiles`: Async file operations
- `zipfile`: Python standard library for ZIP creation
- `tempfile`: Secure temporary file handling
- `fastapi`: Web framework
- `pydantic`: Data validation

## Future Enhancements

- **Progress Tracking**: Real-time progress updates for large ZIP files
- **File Deduplication**: Actual file deduplication logic
- **Metadata Preservation**: Preserve original file metadata
- **Compression Options**: Configurable compression levels
- **Batch Processing**: Support for multiple ZIP requests

## Troubleshooting

### Common Issues

1. **"Failed to create ZIP file"**
   - Check disk space
   - Verify file permissions
   - Check server logs for detailed errors

2. **"Authentication required"**
   - Ensure valid Bearer token is provided
   - Check token expiration

3. **"Invalid request format"**
   - Verify JSON structure
   - Check required fields are present

### Debug Mode

Enable debug logging by setting:

```python
LOG_LEVEL = "DEBUG"
```

This will provide detailed information about ZIP creation process and any errors encountered.
