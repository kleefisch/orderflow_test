"""
OrderItem Model
Represents individual line items within an order.
"""

from datetime import datetime
from app import db

class OrderItem(db.Model):
    """
    Order item model - junction table between orders and menu items.
    Tracks quantity and calculates subtotals.
    """
    __tablename__ = 'order_items'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, index=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False, index=True)
    
    # Item details
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price = db.Column(db.Float, nullable=False)  # Price at time of order (historical record)
    subtotal = db.Column(db.Float, nullable=False)  # quantity * price
    notes = db.Column(db.Text, nullable=True)  # Special instructions (e.g., "no onions")
    
    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<OrderItem {self.id} - Order {self.order_id}>'
    
    def to_dict(self):
        """
        Convert order item to dictionary.
        Matches frontend OrderItem interface from types/index.ts
        """
        return {
            'id': self.id,
            'orderId': self.order_id,
            'menuItemId': self.menu_item_id,
            'quantity': self.quantity,
            'price': self.price,
            'subtotal': self.subtotal,
            'notes': self.notes,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            # Include menu item details
            'menuItem': self.menu_item.to_dict() if self.menu_item else None
        }
    
    def calculate_subtotal(self):
        """
        Calculate subtotal from quantity and price.
        Should be called when quantity or price changes.
        """
        self.subtotal = self.quantity * self.price
        return self.subtotal
