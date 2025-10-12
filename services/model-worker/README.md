# @ai-cleanup/model-worker

AI model inference service using transformers.js for generating embeddings.

## Features

- **Text Embeddings**: Using `all-MiniLM-L6-v2` (384-dimensional, fast alternative to DistilBERT)
- **Image Embeddings**: Using CLIP `vit-base-patch32` (512-dimensional)
- **Batch Processing**: Efficient batch inference for multiple inputs
- **Model Caching**: Models are downloaded once and cached locally
- **REST API**: Simple HTTP endpoints for embedding generation

## Models

### Text Model: `Xenova/all-MiniLM-L6-v2`
- **Dimension**: 384
- **Use case**: Semantic text similarity
- **Performance**: ~100ms per batch of 8 texts (CPU)
- **Alternative**: Can be changed to `Xenova/distilbert-base-nli-stsb-mean-tokens` (768-dim)

### Image Model: `Xenova/clip-vit-base-patch32`
- **Dimension**: 512
- **Use case**: Image similarity and classification
- **Performance**: ~200ms per batch of 4 images (CPU)

## Setup

### Install Dependencies

```bash
pnpm install
```

### Configure Environment

Create `.env` file (or use defaults):

```env
# Server
PORT=3002
HOST=0.0.0.0
NODE_ENV=development

# Models
MODEL_CACHE_DIR=./cache/models
TEXT_MODEL_NAME=Xenova/all-MiniLM-L6-v2
IMAGE_MODEL_NAME=Xenova/clip-vit-base-patch32

# Performance
MAX_BATCH_SIZE=16
MAX_MEMORY_MB=2048

# Logging
LOG_LEVEL=info
```

### First Run (Download Models)

On first run, models will be downloaded (this takes 2-5 minutes):

```bash
pnpm dev
```

Models are cached in `MODEL_CACHE_DIR` for subsequent runs.

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "models": {
    "text": true,
    "image": true
  },
  "memory": {
    "heapUsed": 245,
    "heapTotal": 300,
    "external": 50
  },
  "uptime": 120
}
```

### Text Embeddings

```bash
POST /embed/text
Content-Type: application/json

{
  "texts": [
    "Hello world",
    "Machine learning is awesome"
  ]
}
```

Response:
```json
{
  "embeddings": [
    [0.123, -0.456, ...],  // 384-dimensional vector
    [0.789, -0.012, ...]
  ],
  "metadata": {
    "count": 2,
    "dimension": 384,
    "duration": 95
  }
}
```

### Image Embeddings

```bash
POST /embed/image
Content-Type: application/json

{
  "images": [
    "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
  ]
}
```

Response:
```json
{
  "embeddings": [
    [0.234, -0.567, ...],  // 512-dimensional vector
    [0.890, -0.123, ...]
  ],
  "metadata": {
    "count": 2,
    "dimension": 512,
    "duration": 180
  }
}
```

### Batch Embeddings (Mixed)

```bash
POST /embed/batch
Content-Type: application/json

{
  "items": [
    {
      "id": "file1",
      "type": "text",
      "content": "This is a text document"
    },
    {
      "id": "file2",
      "type": "image",
      "content": "data:image/png;base64,iVBORw..."
    }
  ]
}
```

Response:
```json
{
  "results": [
    {
      "id": "file1",
      "embedding": [0.123, -0.456, ...]
    },
    {
      "id": "file2",
      "embedding": [0.234, -0.567, ...]
    }
  ],
  "metadata": {
    "total": 2,
    "text": 1,
    "image": 1,
    "duration": 250
  }
}
```

## Usage from API Service

```typescript
import axios from 'axios';

const modelWorkerUrl = 'http://localhost:3002';

// Generate text embeddings
const textResponse = await axios.post(`${modelWorkerUrl}/embed/text`, {
  texts: ['document content', 'another document'],
});

const textEmbeddings = textResponse.data.embeddings;

// Generate image embeddings
const imageResponse = await axios.post(`${modelWorkerUrl}/embed/image`, {
  images: [base64Image1, base64Image2],
});

const imageEmbeddings = imageResponse.data.embeddings;
```

## Performance

### Text Embeddings
- **Single text**: ~50ms
- **Batch of 8**: ~100ms (12ms per text)
- **Batch of 16**: ~180ms (11ms per text)

### Image Embeddings
- **Single image**: ~100ms
- **Batch of 4**: ~200ms (50ms per image)
- **Batch of 8**: ~350ms (44ms per image)

*Performance measured on CPU (Intel i7). GPU would be 5-10x faster.*

## Memory Usage

- **Initial**: ~200MB
- **Text model loaded**: ~300MB
- **Both models loaded**: ~600MB
- **During inference**: ~700-800MB (depending on batch size)

## Optimization Tips

### Batch Size
- **Text**: Use batches of 8-16 for optimal throughput
- **Images**: Use batches of 4-8 (images are larger)
- Adjust `MAX_BATCH_SIZE` based on available memory

### Model Caching
- Models are cached in `MODEL_CACHE_DIR`
- Delete cache to force re-download: `rm -rf cache/models`
- Use persistent volume in production

### Model Selection
For faster inference with slightly lower quality:
```env
# Smaller text model (133MB vs 268MB)
TEXT_MODEL_NAME=Xenova/all-MiniLM-L6-v2

# Smaller image model (if needed)
IMAGE_MODEL_NAME=Xenova/clip-vit-base-patch16
```

## Development

```bash
# Watch mode with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Testing

### Test Text Endpoint

```bash
curl -X POST http://localhost:3002/embed/text \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello world", "AI is amazing"]
  }'
```

### Test Image Endpoint

```bash
# Convert image to base64
base64 -i test-image.png | tr -d '\n' > base64.txt

# Send request
curl -X POST http://localhost:3002/embed/image \
  -H "Content-Type: application/json" \
  -d "{
    \"images\": [\"data:image/png;base64,$(cat base64.txt)\"]
  }"
```

## Troubleshooting

### Models Not Loading
- Check internet connection for first download
- Verify `MODEL_CACHE_DIR` has write permissions
- Check disk space (models are ~500MB total)

### Out of Memory
- Reduce `MAX_BATCH_SIZE`
- Increase `MAX_MEMORY_MB` or Node.js memory limit
- Use smaller models

### Slow Performance
- Enable GPU support (requires CUDA/ROCm)
- Use smaller models
- Increase batch sizes for better throughput
- Consider quantized models for faster inference

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=3002
HOST=0.0.0.0
MODEL_CACHE_DIR=/app/cache/models
LOG_LEVEL=warn
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build
RUN mkdir -p /app/cache/models
CMD ["pnpm", "start"]
```

### Health Checks
Configure your orchestrator to use `/health`:
- Healthy: status 200, "status": "ok"
- Unhealthy: status 503 or connection refused

## Model Updates

To update models:
1. Change `TEXT_MODEL_NAME` or `IMAGE_MODEL_NAME` in `.env`
2. Delete cache: `rm -rf cache/models`
3. Restart server: `pnpm dev`

Models will be downloaded on next startup.

