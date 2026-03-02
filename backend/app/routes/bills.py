"""
Bill Routes
CRUD operations for bills (service sessions) and payment processing.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Bill, Order, Table
from datetime import datetime
import json

bp = Blueprint('bills', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_bills():
    """
    Get all bills.
    Can filter by status, table, waiter.
    
    Query Parameters:
        ?status=open        (optional)
        ?tableId=1          (optional)
        ?waiterId=2         (optional)
    
    Response (200):
        [
            {
                "id": 1,
                "tableId": 3,
                "waiterId": 1,
                "status": "open",
                "subtotal": 45.97,
                "tipAmount": 5.00,
                "totalAmount": 50.97,
                ...
            },
            ...
        ]
    """
    query = Bill.query
    
    # Filter by status
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    
    # Filter by table
    table_id = request.args.get('tableId')
    if table_id:
        query = query.filter_by(table_id=table_id)
    
    # Filter by waiter
    waiter_id = request.args.get('waiterId')
    if waiter_id:
        query = query.filter_by(waiter_id=waiter_id)
    
    bills = query.order_by(Bill.opened_at.desc()).all()
    
    return jsonify([bill.to_dict() for bill in bills]), 200


@bp.route('/<int:bill_id>', methods=['GET'])
@jwt_required()
def get_bill(bill_id):
    """
    Get a single bill by ID.
    
    Response (200):
        {
            "id": 1,
            "tableId": 3,
            "status": "paid",
            "orders": [...],
            ...
        }
    
    Errors:
        404: Bill not found
    """
    bill = Bill.query.get(bill_id)
    
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404
    
    return jsonify(bill.to_dict()), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_bill():
    """
    Create a new bill (start service for a table).
    
    Request Body:
        {
            "tableId": 3
        }
    
    Response (201):
        {
            "id": 15,
            "tableId": 3,
            "waiterId": 1,
            "status": "open",
            ...
        }
    
    Errors:
        400: Missing tableId or table already has open bill
        404: Table not found
    """
    data = request.get_json()
    
    if not data or not data.get('tableId'):
        return jsonify({'error': 'Table ID is required'}), 400
    
    # Get authenticated user (waiter)
    user_id = int(get_jwt_identity())
    
    # Verify table exists
    table = Table.query.get(data['tableId'])
    if not table:
        return jsonify({'error': 'Table not found'}), 404
    
    # Check if table already has an open bill
    existing_bill = table.get_active_bill()
    if existing_bill:
        return jsonify({'error': 'Table already has an open bill'}), 400
    
    # Create bill
    bill = Bill(
        table_id=data['tableId'],
        waiter_id=user_id,
        status='open'
    )
    
    db.session.add(bill)
    
    # Update table status
    table.status = 'occupied'
    
    db.session.commit()
    
    return jsonify(bill.to_dict()), 201


@bp.route('/<int:bill_id>', methods=['PUT'])
@jwt_required()
def update_bill(bill_id):
    """
    Update a bill (typically to close it with payment info).
    
    Request Body:
        {
            "status": "paid",
            "tipAmount": 5.00,
            "tipPercentage": 10,
            "paymentMethod": "credit",
            "paymentSplitType": "equal",
            "paymentSplitDetails": "{...}"
        }
    
    Response (200):
        {
            "id": 1,
            "status": "paid",
            "totalAmount": 50.97,
            ...
        }
    
    Errors:
        404: Bill not found
    """
    bill = Bill.query.get(bill_id)
    
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404
    
    data = request.get_json()
    
    # Update status
    if 'status' in data:
        bill.status = data['status']
        if data['status'] == 'paid':
            bill.closed_at = datetime.utcnow()
            # Set table to available
            bill.table.status = 'available'
    
    # Update tip information
    if 'tipAmount' in data:
        bill.tip_amount = data['tipAmount']
    if 'tipPercentage' in data:
        bill.tip_percentage = data['tipPercentage']
    
    # Update payment information
    if 'paymentMethod' in data:
        bill.payment_method = data['paymentMethod']
    if 'paymentSplitType' in data:
        bill.payment_split_type = data['paymentSplitType']
    if 'paymentSplitDetails' in data:
        bill.payment_split_details = data['paymentSplitDetails']
    
    # Recalculate totals
    bill.calculate_totals()
    
    db.session.commit()
    
    return jsonify(bill.to_dict()), 200


@bp.route('/<int:bill_id>', methods=['DELETE'])
@jwt_required()
def delete_bill(bill_id):
    """
    Delete a bill (only if status is 'open' and has no orders).
    
    Response (200):
        {
            "message": "Bill deleted successfully"
        }
    
    Errors:
        404: Bill not found
        400: Cannot delete bill with orders or paid bill
    """
    bill = Bill.query.get(bill_id)
    
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404
    
    if bill.status != 'open':
        return jsonify({'error': 'Cannot delete a closed bill'}), 400
    
    if bill.orders:
        return jsonify({'error': 'Cannot delete bill with orders'}), 400
    
    db.session.delete(bill)
    db.session.commit()
    
    return jsonify({'message': 'Bill deleted successfully'}), 200
