"""
Database Initialization Script
Creates tables and populates with seed data for development/testing.
"""

from app import create_app, db, bcrypt
from app.models import User, Table, MenuItem, Bill, Order, OrderItem
from datetime import datetime


def init_database():
    """
    Initialize the database with tables and seed data.
    Run this once at the beginning or after clearing the database.
    """
    app = create_app('development')
    
    with app.app_context():
        # Drop all tables and recreate (WARNING: This deletes all data!)
        print("Dropping existing tables...")
        db.drop_all()
        
        print("Creating tables...")
        db.create_all()
        
        # Seed Users
        print("Seeding users...")
        seed_users()
        
        # Seed Tables
        print("Seeding tables...")
        seed_tables()
        
        # Seed Menu Items
        print("Seeding menu items...")
        seed_menu_items()
        
        print("Database initialized successfully!")


def seed_users():
    """Create default users: kitchen, manager, and sample waiters"""
    users = [
        {
            'username': 'kitchen',
            'password': 'kitchen123',
            'name': 'Kitchen Staff',
            'role': 'kitchen'
        },
        {
            'username': 'admin',
            'password': 'admin123',
            'name': 'Manager',
            'role': 'manager'
        },
        {
            'username': 'john',
            'password': 'waiter123',
            'name': 'John Doe',
            'role': 'waiter'
        },
        {
            'username': 'sarah',
            'password': 'waiter123',
            'name': 'Sarah Smith',
            'role': 'waiter'
        }
    ]
    
    for user_data in users:
        # Hash the password
        password_hash = bcrypt.generate_password_hash(user_data['password']).decode('utf-8')
        
        user = User(
            username=user_data['username'],
            password_hash=password_hash,
            name=user_data['name'],
            role=user_data['role']
        )
        db.session.add(user)
    
    db.session.commit()
    print(f"Created {len(users)} users")


def seed_tables():
    """Create restaurant tables with varying capacities"""
    tables_data = [
        {'number': 1, 'capacity': 2},
        {'number': 2, 'capacity': 2},
        {'number': 3, 'capacity': 4},
        {'number': 4, 'capacity': 4},
        {'number': 5, 'capacity': 4},
        {'number': 6, 'capacity': 6},
        {'number': 7, 'capacity': 6},
        {'number': 8, 'capacity': 8},
        {'number': 9, 'capacity': 2},
        {'number': 10, 'capacity': 4}
    ]
    
    for table_data in tables_data:
        table = Table(
            number=table_data['number'],
            capacity=table_data['capacity'],
            status='available'
        )
        db.session.add(table)
    
    db.session.commit()
    print(f"Created {len(tables_data)} tables")


def seed_menu_items():
    """Create menu items across different categories"""
    menu_items = [
        # Appetizers
        {
            'name': 'Bruschetta',
            'category': 'appetizer',
            'price': 8.99,
            'description': 'Toasted bread with tomato, garlic, and basil',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        {
            'name': 'Mozzarella Sticks',
            'category': 'appetizer',
            'price': 7.99,
            'description': 'Crispy fried mozzarella with marinara sauce',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/4079520/pexels-photo-4079520.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        {
            'name': 'Caesar Salad',
            'category': 'appetizer',
            'price': 9.99,
            'description': 'Romaine lettuce, parmesan, croutons, Caesar dressing',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        
        # Main Courses
        {
            'name': 'Grilled Salmon',
            'category': 'main',
            'price': 22.99,
            'description': 'Fresh Atlantic salmon with herbs and lemon',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/3296481/pexels-photo-3296481.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        {
            'name': 'Ribeye Steak',
            'category': 'main',
            'price': 29.99,
            'description': '12oz ribeye with garlic butter',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        {
            'name': 'Chicken Parmesan',
            'category': 'main',
            'price': 18.99,
            'description': 'Breaded chicken with marinara and mozzarella',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/2491273/pexels-photo-2491273.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        {
            'name': 'Spaghetti Carbonara',
            'category': 'main',
            'price': 16.99,
            'description': 'Pasta with bacon, egg, and parmesan cream sauce',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        {
            'name': 'Margherita Pizza',
            'category': 'main',
            'price': 14.99,
            'description': 'Fresh mozzarella, tomato sauce, basil',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        
        # Desserts
        {
            'name': 'Tiramisu',
            'category': 'dessert',
            'price': 7.99,
            'description': 'Classic Italian coffee-flavored dessert',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        {
            'name': 'Chocolate Lava Cake',
            'category': 'dessert',
            'price': 8.99,
            'description': 'Warm chocolate cake with molten center',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        {
            'name': 'Cheesecake',
            'category': 'dessert',
            'price': 6.99,
            'description': 'New York style cheesecake with berry compote',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/140831/pexels-photo-140831.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        
        # Beverages
        {
            'name': 'Coca Cola',
            'category': 'beverage',
            'price': 2.99,
            'description': 'Classic cola drink',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        {
            'name': 'Iced Tea',
            'category': 'beverage',
            'price': 2.99,
            'description': 'Freshly brewed black tea',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/1484440/pexels-photo-1484440.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        {
            'name': 'Coffee',
            'category': 'beverage',
            'price': 3.49,
            'description': 'Hot brewed coffee',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=600'
        },
        {
            'name': 'Red Wine',
            'category': 'beverage',
            'price': 8.99,
            'description': 'House red wine',
            'available': True,
            'image_url': 'https://images.pexels.com/photos/1269025/pexels-photo-1269025.jpeg?auto=compress&cs=tinysrgb&w=600'
        }
    ]
    
    for item_data in menu_items:
        menu_item = MenuItem(
            name=item_data['name'],
            category=item_data['category'],
            price=item_data['price'],
            description=item_data['description'],
            available=item_data['available'],
            image_url=item_data.get('image_url')
        )
        db.session.add(menu_item)
    
    db.session.commit()
    print(f"Created {len(menu_items)} menu items")


if __name__ == '__main__':
    init_database()
