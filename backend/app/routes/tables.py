"""
Table Routes
CRUD operations for restaurant tables.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import Table

bp = Blueprint('tables', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_tables():
    """
    Get all tables.
    
    Response (200):
        [
            {
                "id": 1,
                "number": 1,
                "capacity": 2,
                "status": "available",
                "createdAt": "2024-01-01T00:00:00",
                "updatedAt": "2024-01-01T00:00:00",
                "activeOrdersCount": 0
            },
            ...
        ]
    """
    tables = Table.query.order_by(Table.number).all()
    return jsonify([table.to_dict() for table in tables]), 200


@bp.route('/<int:table_id>', methods=['GET'])
@jwt_required()
def get_table(table_id):
    """
    Get a single table by ID.
    
    Response (200):
        {
            "id": 1,
            "number": 1,
            "capacity": 2,
            "status": "available",
            ...
        }
    
    Errors:
        404: Table not found
    """
    table = Table.query.get(table_id)
    
    if not table:
        return jsonify({'error': 'Table not found'}), 404
    
    return jsonify(table.to_dict()), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_table():
    """
    Create a new table (manager only).
    
    Request Body:
        {
            "number": 11,
            "capacity": 4,
            "status": "available"
        }
    
    Response (201):
        {
            "id": 11,
            "number": 11,
            "capacity": 4,
            "status": "available",
            ...
        }
    
    Errors:
        400: Missing required fields or table number already exists
    """
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('number') or not data.get('capacity'):
        return jsonify({'error': 'Table number and capacity are required'}), 400
    
    # Check if table number already exists
    existing_table = Table.query.filter_by(number=data['number']).first()
    if existing_table:
        return jsonify({'error': f'Table {data["number"]} already exists'}), 400
    
    # Create new table
    table = Table(
        number=data['number'],
        capacity=data['capacity'],
        status=data.get('status', 'available')
    )
    
    db.session.add(table)
    db.session.commit()
    
    return jsonify(table.to_dict()), 201


@bp.route('/<int:table_id>', methods=['PUT'])
@jwt_required()
def update_table(table_id):
    """
    Update a table's information.
    
    Request Body:
        {
            "capacity": 6,
            "status": "occupied"
        }
    
    Response (200):
        {
            "id": 1,
            "number": 1,
            "capacity": 6,
            "status": "occupied",
            ...
        }
    
    Errors:
        404: Table not found
    """
    table = Table.query.get(table_id)
    
    if not table:
        return jsonify({'error': 'Table not found'}), 404
    
    data = request.get_json()
    
    # Update fields if provided
    if 'capacity' in data:
        table.capacity = data['capacity']
    if 'status' in data:
        table.status = data['status']
    if 'number' in data:
        # Check if new number already exists (excluding current table)
        existing = Table.query.filter(Table.number == data['number'], Table.id != table_id).first()
        if existing:
            return jsonify({'error': f'Table {data["number"]} already exists'}), 400
        table.number = data['number']
    
    db.session.commit()
    
    return jsonify(table.to_dict()), 200


@bp.route('/<int:table_id>/start-service', methods=['POST'])
@jwt_required()
def start_service(table_id):
    """
    Start service for a table (create a new bill).
    
    Response (200):
        {
            "id": 1,
            "number": 1,
            "status": "occupied",
            "billId": 15,
            ...
        }
    
    Errors:
        404: Table not found
        400: Table already has active service
    """
    table = Table.query.get(table_id)
    
    if not table:
        return jsonify({'error': 'Table not found'}), 404
    
    # Check if table already has an open bill
    if table.get_active_bill():
        return jsonify({'error': 'Table already has active service'}), 400
    
    # Get authenticated user (waiter)
    from flask_jwt_extended import get_jwt_identity
    user_id = int(get_jwt_identity())
    
    # Create new bill
    from app.models import Bill
    bill = Bill(
        table_id=table_id,
        waiter_id=user_id,
        status='open'
    )
    db.session.add(bill)
    
    # Update table status
    table.status = 'occupied'
    
    db.session.commit()
    
    return jsonify(table.to_dict()), 200


@bp.route('/<int:table_id>', methods=['DELETE'])
@jwt_required()
def delete_table(table_id):
    """
    Delete a table (manager only).
    
    Response (200):
        {
            "message": "Table deleted successfully"
        }
    
    Errors:
        404: Table not found
        400: Cannot delete table with active orders
    """
    table = Table.query.get(table_id)
    
    if not table:
        return jsonify({'error': 'Table not found'}), 404
    
    # Check if table has active orders
    active_orders = [order for order in table.orders if order.status != 'delivered']
    if active_orders:
        return jsonify({'error': 'Cannot delete table with active orders'}), 400
    
    db.session.delete(table)
    db.session.commit()
    
    return jsonify({'message': 'Table deleted successfully'}), 200
