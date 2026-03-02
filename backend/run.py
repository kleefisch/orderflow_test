"""
Flask Application Entry Point
Run this file to start the development server.
Usage: python run.py
"""

from app import create_app
import os

# Create Flask app with development configuration
app = create_app('development')

if __name__ == '__main__':
    # Get host and port from environment variables
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    
    # Run development server
    print(f"OrderFlow Backend starting on http://{host}:{port}")
    print("API Health Check: http://localhost:5000/api/health")
    print("\nDefault credentials:")
    print("  Manager: admin/admin123")
    print("  Kitchen: kitchen/kitchen123")
    print("  Waiter: john/waiter123")
    print("\nPress CTRL+C to stop the server\n")
    
    app.run(
        host=host,
        port=port,
        debug=True  # Enable debug mode for development
    )
