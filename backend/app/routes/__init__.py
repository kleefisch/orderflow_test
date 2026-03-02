"""
Route Blueprints
Import all route modules for registration in the Flask app.
"""

from . import auth
from . import tables
from . import menu
from . import orders
from . import users

__all__ = ['auth', 'tables', 'menu', 'orders', 'users']
