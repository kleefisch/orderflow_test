"""
Order Routes
CRUD operations for orders and order management.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Order, OrderItem, MenuItem, Table
from datetime import datetime

bp = Blueprint('orders', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_orders():
    """
    Get all orders.
    Can filter by status and table.
    
    Query Parameters:
        ?status=pending      (optional)
        ?tableId=1          (optional)
        ?waiterId=2         (optional)
    
    Response (200):
        [
            {
                "id": 1,
                "tableId": 3,
                "waiterId": 1,
                "status": "pending",
                "totalAmount": 45.97,
                "notes": "Extra napkins",
                "items": [...],
                "createdAt": "2024-01-01T12:00:00",
                ...
            },
            ...
        ]
    """
    # Start with base query
    query = Order.query
    
    # Filter by status if provided
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    
    # Filter by table if provided
    table_id = request.args.get('tableId')
    if table_id:
        query = query.filter_by(table_id=table_id)
    
    # Filter by waiter if provided
    waiter_id = request.args.get('waiterId')
    if waiter_id:
        query = query.filter_by(waiter_id=waiter_id)
    
    # Execute query, order by most recent first
    orders = query.order_by(Order.created_at.desc()).all()
    
    return jsonify([order.to_dict() for order in orders]), 200


@bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """
    Get a single order by ID.
    
    Response (200):
        {
            "id": 1,
            "tableId": 3,
            "waiterId": 1,
            "status": "pending",
            "items": [...],
            ...
        }
    
    Errors:
        404: Order not found
    """
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    return jsonify(order.to_dict()), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_order():
    """
    Create a new order with items.
    
    Request Body:
        {
            "tableId": 3,
            "notes": "Extra napkins",
            "items": [
                {
                    "menuItemId": 1,
                    "quantity": 2,
                    "notes": "No onions"
                },
                {
                    "menuItemId": 5,
                    "quantity": 1
                }
            ]
        }
    
    Response (201):
        {
            "id": 15,
            "tableId": 3,
            "waiterId": 1,
            "status": "pending",
            "totalAmount": 45.97,
            "items": [...],
            ...
        }
    
    Errors:
        400: Missing required fields or invalid data
        404: Table or menu item not found
    """
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('tableId') or not data.get('items'):
        return jsonify({'error': 'Table ID and items are required'}), 400
    
    # Get authenticated user (waiter)
    user_id = int(get_jwt_identity())  # Convert string back to int
    
    # Verify table exists
    table = Table.query.get(data['tableId'])
    if not table:
        return jsonify({'error': 'Table not found'}), 404
    
    # Get or create active bill for this table
    from app.models import Bill
    bill = table.get_active_bill()
    if not bill:
        # Create a new bill if none exists
        bill = Bill(
            table_id=data['tableId'],
            waiter_id=user_id,
            status='open'
        )
        db.session.add(bill)
        db.session.flush()  # Get bill ID
    
    # Create order and associate with bill
    order = Order(
        bill_id=bill.id,
        table_id=data['tableId'],
        waiter_id=user_id,
        status='pending',
        notes=data.get('notes')
    )
    db.session.add(order)
    db.session.flush()  # Get order ID before adding items
    
    # Create order items
    for item_data in data['items']:
        # Validate menu item exists
        menu_item = MenuItem.query.get(item_data['menuItemId'])
        if not menu_item:
            return jsonify({'error': f'Menu item {item_data["menuItemId"]} not found'}), 404
        
        # Create order item
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=item_data['menuItemId'],
            quantity=item_data['quantity'],
            price=menu_item.price,  # Use current price
            notes=item_data.get('notes')
        )
        order_item.calculate_subtotal()
        db.session.add(order_item)
    
    # Calculate and set total amount
    db.session.flush()  # Ensure order items are saved
    order.calculate_total()
    
    # Update bill totals
    bill.calculate_totals()
    
    # Update table status to occupied
    table.status = 'occupied'
    
    db.session.commit()
    
    return jsonify(order.to_dict()), 201


@bp.route('/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order(order_id):
    """
    Update an order's status or details.
    
    Request Body:
        {
            "status": "preparing",
            "notes": "Rush order"
        }
    
    Response (200):
        {
            "id": 1,
            "status": "preparing",
            "preparingAt": "2024-01-01T12:05:00",
            ...
        }
    
    Errors:
        404: Order not found
        400: Invalid status transition
    """
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    data = request.get_json()
    
    # Update status with timestamps
    if 'status' in data:
        new_status = data['status']
        order.status = new_status
        
        # Update timestamps based on status
        if new_status == 'preparing' and not order.preparing_at:
            order.preparing_at = datetime.utcnow()
        elif new_status == 'done' and not order.done_at:
            order.done_at = datetime.utcnow()
        elif new_status == 'delivered' and not order.delivered_at:
            order.delivered_at = datetime.utcnow()
            # Note: Table status is NOT automatically set to available
            # Table should remain occupied until waiter completes payment
    
    # Update notes if provided
    if 'notes' in data:
        order.notes = data['notes']
    
    db.session.commit()
    
    return jsonify(order.to_dict()), 200


@bp.route('/<int:order_id>', methods=['DELETE'])
@jwt_required()
def delete_order(order_id):
    """
    Delete an order (only pending orders).
    
    Response (200):
        {
            "message": "Order deleted successfully"
        }
    
    Errors:
        404: Order not found
        400: Cannot delete non-pending order
    """
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Only allow deletion of pending orders
    if order.status != 'pending':
        return jsonify({'error': 'Cannot delete order that is not pending'}), 400
    
    # Delete the order
    # Note: Table status is NOT automatically changed
    # Table should remain occupied until waiter completes payment
    db.session.delete(order)
    db.session.commit()
    
    return jsonify({'message': 'Order deleted successfully'}), 200
