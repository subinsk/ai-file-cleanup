"""
Pino-style structured logging setup
"""
import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict
from pathlib import Path


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging (Pino-style)"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            'level': record.levelname.lower(),
            'time': datetime.utcnow().isoformat() + 'Z',
            'msg': record.getMessage(),
            'pid': record.process,
            'hostname': record.hostname if hasattr(record, 'hostname') else 'unknown',
        }
        
        # Add logger name
        if record.name != 'root':
            log_data['name'] = record.name
        
        # Add exception info if present
        if record.exc_info:
            log_data['err'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'stack': self.formatException(record.exc_info) if record.exc_info else None,
            }
        
        # Add extra fields from record
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'created', 'filename', 'funcName', 
                          'levelname', 'levelno', 'lineno', 'module', 'msecs', 'message',
                          'pathname', 'process', 'processName', 'relativeCreated', 'thread',
                          'threadName', 'exc_info', 'exc_text', 'stack_info', 'hostname']:
                if not key.startswith('_'):
                    log_data[key] = value
        
        return json.dumps(log_data)


def setup_logging(
    level: str = 'INFO',
    json_format: bool = False,
    log_file: str = None
) -> logging.Logger:
    """
    Setup structured logging
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: Use JSON format (Pino-style) if True
        log_file: Optional log file path
        
    Returns:
        Configured logger
    """
    # Get root logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Create formatter
    if json_format:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler if specified
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


# Create structured logger instance
logger = setup_logging(
    level='INFO',
    json_format=True,  # Use JSON format for structured logging
    log_file='logs/api.log' if Path('logs').exists() else None
)


class MetricsCollector:
    """Simple metrics collector for API metrics"""
    
    def __init__(self):
        self.metrics: Dict[str, Any] = {
            'requests_total': 0,
            'requests_by_endpoint': {},
            'requests_by_status': {},
            'response_times': [],
            'errors_total': 0,
            'errors_by_type': {},
        }
    
    def record_request(self, endpoint: str, status_code: int, duration_ms: float):
        """Record a request metric"""
        self.metrics['requests_total'] += 1
        
        # Count by endpoint
        if endpoint not in self.metrics['requests_by_endpoint']:
            self.metrics['requests_by_endpoint'][endpoint] = 0
        self.metrics['requests_by_endpoint'][endpoint] += 1
        
        # Count by status
        status = f"{status_code // 100}xx"
        if status not in self.metrics['requests_by_status']:
            self.metrics['requests_by_status'][status] = 0
        self.metrics['requests_by_status'][status] += 1
        
        # Record response time
        self.metrics['response_times'].append(duration_ms)
        # Keep only last 1000 response times
        if len(self.metrics['response_times']) > 1000:
            self.metrics['response_times'] = self.metrics['response_times'][-1000:]
    
    def record_error(self, error_type: str):
        """Record an error metric"""
        self.metrics['errors_total'] += 1
        
        if error_type not in self.metrics['errors_by_type']:
            self.metrics['errors_by_type'][error_type] = 0
        self.metrics['errors_by_type'][error_type] += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        response_times = self.metrics['response_times']
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        return {
            **self.metrics,
            'avg_response_time_ms': avg_response_time,
            'p95_response_time_ms': sorted(response_times)[int(len(response_times) * 0.95)] if response_times else 0,
            'p99_response_time_ms': sorted(response_times)[int(len(response_times) * 0.99)] if response_times else 0,
        }
    
    def reset(self):
        """Reset metrics"""
        self.metrics = {
            'requests_total': 0,
            'requests_by_endpoint': {},
            'requests_by_status': {},
            'response_times': [],
            'errors_total': 0,
            'errors_by_type': {},
        }


# Global metrics collector
metrics_collector = MetricsCollector()

