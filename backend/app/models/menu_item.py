"""
MenuItem Model
Represents items available on the restaurant menu.
"""

from datetime import datetime
from app import db

class MenuItem(db.Model):
    """
    Menu item model for food and drink offerings.
    """
    __tablename__ = 'menu_items'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Item information
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # 'appetizer', 'main', 'dessert', 'beverage'
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    
    # Availability
    available = db.Column(db.Boolean, nullable=False, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    # A menu item can appear in many order items
    order_items = db.relationship('OrderItem', backref='menu_item', lazy=True)
    
    def __repr__(self):
        return f'<MenuItem {self.name} (${self.price})>'
    
    def to_dict(self):
        """
        Convert menu item to dictionary.
        Matches frontend MenuItem interface from types/index.ts
        """
        return {
            'id': str(self.id),
            'name': self.name,
            'category': self.category,
            'price': self.price,
            'description': self.description,
            'image': self.image_url,  # Frontend expects 'image' not 'imageUrl'
            'available': self.available,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
