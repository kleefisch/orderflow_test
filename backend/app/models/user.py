"""
User Model
Represents restaurant staff (waiters, kitchen staff, managers).
"""

from datetime import datetime
from app import db

class User(db.Model):
    """
    User model for authentication and role-based access.
    
    Roles:
    - 'waiter': Takes orders, manages tables
    - 'kitchen': Views and updates order preparation status
    - 'manager': Full access to all features including user management
    """
    __tablename__ = 'users'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # User credentials
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # User information
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'waiter', 'kitchen', 'manager'
    
    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    # A user (waiter) can create many orders
    orders = db.relationship('Order', backref='waiter', lazy=True, foreign_keys='Order.waiter_id')
    
    def __repr__(self):
        return f'<User {self.username} ({self.role})>'
    
    def to_dict(self):
        """
        Convert user to dictionary (excludes password_hash for security).
        Matches frontend User interface from types/index.ts
        """
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'role': self.role,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
