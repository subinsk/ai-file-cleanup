# Environment Configuration for Rate Limiting

## Setup Instructions

Create the following `.env` files in the `services/api` directory:

### `.env.test` (For E2E Testing)

```bash
# Test Environment Configuration
NODE_ENV=test
RATE_LIMIT_PROFILE=test

# Other existing environment variables...
# (Copy from your existing .env and add the above)
```

### `.env.development` (For Development)

```bash
# Development Environment Configuration
NODE_ENV=development
RATE_LIMIT_PROFILE=development

# Other existing environment variables...
# (Copy from your existing .env and add the above)
```

### `.env` or `.env.production` (For Production)

```bash
# Production Environment Configuration
NODE_ENV=production
RATE_LIMIT_PROFILE=production

# Other existing environment variables...
# (Keep your existing production settings)
```

## Rate Limit Profiles

The system supports 4 rate limit profiles:

1. **production**: Strict limits (5-100 requests/min) - Default
2. **development**: Relaxed limits (1000 requests/min) - For local development
3. **test**: Relaxed limits (1000 requests/min) - For running E2E tests
4. **test_rate_limit**: Strict limits (3-5 requests/min) - For testing rate limiting functionality

## Usage

Set the `RATE_LIMIT_PROFILE` environment variable to switch between profiles:

```bash
# For regular testing
export RATE_LIMIT_PROFILE=test

# For rate limit-specific tests
export RATE_LIMIT_PROFILE=test_rate_limit

# For development
export RATE_LIMIT_PROFILE=development

# For production (default)
export RATE_LIMIT_PROFILE=production
```

## Header Override

Tests can also use the `X-Test-Rate-Limit` header:

- `X-Test-Rate-Limit: enabled` - Use strict test_rate_limit profile
- `X-Test-Rate-Limit: disabled` - Effectively disable rate limiting
- No header - Use the configured RATE_LIMIT_PROFILE
