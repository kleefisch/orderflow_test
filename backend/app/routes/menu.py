"""
Menu Routes
CRUD operations for menu items.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import MenuItem

bp = Blueprint('menu', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_menu_items():
    """
    Get all menu items.
    Can filter by category and availability.
    
    Query Parameters:
        ?category=appetizer  (optional)
        ?available=true      (optional)
    
    Response (200):
        [
            {
                "id": 1,
                "name": "Bruschetta",
                "category": "appetizer",
                "price": 8.99,
                "description": "...",
                "imageUrl": null,
                "available": true,
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00"
            },
            ...
        ]
    """
    # Start with base query
    query = MenuItem.query
    
    # Filter by category if provided
    category = request.args.get('category')
    if category:
        query = query.filter_by(category=category)
    
    # Filter by availability if provided
    available = request.args.get('available')
    if available is not None:
        is_available = available.lower() == 'true'
        query = query.filter_by(available=is_available)
    
    # Execute query
    menu_items = query.order_by(MenuItem.category, MenuItem.name).all()
    
    return jsonify([item.to_dict() for item in menu_items]), 200


@bp.route('/<int:item_id>', methods=['GET'])
@jwt_required()
def get_menu_item(item_id):
    """
    Get a single menu item by ID.
    
    Response (200):
        {
            "id": 1,
            "name": "Bruschetta",
            ...
        }
    
    Errors:
        404: Menu item not found
    """
    menu_item = MenuItem.query.get(item_id)
    
    if not menu_item:
        return jsonify({'error': 'Menu item not found'}), 404
    
    return jsonify(menu_item.to_dict()), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_menu_item():
    """
    Create a new menu item (manager only).
    
    Request Body:
        {
            "name": "French Fries",
            "category": "appetizer",
            "price": 5.99,
            "description": "Crispy golden fries",
            "available": true
        }
    
    Response (201):
        {
            "id": 16,
            "name": "French Fries",
            ...
        }
    
    Errors:
        400: Missing required fields
    """
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('name') or not data.get('category') or data.get('price') is None:
        return jsonify({'error': 'Name, category, and price are required'}), 400
    
    # Create new menu item
    menu_item = MenuItem(
        name=data['name'],
        category=data['category'],
        price=data['price'],
        description=data.get('description'),
        image_url=data.get('imageUrl'),
        available=data.get('available', True)
    )
    
    db.session.add(menu_item)
    db.session.commit()
    
    return jsonify(menu_item.to_dict()), 201


@bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_menu_item(item_id):
    """
    Update a menu item (manager only).
    
    Request Body:
        {
            "price": 6.99,
            "available": false
        }
    
    Response (200):
        {
            "id": 1,
            "name": "Bruschetta",
            "price": 6.99,
            "available": false,
            ...
        }
    
    Errors:
        404: Menu item not found
    """
    menu_item = MenuItem.query.get(item_id)
    
    if not menu_item:
        return jsonify({'error': 'Menu item not found'}), 404
    
    data = request.get_json()
    
    # Update fields if provided
    if 'name' in data:
        menu_item.name = data['name']
    if 'category' in data:
        menu_item.category = data['category']
    if 'price' in data:
        menu_item.price = data['price']
    if 'description' in data:
        menu_item.description = data['description']
    if 'imageUrl' in data:
        menu_item.image_url = data['imageUrl']
    if 'available' in data:
        menu_item.available = data['available']
    
    db.session.commit()
    
    return jsonify(menu_item.to_dict()), 200


@bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_menu_item(item_id):
    """
    Delete a menu item (manager only).
    
    Response (200):
        {
            "message": "Menu item deleted successfully"
        }
    
    Errors:
        404: Menu item not found
    """
    menu_item = MenuItem.query.get(item_id)
    
    if not menu_item:
        return jsonify({'error': 'Menu item not found'}), 404
    
    db.session.delete(menu_item)
    db.session.commit()
    
    return jsonify({'message': 'Menu item deleted successfully'}), 200
