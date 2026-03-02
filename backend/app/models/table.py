"""
Table Model
Represents physical tables in the restaurant.
"""

from datetime import datetime
from app import db

class Table(db.Model):
    """
    Restaurant table model.
    Tracks table number, capacity, and current status.
    """
    __tablename__ = 'tables'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Table information
    number = db.Column(db.Integer, unique=True, nullable=False, index=True)
    capacity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='available')  # 'available', 'occupied', 'reserved'
    
    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    # A table can have many bills (service sessions) over time
    bills = db.relationship('Bill', backref='table', lazy=True)
    # A table can have many orders over time
    orders = db.relationship('Order', backref='table', lazy=True)
    
    def __repr__(self):
        return f'<Table {self.number} ({self.status})>'
    
    def get_active_bill(self):
        """
        Get the currently open bill for this table.
        Returns None if no active bill.
        """
        return next((bill for bill in self.bills if bill.status == 'open'), None)
    
    def to_dict(self, include_orders=True):
        """
        Convert table to dictionary.
        Matches frontend Table interface from types/index.ts
        
        Args:
            include_orders (bool): Whether to include orders in response
        """
        # Get active bill for this table
        active_bill = self.get_active_bill()
        
        result = {
            'id': self.id,
            'number': self.number,
            'capacity': self.capacity,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'billId': active_bill.id if active_bill else None,
            'waiterId': active_bill.waiter_id if active_bill else None,
        }
        
        # Include orders array if requested (only from active bill)
        if include_orders:
            if active_bill:
                # Include ALL orders from the active bill to show complete order history
                result['orders'] = [order.to_dict() for order in active_bill.orders]
                result['activeOrdersCount'] = sum(1 for order in active_bill.orders if order.status != 'delivered')
            else:
                result['orders'] = []
                result['activeOrdersCount'] = 0
        
        return result
