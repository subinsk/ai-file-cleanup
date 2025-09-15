"""
Comprehensive logging configuration
"""

import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional
import json

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        if hasattr(record, 'session_id'):
            log_entry["session_id"] = record.session_id
        if hasattr(record, 'operation'):
            log_entry["operation"] = record.operation
        
        return json.dumps(log_entry)

class AuditLogger:
    """Audit logging for security and compliance"""
    
    def __init__(self):
        self.logger = logging.getLogger("audit")
        self.logger.setLevel(logging.INFO)
        
        # Create audit log file handler
        audit_file = Path("logs/audit.log")
        audit_file.parent.mkdir(exist_ok=True)
        
        file_handler = logging.FileHandler(audit_file)
        file_handler.setFormatter(JSONFormatter())
        self.logger.addHandler(file_handler)
        
        # Prevent propagation to root logger
        self.logger.propagate = False
    
    def log_operation(self, operation: str, user_id: Optional[str] = None, 
                     session_id: Optional[str] = None, details: Optional[dict] = None):
        """Log an operation for audit purposes"""
        extra = {
            "operation": operation,
            "user_id": user_id,
            "session_id": session_id,
        }
        
        if details:
            extra.update(details)
        
        self.logger.info(f"Operation: {operation}", extra=extra)
    
    def log_security_event(self, event_type: str, user_id: Optional[str] = None,
                          ip_address: Optional[str] = None, details: Optional[dict] = None):
        """Log security-related events"""
        extra = {
            "operation": f"security_{event_type}",
            "user_id": user_id,
            "ip_address": ip_address,
        }
        
        if details:
            extra.update(details)
        
        self.logger.warning(f"Security event: {event_type}", extra=extra)
    
    def log_file_operation(self, operation: str, file_path: str, 
                          user_id: Optional[str] = None, details: Optional[dict] = None):
        """Log file-related operations"""
        extra = {
            "operation": f"file_{operation}",
            "user_id": user_id,
            "file_path": file_path,
        }
        
        if details:
            extra.update(details)
        
        self.logger.info(f"File operation: {operation} on {file_path}", extra=extra)

def setup_logging(log_level: str = "INFO", log_file: Optional[str] = None):
    """Setup application logging"""
    
    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(file_handler)
    else:
        # Default log file
        file_handler = logging.FileHandler(log_dir / "app.log")
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(file_handler)
    
    # Error file handler
    error_handler = logging.FileHandler(log_dir / "error.log")
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(error_handler)
    
    # Configure specific loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

# Global audit logger instance
audit_logger = AuditLogger()

# Logging decorator for functions
def log_operation(operation_name: str):
    """Decorator to log function operations"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger = logging.getLogger(func.__module__)
            logger.info(f"Starting {operation_name}")
            
            try:
                result = func(*args, **kwargs)
                logger.info(f"Completed {operation_name}")
                return result
            except Exception as e:
                logger.error(f"Failed {operation_name}: {str(e)}")
                raise
        
        return wrapper
    return decorator
