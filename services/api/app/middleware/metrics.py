"""
Metrics collection middleware
"""
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import metrics_collector, logger


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect API metrics"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000
            
            # Record metrics
            endpoint = request.url.path
            status_code = response.status_code
            
            metrics_collector.record_request(endpoint, status_code, duration_ms)
            
            # Log request
            logger.info(
                "Request completed",
                extra={
                    'method': request.method,
                    'path': endpoint,
                    'status': status_code,
                    'duration_ms': round(duration_ms, 2),
                    'client_ip': request.client.host if request.client else None,
                }
            )
            
            return response
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            error_type = type(e).__name__
            
            metrics_collector.record_error(error_type)
            
            logger.error(
                "Request failed",
                extra={
                    'method': request.method,
                    'path': request.url.path,
                    'error_type': error_type,
                    'error_message': str(e),
                    'duration_ms': round(duration_ms, 2),
                },
                exc_info=True
            )
            
            raise

