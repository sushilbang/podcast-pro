# Podcast Pro Backend - Deployment Guide

This guide covers production deployment, scaling, and infrastructure optimization for Podcast Pro.

## Table of Contents

1. [Database Configuration](#database-configuration)
2. [Celery Workers](#celery-workers)
3. [Rate Limiting](#rate-limiting)
4. [Environment Variables](#environment-variables)
5. [Scaling Strategy](#scaling-strategy)
6. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
7. [Deployment Checklist](#deployment-checklist)

---

## Database Configuration

### Connection Pooling

The application uses SQLAlchemy connection pooling configured for production with the following settings:

```
pool_size=20            # Base connections in pool
max_overflow=10         # Additional connections for spikes
pool_pre_ping=True      # Verify connections are alive
pool_recycle=1800       # Recycle connections every 30 minutes
pool_reset_on_return='rollback'  # Reset state after return
```

#### Pool Size Calculation

Formula: `(num_workers × max_concurrent_tasks) + fastapi_buffer + safety_margin`

Example for 4 Celery workers with 8 concurrent tasks each:
- Celery connections: 4 × 8 = 32
- FastAPI buffer: 4
- Safety margin: 4
- **Total: 40 max, 20 base**

### Connection Limits

```
connect_timeout=10      # 10 seconds to establish connection
keepalives=1            # Enable TCP keepalives
keepalives_idle=30      # Keepalive idle time in seconds
keepalives_interval=10  # Keepalive interval in seconds
```

### Recommendations

- **Small deployments** (1-2 workers): `pool_size=10, max_overflow=5`
- **Medium deployments** (4-6 workers): `pool_size=20, max_overflow=10`
- **Large deployments** (8+ workers): `pool_size=30, max_overflow=15`

If you experience connection pool exhaustion errors:
1. Increase `pool_size`
2. Increase `max_overflow`
3. Check for connection leaks in code
4. Monitor actual connection usage

---

## Celery Workers

### Configuration Overview

Celery is configured with:

- **Retry Strategy**: Automatic retry with exponential backoff (max 3 retries)
- **Time Limits**: 30-minute soft limit, 35-minute hard limit
- **Worker Prefetch**: 1 task per worker (prevents task monopolization)
- **Memory Management**: Worker restart after 1000 tasks
- **Queue Routing**: Separate queues for different task types

### Running Celery Worker

#### Single Worker (Development)

```bash
celery -A backend worker --loglevel=info --concurrency=2
```

#### Multiple Workers (Production on Fly.io)

Deploy separate machines running:

```bash
celery -A backend worker -Q podcasts --loglevel=info --concurrency=4
```

#### Docker Deployment

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ ./backend/
CMD ["celery", "-A", "backend", "worker", "-Q", "podcasts", "--loglevel=info", "--concurrency=4"]
```

### Worker Concurrency

- **I/O Bound Tasks** (like podcast generation with API calls): Use `concurrency=4-8`
- **CPU Bound Tasks**: Use `concurrency=CPU_COUNT`
- **Mixed Workloads**: Start with `concurrency=4` and monitor CPU/memory

### Task Configuration

```python
@celery_app.task(
    bind=True,
    max_retries=3,
    retry_backoff=True,      # Exponential backoff
    retry_backoff_max=600,   # Max 10 minutes between retries
    retry_jitter=True,       # Prevent thundering herd
    soft_time_limit=1800,    # 30 minutes soft limit
    time_limit=2100,         # 35 minutes hard limit
)
def create_podcast_task(self, podcast_id: int):
    # Task logic here
```

### Monitoring Celery

```bash
# Display active tasks
celery -A backend inspect active

# Display scheduled tasks
celery -A backend inspect scheduled

# Display worker stats
celery -A backend inspect stats

# Monitor in real-time
celery -A backend events
```

---

## Rate Limiting

### Configuration by Endpoint Type

#### Authentication Endpoints
- OAuth Login: `10/hour`
- Email/Password Login: `5/hour`
- Signup: `3/hour`
- Forgot Password: `3/hour`
- Reset Password: `5/hour`
- Verify Email: `5/hour`

#### File Operations
- Presigned URL Generation: `20/hour`

#### Podcast Operations
- Create Podcast: `10/hour`
- Get Single Podcast: `100/hour`
- List Podcasts: `50/hour`

#### Monitoring
- Global Credits Check: `100/hour`
- Health Check: `1000/hour`

### Rate Limit Response

When a user exceeds rate limits, they receive:

```json
{
  "detail": "Rate limit exceeded. Please try again later.",
  "retry_after": "3600"
}
```

HTTP Status: `429 Too Many Requests`

---

## Environment Variables

### Required for Production

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5433/db?sslmode=require

# Supabase Authentication
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_key
SUPABASE_URL=https://your-project.supabase.co

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1

# AI Services
GOOGLE_API_KEY=your_google_ai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0

# Logging
SQL_ECHO=false  # Set to true for SQL query logging
```

### Optional Configuration

```bash
# CORS Origins
CORS_ORIGINS=["https://yourdomain.com"]

# Rate Limiting
RATE_LIMIT_ENABLED=true

# API Features
API_GENERATION_ENABLED=true
```

---

## Scaling Strategy

### Phase 1: Single Worker (Current)

- 1 FastAPI instance
- 1 Celery worker
- 1 Redis instance
- Shared PostgreSQL database

### Phase 2: Multi-Worker (Recommended)

- 2-3 FastAPI instances (behind load balancer)
- 2-4 Celery workers (dedicated machines)
- 1 Redis instance
- Shared PostgreSQL with connection pooling

### Phase 3: High Availability (Enterprise)

- 3+ FastAPI instances (load balanced, auto-scaling)
- 8+ Celery workers (distributed across regions)
- Redis Sentinel for high availability
- PostgreSQL with read replicas
- PgBouncer for advanced connection pooling

### Load Testing Recommendations

```bash
# Test FastAPI endpoints
ab -n 1000 -c 10 http://localhost:8000/health

# Load test rate limiting
ab -n 100 -c 5 http://localhost:8000/podcasts/

# Test Celery throughput
celery -A backend worker --loglevel=info --concurrency=4
# Monitor with: celery -A backend inspect active
```

---

## Monitoring & Troubleshooting

### Connection Pool Issues

**Symptom**: `sqlalchemy.exc.OperationalError: QueuePool limit exceeded`

**Solutions**:
1. Increase `pool_size` and `max_overflow`
2. Check for connection leaks in code
3. Monitor active connections: `SELECT count(*) FROM pg_stat_activity`

### Celery Task Issues

**Symptom**: Tasks not executing

**Check**:
```bash
# Check if worker is running
celery -A backend inspect active

# Check Redis connectivity
redis-cli ping  # Should return PONG

# Check task queue
celery -A backend inspect reserved
```

**Solutions**:
1. Verify `REDIS_URL` is correct
2. Ensure Celery worker is running
3. Check worker logs for errors
4. Verify task is properly decorated with `@celery_app.task`

### Rate Limiting Issues

**Symptom**: Users getting 429 errors unexpectedly

**Check**:
1. Verify `RATE_LIMIT_ENABLED=true`
2. Check `RATE_LIMITS` configuration
3. Verify client's IP address isn't being masked (proxy issues)

### Memory Leaks

**Symptom**: Celery worker memory usage constantly increasing

**Solutions**:
```python
# Already configured, but verify in __init__.py:
worker_max_tasks_per_child=1000  # Restart after 1000 tasks
```

### Database Connection Timeout

**Symptom**: `OperationalError: server closed the connection unexpectedly`

**Solutions**:
1. Verify keepalive settings are enabled
2. Check firewall/network rules
3. Increase `pool_recycle` from 1800 to 3600
4. Monitor database logs for connection issues

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Redis running and accessible
- [ ] AWS S3 bucket created and credentials verified
- [ ] Supabase JWT secret configured
- [ ] SSL/TLS certificates valid
- [ ] Database backups configured

### Deployment Steps

1. **Backend API**
   ```bash
   # Pull latest code
   git pull origin main

   # Install dependencies
   pip install -r requirements.txt

   # Run migrations (if needed)
   # python -m alembic upgrade head

   # Start FastAPI
   uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

2. **Celery Worker(s)**
   ```bash
   # Terminal 1 - Worker for podcast generation
   celery -A backend worker -Q podcasts --loglevel=info --concurrency=4

   # Terminal 2 (optional) - Additional worker for default queue
   celery -A backend worker -Q default --loglevel=info --concurrency=2
   ```

3. **Flower Monitoring (Optional)**
   ```bash
   celery -A backend flower --port=5555
   # Access at http://localhost:5555
   ```

### Post-Deployment

- [ ] Health check endpoint returning 200
- [ ] Celery worker active and receiving tasks
- [ ] Database connectivity verified
- [ ] Rate limiting working correctly
- [ ] Logs being collected properly
- [ ] Monitoring/alerting configured
- [ ] Rollback plan documented

### Rollback Procedure

```bash
# If deployment fails:
git checkout previous_version
pip install -r requirements.txt
# Restart all services
systemctl restart podcast-pro-api
systemctl restart podcast-pro-worker
```

---

## Performance Tuning

### Database

```sql
-- Index common queries
CREATE INDEX idx_podcasts_owner_id ON podcasts(owner_id);
CREATE INDEX idx_podcasts_status ON podcasts(status);
CREATE INDEX idx_users_email ON users(email);

-- Monitor slow queries
SET log_min_duration_statement = 1000;  -- Log queries > 1 second
```

### FastAPI

```python
# Use async endpoints for I/O-bound operations
@app.get("/podcasts/")
async def list_user_podcasts(...):
    # This will non-block during database queries
    pass
```

### Celery

```bash
# Run multiple workers with different queues
celery -A backend worker -Q podcasts --concurrency=6
celery -A backend worker -Q default --concurrency=2
```

---

## Support & References

- Celery Documentation: https://docs.celeryproject.org/
- SQLAlchemy Connection Pooling: https://docs.sqlalchemy.org/en/20/core/pooling.html
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/
- Rate Limiting Best Practices: https://github.com/slowapi/slowapi

---

**Last Updated**: 2025-10-27
**Version**: 1.0.0
