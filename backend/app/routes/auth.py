"""
Authentication Routes
Handles user login and JWT token generation.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app import db, bcrypt
from app.models import User

bp = Blueprint('auth', __name__)


@bp.route('/login', methods=['POST'])
def login():
    """
    User login endpoint.
    
    Request Body:
        {
            "username": "john",
            "password": "waiter123"
        }
    
    Response (200):
        {
            "token": "JWT_TOKEN_STRING",
            "user": {
                "id": 1,
                "username": "john",
                "name": "John Doe",
                "role": "waiter",
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            }
        }
    
    Errors:
        400: Missing username or password
        401: Invalid credentials
    """
    # Get request data
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400
    
    username = data['username']
    password = data['password']
    
    # Find user by username
    user = User.query.filter_by(username=username).first()
    
    # Check if user exists and password is correct
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Create JWT access token (identity must be a string)
    access_token = create_access_token(identity=str(user.id))
    
    # Return token and user data (without password)
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    }), 200


@bp.route('/verify', methods=['GET'])
def verify():
    """
    Token verification endpoint (optional).
    Can be used by frontend to check if stored token is still valid.
    """
    from flask_jwt_extended import jwt_required, get_jwt_identity
    
    @jwt_required()
    def _verify():
        user_id = int(get_jwt_identity())  # Convert string back to int
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
    
    return _verify()
