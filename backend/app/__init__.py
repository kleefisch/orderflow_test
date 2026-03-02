"""
Flask Application Factory
Creates and configures the Flask application with all necessary extensions.
"""

from flask import Flask, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from .config import Config, DevelopmentConfig, ProductionConfig, TestingConfig
import os

# Initialize Flask extensions
# These will be connected to the app in create_app()
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
migrate = Migrate()


def create_app(config_name='development'):
    """
    Application factory pattern for creating Flask app instances.
    
    Args:
        config_name (str): Configuration environment ('development', 'production', 'testing')
        
    Returns:
        Flask: Configured Flask application instance
    """
    # Create Flask app
    app = Flask(__name__)
    
    # Load configuration
    config_map = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestingConfig
    }
    
    config_class = config_map.get(config_name, DevelopmentConfig)
    app.config.from_object(config_class)
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    
    # Configure CORS - allow credentials and specific origins
    CORS(app, 
         resources={r"/api/*": {
             "origins": app.config['CORS_ORIGINS'],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
         }})
    
    # Add CORS headers manually to ensure they're present
    @app.after_request
    def after_request(response):
        allowed_origins = app.config['CORS_ORIGINS']
        origin = request.headers.get('Origin')
        
        if origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
            response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response
    
    # Import and register blueprints
    # (We'll create these routes later)
    from .routes import auth, tables, menu, bills, orders, users
    
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(tables.bp, url_prefix='/api/tables')
    app.register_blueprint(menu.bp, url_prefix='/api/menu')
    app.register_blueprint(bills.bp, url_prefix='/api/bills')
    app.register_blueprint(orders.bp, url_prefix='/api/orders')
    app.register_blueprint(users.bp, url_prefix='/api/users')
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        """Simple health check endpoint"""
        return {'status': 'ok', 'message': 'OrderFlow Backend is running'}
    
    return app
