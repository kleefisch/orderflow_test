"""
OrderFlow Backend Configuration

This module defines configuration settings for different environments
(development, production, testing).
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration with shared settings."""
    
    # Flask secret key for session encryption
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-please-change')
    
    # Database configuration (SQLite for development)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///orderflow.db'
    )
    
    # Disable SQLAlchemy event system to save memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-please-change')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))
    )
    
    # CORS configuration for frontend access
    cors_origins_str = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://10.0.0.88:3000')
    CORS_ORIGINS = [origin.strip() for origin in cors_origins_str.split(',')]
    
    # JSON response configuration
    JSON_SORT_KEYS = False
    JSONIFY_PRETTYPRINT_REGULAR = True


class DevelopmentConfig(Config):
    """Development configuration for local testing."""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration for deployment."""
    DEBUG = False
    TESTING = False
    
    def __init__(self):
        super().__init__()
        # Validate required secrets are set
        if self.SECRET_KEY == 'dev-secret-key-please-change':
            raise ValueError("SECRET_KEY must be set in production!")
        if self.JWT_SECRET_KEY == 'jwt-secret-please-change':
            raise ValueError("JWT_SECRET_KEY must be set in production!")


class TestingConfig(Config):
    """Testing configuration for automated tests."""
    TESTING = True
    DEBUG = True
    # Use in-memory database for faster tests
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# Configuration dictionary for easy access
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
