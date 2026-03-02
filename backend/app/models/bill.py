"""
Bill Model
Represents a service session for a table with payment information.
A bill contains all orders for a single service session.
"""

from datetime import datetime
from app import db

class Bill(db.Model):
    """
    Bill model tracks service sessions and payment information.
    
    Flow:
    1. Waiter starts service → Bill created with status='open'
    2. Orders are added to the bill
    3. Payment completed → Bill updated with payment info and status='paid'
    4. Table becomes available for next service
    """
    __tablename__ = 'bills'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    table_id = db.Column(db.Integer, db.ForeignKey('tables.id'), nullable=False, index=True)
    waiter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Bill Status
    status = db.Column(db.String(20), nullable=False, default='open')  # 'open', 'paid', 'cancelled'
    
    # Financial Information
    subtotal = db.Column(db.Float, nullable=False, default=0.0)
    tip_amount = db.Column(db.Float, nullable=False, default=0.0)
    tip_percentage = db.Column(db.Float, nullable=True)  # For reference
    total_amount = db.Column(db.Float, nullable=False, default=0.0)
    
    # Payment Information
    payment_method = db.Column(db.String(20), nullable=True)  # 'credit', 'debit', 'cash', 'pix'
    payment_split_type = db.Column(db.String(20), nullable=True)  # 'full', 'equal', 'custom', 'items'
    payment_split_details = db.Column(db.Text, nullable=True)  # JSON string with split details
    
    # Timestamps
    opened_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    closed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    # A bill has many orders
    orders = db.relationship('Order', backref='bill', lazy=True)
    
    def __repr__(self):
        return f'<Bill {self.id} - Table {self.table_id} ({self.status})>'
    
    def to_dict(self, include_orders=True):
        """
        Convert bill to dictionary.
        """
        bill_dict = {
            'id': self.id,
            'tableId': self.table_id,
            'waiterId': self.waiter_id,
            'status': self.status,
            'subtotal': self.subtotal,
            'tipAmount': self.tip_amount,
            'tipPercentage': self.tip_percentage,
            'totalAmount': self.total_amount,
            'paymentMethod': self.payment_method,
            'paymentSplitType': self.payment_split_type,
            'paymentSplitDetails': self.payment_split_details,
            'openedAt': self.opened_at.isoformat() if self.opened_at else None,
            'closedAt': self.closed_at.isoformat() if self.closed_at else None,
        }
        
        # Include orders if requested
        if include_orders:
            bill_dict['orders'] = [order.to_dict() for order in self.orders]
        
        return bill_dict
    
    def calculate_totals(self):
        """
        Calculate subtotal and total from orders.
        Should be called after adding/updating orders or tip.
        """
        self.subtotal = sum(order.total_amount for order in self.orders)
        self.total_amount = self.subtotal + self.tip_amount
        return self.total_amount
