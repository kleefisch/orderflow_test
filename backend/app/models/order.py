"""
Order Model
Represents customer orders with status tracking and relationships to tables and users.
"""

from datetime import datetime
from app import db

class Order(db.Model):
    """
    Order model tracks customer orders through their lifecycle.
    
    Status workflow:
    1. 'pending' - Order placed, waiting for kitchen
    2. 'preparing' - Kitchen is preparing the order
    3. 'done' - Order ready for delivery
    4. 'delivered' - Order delivered to table
    """
    __tablename__ = 'orders'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    bill_id = db.Column(db.Integer, db.ForeignKey('bills.id'), nullable=True, index=True)  # Orders now belong to bills
    table_id = db.Column(db.Integer, db.ForeignKey('tables.id'), nullable=False, index=True)
    waiter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Order information
    status = db.Column(db.String(20), nullable=False, default='pending')  # 'pending', 'preparing', 'done', 'delivered'
    total_amount = db.Column(db.Float, nullable=False, default=0.0)
    notes = db.Column(db.Text, nullable=True)
    
    # Timestamps - tracks order lifecycle
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    preparing_at = db.Column(db.DateTime, nullable=True)  # When kitchen started preparing
    done_at = db.Column(db.DateTime, nullable=True)       # When kitchen finished
    delivered_at = db.Column(db.DateTime, nullable=True)  # When delivered to table
    
    # Relationships
    # An order has many order items (line items)
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Order {self.id} - Table {self.table_id} ({self.status})>'
    
    def to_dict(self, include_items=True):
        """
        Convert order to dictionary.
        Matches frontend Order interface from types/index.ts
        
        Args:
            include_items (bool): Whether to include order items in response
        """
        order_dict = {
            'id': self.id,
            'tableId': self.table_id,
            'waiterId': self.waiter_id,
            'status': self.status,
            'totalAmount': self.total_amount,
            'notes': self.notes,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'preparingAt': self.preparing_at.isoformat() if self.preparing_at else None,
            'doneAt': self.done_at.isoformat() if self.done_at else None,
            'deliveredAt': self.delivered_at.isoformat() if self.delivered_at else None
        }
        
        # Include order items if requested
        if include_items:
            order_dict['items'] = [item.to_dict() for item in self.items]
        
        return order_dict
    
    def calculate_total(self):
        """
        Calculate total amount from order items.
        Should be called after adding/removing items.
        """
        self.total_amount = sum(item.subtotal for item in self.items)
        return self.total_amount
