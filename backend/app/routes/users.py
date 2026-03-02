"""
User Routes
CRUD operations for user management (manager only).
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models import User

bp = Blueprint('users', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    """
    Get all users (manager only).
    Can filter by role.
    
    Query Parameters:
        ?role=waiter  (optional)
    
    Response (200):
        [
            {
                "id": 1,
                "username": "john",
                "name": "John Doe",
                "role": "waiter",
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            },
            ...
        ]
    """
    # Start with base query
    query = User.query
    
    # Filter by role if provided
    role = request.args.get('role')
    if role:
        query = query.filter_by(role=role)
    
    # Execute query
    users = query.order_by(User.name).all()
    
    return jsonify([user.to_dict() for user in users]), 200


@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """
    Get a single user by ID.
    
    Response (200):
        {
            "id": 1,
            "username": "john",
            "name": "John Doe",
            "role": "waiter",
            ...
        }
    
    Errors:
        404: User not found
    """
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_user():
    """
    Create a new user (manager only).
    
    Request Body:
        {
            "username": "mike",
            "password": "waiter123",
            "name": "Mike Johnson",
            "role": "waiter"
        }
    
    Response (201):
        {
            "id": 5,
            "username": "mike",
            "name": "Mike Johnson",
            "role": "waiter",
            ...
        }
    
    Errors:
        400: Missing required fields or username already exists
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'password', 'name', 'role']
    if not data or not all(data.get(field) for field in required_fields):
        return jsonify({'error': 'Username, password, name, and role are required'}), 400
    
    # Check if username already exists
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify({'error': f'Username "{data["username"]}" already exists'}), 400
    
    # Validate role
    valid_roles = ['waiter', 'kitchen', 'manager']
    if data['role'] not in valid_roles:
        return jsonify({'error': f'Role must be one of: {", ".join(valid_roles)}'}), 400
    
    # Hash password
    password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Create new user
    user = User(
        username=data['username'],
        password_hash=password_hash,
        name=data['name'],
        role=data['role']
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify(user.to_dict()), 201


@bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """
    Update a user's information (manager only).
    
    Request Body:
        {
            "name": "John Smith",
            "role": "manager",
            "password": "newpassword123"  (optional)
        }
    
    Response (200):
        {
            "id": 1,
            "username": "john",
            "name": "John Smith",
            "role": "manager",
            ...
        }
    
    Errors:
        404: User not found
        400: Invalid data
    """
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update fields if provided
    if 'name' in data:
        user.name = data['name']
    
    if 'role' in data:
        valid_roles = ['waiter', 'kitchen', 'manager']
        if data['role'] not in valid_roles:
            return jsonify({'error': f'Role must be one of: {", ".join(valid_roles)}'}), 400
        user.role = data['role']
    
    if 'username' in data:
        # Check if new username already exists (excluding current user)
        existing = User.query.filter(User.username == data['username'], User.id != user_id).first()
        if existing:
            return jsonify({'error': f'Username "{data["username"]}" already exists'}), 400
        user.username = data['username']
    
    # Update password if provided
    if 'password' in data:
        password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        user.password_hash = password_hash
    
    db.session.commit()
    
    return jsonify(user.to_dict()), 200


@bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """
    Delete a user (manager only).
    Cannot delete yourself or users with active orders.
    
    Response (200):
        {
            "message": "User deleted successfully"
        }
    
    Errors:
        404: User not found
        400: Cannot delete user
    """
    # Get current user
    current_user_id = int(get_jwt_identity())  # Convert string back to int
    
    # Prevent self-deletion
    if user_id == current_user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if user has active orders
    active_orders = [order for order in user.orders if order.status != 'delivered']
    if active_orders:
        return jsonify({'error': 'Cannot delete user with active orders'}), 400
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200
