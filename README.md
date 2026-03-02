# OrderFlow

A modern Point of Sale (POS) system for restaurants with real-time order management, kitchen display, and integrated payment processing.

## Overview

OrderFlow streamlines restaurant operations by providing role-based interfaces for waiters, kitchen staff, and managers. The system features real-time order tracking, table management, menu configuration, and comprehensive payment options including bill splitting capabilities.

## Key Features

**Waiter Functions**
- Table status management and reservation
- Menu browsing with category filtering
- Order creation with special instructions
- Real-time order status tracking
- Payment processing with tip calculation and bill splitting options

**Kitchen Display**
- Live order queue with status indicators
- Order status management (pending → preparing → done)
- Detailed order items with special instructions
- Real-time synchronization across all devices

**Manager Dashboard**
- User account management with role-based access control
- Menu item configuration and availability management
- Table setup and capacity planning
- Operational overview and analytics

## Technology Stack

**Backend**
- Flask 3.1.0 - Python web framework
- SQLAlchemy 2.0.46 - ORM and database management
- Flask-JWT-Extended - Token-based authentication
- Flask-CORS - Cross-origin resource sharing
- Bcrypt - Secure password hashing
- SQLite/PostgreSQL - Data persistence

**Frontend**
- React 18.3.1 - UI framework
- TypeScript 5.7.2 - Type-safe development
- Vite 6.3.5 - Fast build tooling
- Tailwind CSS 3.4.17 - Utility-first styling  
- Lucide React - Icon library
- Recharts - Data visualization

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn package manager

### Installation

**1. Clone the repository**
```bash
git clone <repository-url>
cd OrderFlow
```

**2. Backend Setup**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\\Scripts\\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
python init_db.py

# Start server
python run.py
```

The backend will run at `http://localhost:5000`

**3. Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_USE_MOCK=false to connect to backend

# Start development server
npm run dev
```

The frontend will run at `http://localhost:3000`

## Default Credentials

- **Manager**: `admin` / `admin123`
- **Kitchen**: `kitchen` / `kitchen123`
- **Waiter**: `john` / `waiter123`

## Project Structure

```
OrderFlow/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   ├── __init__.py      # Application factory
│   │   └── config.py        # Configuration
│   ├── init_db.py           # Database initialization
│   ├── run.py               # Application entry point
│   └── requirements.txt     # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── services/        # API client
    │   ├── types/           # TypeScript definitions
    │   ├── contexts/        # React context providers
    │   └── App.tsx          # Root component
    └── package.json         # Node dependencies
```

## Architecture

### Database Schema

**Bill** - Service sessions with payment tracking  
**Order** - Customer orders with status lifecycle  
**OrderItem** - Individual items within orders  
**Table** - Restaurant tables with capacity  
**MenuItem** - Menu items with categories  
**User** - Staff accounts with role-based access

### Bill Management

The system uses a bill-centric model where each service session creates a bill that contains all orders. This approach:
- Preserves complete order history
- Supports flexible payment methods (credit, debit, cash, PIX)
- Enables tip calculation and bill splitting
- Maintains data integrity for reporting

### Order Lifecycle

Orders progress through defined states:
1. **pending** - Order placed, awaiting kitchen
2. **preparing** - Kitchen is preparing the order
3. **done** - Order ready for delivery
4. **delivered** - Order delivered to customer

## API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication

### Tables
- `GET /api/tables` - List all tables
- `POST /api/tables/:id/start-service` - Start table service
- `PUT /api/tables/:id` - Update table status

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Delete pending order

### Bills
- `GET /api/bills` - List all bills
- `POST /api/bills` - Create bill
- `PUT /api/bills/:id` - Update bill with payment

### Menu
- `GET /api/menu` - List menu items
- `POST /api/menu` - Create menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Users (Manager only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Development

**Backend**
```bash
# Run with auto-reload
python run.py

# Reset database
python init_db.py
```

**Frontend**
```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build
```

## Deployment

### Backend Production
- Use production WSGI server (Gunicorn, uWSGI)
- Configure PostgreSQL database
- Set secure environment variables
- Enable HTTPS
- Configure CORS for production domain

### Frontend Production
- Build optimized bundle: `npm run build`
- Serve static files from `dist/` directory
- Configure production API URL
- Enable HTTPS

## Security

- JWT-based authentication with secure token storage
- Password hashing using bcrypt
- Role-based access control (RBAC)
- Protected API endpoints with authentication middleware
- CORS configuration for allowed origins
- Environment-based configuration management

## Attribution

This project uses components from [shadcn/ui](https://ui.shadcn.com/) (MIT License) and images from [Unsplash](https://unsplash.com).
