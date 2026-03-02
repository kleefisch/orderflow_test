/**
 * API Service Layer
 * 
 * Centralizes all data operations for the OrderFlow system.
 * Supports both mock data for development and real backend API calls.
 */

import type { Table, User, CreateUserDTO, AuthCredentials, MenuItem, Order } from '../types';
import { MENU_ITEMS } from '../data/menuData';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.0.0.88:5000/api';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK === 'true';

// Helper to get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('orderflow_token');
}

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert backend data (integers) to frontend (strings)
 */
function convertBackendToFrontend(data: any): any {
  if (Array.isArray(data)) {
    return data.map(convertBackendToFrontend);
  }
  
  if (data && typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Convert ID fields from number to string
      if (key === 'id' || key.endsWith('Id')) {
        converted[key] = value?.toString();
      } 
      // Convert backend field names to frontend names
      else if (key === 'imageUrl') {
        converted['image'] = value || '';
      }
      else if (key === 'capacity') {
        converted['seats'] = value;
      }
      else if (key === 'items' && Array.isArray(value)) {
        // Convert order items - flatten menuItem into the order item
        converted[key] = value.map((item: any) => {
          const baseItem = {
            id: item.id?.toString(),
            menuItemId: item.menuItemId?.toString(),
            orderId: item.orderId?.toString(),
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            notes: item.notes
          };
          
          // If menuItem exists, flatten it into the order item
          if (item.menuItem) {
            return {
              ...baseItem,
              name: item.menuItem.name,
              category: item.menuItem.category,
              image: item.menuItem.imageUrl || item.menuItem.image || '',
              description: item.menuItem.description || '',
              available: item.menuItem.available !== false
            };
          }
          
          return baseItem;
        });
      } else if (typeof value === 'object' && value !== null) {
        converted[key] = convertBackendToFrontend(value);
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }
  
  return data;
}

/**
 * Convert date strings from API to Date objects
 */
function mapOrderDates(order: any): Order {
  const converted = convertBackendToFrontend(order);
  return {
    ...converted,
    createdAt: converted.createdAt ? new Date(converted.createdAt) : new Date(),
    sentAt: converted.sentAt ? new Date(converted.sentAt) : undefined,
    preparingAt: converted.preparingAt ? new Date(converted.preparingAt) : undefined,
    doneAt: converted.doneAt ? new Date(converted.doneAt) : undefined,
    deliveredAt: converted.deliveredAt ? new Date(converted.deliveredAt) : undefined,
  };
}

/**
 * Convert table data with date conversions for orders
 */
function mapTableDates(table: any): Table {
  const converted = convertBackendToFrontend(table);
  return {
    ...converted,
    // Backend uses 'capacity', frontend uses 'seats'
    seats: converted.capacity || converted.seats,
    // Add orders array if not present (backend might not include it)
    orders: (converted.orders || []).map(mapOrderDates)
  };
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_USERS: User[] = [
  { id: '1', name: 'John Silva', username: 'john', role: 'waiter' },
  { id: '2', name: 'Mary Santos', username: 'mary', role: 'waiter' },
  { id: '3', name: 'Peter Johnson', username: 'peter', role: 'waiter' },
  { id: '4', name: 'Anna Costa', username: 'anna', role: 'waiter' },
];

// Internal password storage (mock only - in production, handled by backend)
const MOCK_PASSWORDS: Record<string, string> = {
  '1': 'waiter123',
  '2': 'waiter123',
  '3': 'waiter123',
  '4': 'waiter123',
  'kitchen': 'kitchen123',
  'manager': 'admin123'
};

const KITCHEN_USER: User = {
  id: 'kitchen',
  name: 'Kitchen',
  username: 'kitchen',
  role: 'kitchen'
};

const MANAGER_USER: User = {
  id: 'manager',
  name: 'Admin Manager',
  username: 'admin',
  role: 'manager'
};

// Mock data with string dates (simulates JSON from backend)
// Will be converted to Date objects by mapTableDates when returned
const INITIAL_TABLES: any[] = [
  { id: '1', number: 1, seats: 2, status: 'available', orders: [] },
  { 
    id: '2', 
    number: 2, 
    seats: 4, 
    status: 'occupied', 
    orders: [
      {
        id: 'order-1',
        items: [
          { id: '1', name: 'Caesar Salad', category: 'Appetizers', price: 28.90, image: '', description: 'Romaine lettuce, croutons, parmesan', quantity: 2, notes: 'No croutons please' },
          { id: '4', name: 'Grilled Steak', category: 'Main Courses', price: 89.90, image: '', description: 'Grilled filet mignon', quantity: 1, notes: 'Medium rare' },
          { id: '8', name: 'Espresso Coffee', category: 'Beverages', price: 8.90, image: '', description: 'Traditional espresso', quantity: 2 }
        ],
        status: 'pending',
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        sentAt: new Date(Date.now() - 5 * 60000).toISOString()
      }
    ], 
    waiterId: '1' 
  },
  { 
    id: '3', 
    number: 3, 
    seats: 2, 
    status: 'occupied', 
    orders: [
      {
        id: 'order-2',
        items: [
          { id: '5', name: 'Artisan Burger', category: 'Main Courses', price: 52.90, image: '', description: '180g burger with cheese', quantity: 1, notes: 'Extra bacon' },
          { id: '9', name: 'Orange Juice', category: 'Beverages', price: 12.90, image: '', description: 'Fresh orange juice', quantity: 1 }
        ],
        status: 'preparing',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        sentAt: new Date(Date.now() - 15 * 60000).toISOString(),
        preparingAt: new Date(Date.now() - 10 * 60000).toISOString()
      }
    ], 
    waiterId: '2' 
  },
  { 
    id: '4', 
    number: 4, 
    seats: 6, 
    status: 'occupied', 
    orders: [
      {
        id: 'order-3',
        items: [
          { id: '3', name: 'Sushi Platter', category: 'Appetizers', price: 45.90, image: '', description: '12 pieces assorted', quantity: 2 },
          { id: '6', name: 'Pasta Carbonara', category: 'Main Courses', price: 48.90, image: '', description: 'Fresh pasta with creamy sauce', quantity: 3 },
          { id: '11', name: 'House Cocktail', category: 'Beverages', price: 28.90, image: '', description: 'Special cocktail', quantity: 4 }
        ],
        status: 'done',
        createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
        sentAt: new Date(Date.now() - 25 * 60000).toISOString(),
        preparingAt: new Date(Date.now() - 20 * 60000).toISOString(),
        doneAt: new Date(Date.now() - 2 * 60000).toISOString()
      }
    ], 
    waiterId: '2' 
  },
  { id: '5', number: 5, seats: 4, status: 'reserved', orders: [] },
  { id: '6', number: 6, seats: 8, status: 'reserved', orders: [], waiterId: '3' },
  { id: '7', number: 7, seats: 2, status: 'available', orders: [] },
  { id: '8', number: 8, seats: 4, status: 'available', orders: [] },
  { 
    id: '9', 
    number: 9, 
    seats: 4, 
    status: 'occupied', 
    orders: [
      {
        id: 'order-4',
        items: [
          { id: '7', name: 'Pizza Margherita', category: 'Main Courses', price: 42.90, image: '', description: 'Tomato, mozzarella, basil', quantity: 2 },
          { id: '10', name: 'Soda', category: 'Beverages', price: 8.00, image: '', description: 'Can 350ml', quantity: 3 }
        ],
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
        sentAt: new Date(Date.now() - 2 * 60000).toISOString()
      }
    ], 
    waiterId: '1' 
  },
  { id: '10', number: 10, seats: 2, status: 'available', orders: [] },
  { id: '11', number: 11, seats: 6, status: 'available', orders: [] },
  { 
    id: '12', 
    number: 12, 
    seats: 4, 
    status: 'occupied', 
    orders: [
      {
        id: 'ord-003',
        items: [
          { ...MENU_ITEMS[6], quantity: 2 },
          { ...MENU_ITEMS[9], quantity: 2 }
        ],
        status: 'done',
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
        sentAt: new Date(Date.now() - 25 * 60000).toISOString(),
        preparingAt: new Date(Date.now() - 20 * 60000).toISOString(),
        doneAt: new Date(Date.now() - 2 * 60000).toISOString()
      }
    ], 
    waiterId: '4' 
  },
];

// In-memory storage (will be replaced by backend)
// Convert initial mock data from string dates to Date objects immediately
let users: User[] = [...MOCK_USERS];
let tables: Table[] = INITIAL_TABLES.map(mapTableDates);
let menuItems: MenuItem[] = [...MENU_ITEMS];
let categories: string[] = ['Appetizers', 'Main Courses', 'Beverages', 'Desserts'];

// ============================================
// AUTHENTICATION SERVICES
// ============================================

/**
 * Authenticate user with username and password.
 * Stores JWT token in localStorage upon success.
 */
export async function login(
  credentials: AuthCredentials,
  loginType: 'waiter' | 'kitchen' | 'manager'
): Promise<{ success: boolean; user?: User; role?: 'waiter' | 'kitchen' | 'manager'; error?: string }> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Login failed' };
      }

      const data = await response.json();
      const user = convertBackendToFrontend(data.user);
      
      // Store token in localStorage
      localStorage.setItem('orderflow_token', data.token);
      localStorage.setItem('orderflow_user', JSON.stringify(user));
      
      return { 
        success: true, 
        user: user, 
        role: user.role 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: `Network error. Please check: 1) Phone and computer on same WiFi, 2) Backend at ${API_BASE_URL} is accessible` };
    }
  }

  // Mock data (fallback)
  await new Promise(resolve => setTimeout(resolve, 300));

  const { username, password } = credentials;

  if (loginType === 'kitchen') {
    if (username === KITCHEN_USER.username && password === MOCK_PASSWORDS['kitchen']) {
      return { success: true, user: KITCHEN_USER, role: 'kitchen' };
    }
    return { success: false, error: 'Invalid credentials. Try: kitchen / kitchen123' };
  }

  if (loginType === 'manager') {
    if (username === MANAGER_USER.username && password === MOCK_PASSWORDS['manager']) {
      return { success: true, user: MANAGER_USER, role: 'manager' };
    }
    return { success: false, error: 'Invalid credentials. Try: admin / admin123' };
  }

  const user = users.find(u => u.username === username);
  if (user && MOCK_PASSWORDS[user.id] === password) {
    return { success: true, user, role: 'waiter' };
  }

  return { success: false, error: 'Invalid credentials. Try: john / waiter123' };
}

/**
 * Logout the current user
 * Clears token and user data from localStorage
 */
export function logout(): void {
  localStorage.removeItem('orderflow_token');
  localStorage.removeItem('orderflow_user');
}

/**
 * Get stored authentication from localStorage
 * Useful for restoring session on page refresh
 */
export function getStoredAuth(): { user: User; role: 'waiter' | 'kitchen' | 'manager' } | null {
  try {
    const userStr = localStorage.getItem('orderflow_user');
    const token = localStorage.getItem('orderflow_token');
    
    if (userStr && token) {
      const user = JSON.parse(userStr);
      return { user, role: user.role };
    }
  } catch (error) {
    console.error('Error reading stored auth:', error);
  }
  
  return null;
}

/**
 * Get all orders
 * 
 * Backend replacement:
 * - GET /api/orders
 */
export async function getOrders(filters?: { status?: string; tableId?: string }): Promise<Order[]> {
  if (!USE_MOCK_DATA) {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.tableId) params.append('tableId', filters.tableId);
      
      const url = `${API_BASE_URL}/orders${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      return data.map(mapOrderDates);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }
  
  // Mock data - gather all orders from all tables
  await new Promise(resolve => setTimeout(resolve, 200));
  const allOrders: Order[] = [];
  
  tables.forEach(table => {
    table.orders.forEach(order => {
      allOrders.push(order);
    });
  });
  
  // Apply filters
  let filtered = allOrders;
  if (filters?.status) {
    filtered = filtered.filter(o => o.status === filters.status);
  }
  // Note: Orders don't have tableId property - they're accessed through Bills/Tables
  
  return filtered;
}


// ============================================
// TABLE SERVICES
// ============================================

/**
 * Get all tables
 * 
 * Backend replacement:
 * - GET /api/tables
 */
export async function getTables(): Promise<Table[]> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/tables`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      return data.map(mapTableDates);
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  return [...tables];
}

/**
 * Update a table
 * 
 * Backend replacement:
 * - PUT /api/tables/:id
 */
export async function updateTable(updatedTable: Table): Promise<Table> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${updatedTable.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          number: updatedTable.number,
          capacity: updatedTable.seats,
          status: updatedTable.status
        }),
      });
      if (!response.ok) throw new Error('Failed to update table');
      const data = await response.json();
      return mapTableDates(data);
    } catch (error) {
      console.error('Error updating table:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  const index = tables.findIndex(t => t.id === updatedTable.id);
  if (index !== -1) {
    tables[index] = updatedTable;
  }
  return updatedTable;
}

/**
 * Update multiple tables (batch update)
 * 
 * Backend replacement:
 * - Update each table individually
 */
export async function updateTables(updatedTables: Table[]): Promise<Table[]> {
  if (!USE_MOCK_DATA) {
    // Update tables one by one
    const results = await Promise.all(
      updatedTables.map(table => updateTable(table))
    );
    return results;
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  updatedTables.forEach(updatedTable => {
    const index = tables.findIndex(t => t.id === updatedTable.id);
    if (index !== -1) {
      tables[index] = updatedTable;
    }
  });
  return updatedTables;
}

/**
 * Start service for a table (creates a bill and assigns waiter)
 * 
 * Backend endpoint:
 * - POST /api/tables/:id/start-service
 */
export async function startTableService(tableId: string): Promise<Table> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableId}/start-service`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to start service');
      const data = await response.json();
      return mapTableDates(data);
    } catch (error) {
      console.error('Error starting service:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  const table = tables.find(t => t.id === tableId);
  if (table) {
    table.status = 'occupied';
    // Mock: get current user from localStorage
    const storedAuth = getStoredAuth();
    if (storedAuth) {
      table.waiterId = storedAuth.user.id;
    }
  }
  return table!;
}

/**
 * Complete payment for a table's bill
 * 
 * Backend replacement:
 * - PUT /api/bills/:id with payment info
 */
export async function completeBillPayment(
  billId: string,
  paymentData: {
    tipAmount: number;
    tipPercentage?: number;
    paymentMethod: 'credit' | 'debit' | 'cash' | 'pix';
    paymentSplitType: 'full' | 'equal' | 'custom' | 'items';
    paymentSplitDetails?: string;
  }
): Promise<Table> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/bills/${billId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'paid',
          ...paymentData
        }),
      });
      if (!response.ok) throw new Error('Failed to complete payment');
      const billData = await response.json();
      
      // Fetch updated table data
      const tableResponse = await fetch(`${API_BASE_URL}/tables/${billData.tableId}`, {
        headers: getAuthHeaders(),
      });
      if (!tableResponse.ok) throw new Error('Failed to fetch table');
      const tableData = await tableResponse.json();
      return mapTableDates(tableData);
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  }
  
  // Mock data - clear orders and set available
  await new Promise(resolve => setTimeout(resolve, 200));
  const tableIndex = tables.findIndex(t => t.billId === billId);
  if (tableIndex !== -1) {
    tables[tableIndex] = {
      ...tables[tableIndex],
      status: 'available',
      orders: [],
      billId: undefined,
      waiterId: undefined,
    };
    return tables[tableIndex];
  }
  throw new Error('Table not found');
}

// ============================================
// MENU SERVICES
// ============================================

/**
 * Get all menu items
 * 
 * Backend replacement:
 * - GET /api/menu
 */
export async function getMenuItems(): Promise<MenuItem[]> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/menu`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch menu');
      return await response.json();
    } catch (error) {
      console.error('Error fetching menu:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  return menuItems;
}

/**
 * Get menu categories
 * 
 * Backend replacement:
 * - Extract unique categories from menu items
 */
export async function getMenuCategories(): Promise<string[]> {
  if (!USE_MOCK_DATA) {
    try {
      const items = await getMenuItems();
      const uniqueCategories = [...new Set(items.map(item => item.category))];
      return uniqueCategories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  return categories;
}

// ============================================
// ORDER SERVICES
// ============================================

/**
 * Create a new order for a table
 * 
 * Backend replacement:
 * - POST /api/orders
 */
export async function createOrder(tableId: string, order: Order): Promise<Order> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tableId: parseInt(tableId),
          notes: order.notes || '',
          items: order.items.map(item => ({
            menuItemId: parseInt(item.menuItemId || item.id),
            quantity: item.quantity,
            notes: item.notes || ''
          }))
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }
      const data = await response.json();
      return mapOrderDates(data);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const table = tables.find(t => t.id === tableId);
  if (table) {
    table.orders.push(order);
  }
  
  return order;
}

/**
 * Update order status
 * 
 * Backend replacement:
 * - PATCH /api/orders/:id/status
 */
export async function updateOrderStatus(
  tableId: string,
  orderId: string,
  status: Order['status']
): Promise<Order | null> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update order');
      const data = await response.json();
      return mapOrderDates(data);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const table = tables.find(t => t.id === tableId);
  if (table) {
    const order = table.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      return order;
    }
  }
  
  return null;
}

// ============================================
// USER MANAGEMENT SERVICES
// ============================================

/**
 * Get all users (without passwords)
 * 
 * Backend replacement:
 * - GET /api/users
 */
export async function getUsers(): Promise<User[]> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return data.map(convertBackendToFrontend);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  return [...users];
}

/**
 * Create a new user
 * 
 * Backend replacement:
 * - POST /api/users
 */
export async function createUser(userDTO: CreateUserDTO): Promise<User> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: userDTO.username,
          password: userDTO.password,
          name: userDTO.name,
          role: userDTO.role
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }
      const data = await response.json();
      return convertBackendToFrontend(data);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  const { password, ...user } = userDTO;
  
  // Store password separately (mock only)
  MOCK_PASSWORDS[user.id] = password;
  
  // Add user to list
  users.push(user);
  
  // Return user without password
  return user;
}

/**
 * Update an existing user
 * 
 * Backend replacement:
 * - PUT /api/users/:id
 */
export async function updateUser(userId: string, updates: Partial<User>, newPassword?: string): Promise<User> {
  if (!USE_MOCK_DATA) {
    try {
      const body: any = {
        name: updates.name,
        role: updates.role,
        username: updates.username
      };
      if (newPassword) {
        body.password = newPassword;
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
      const data = await response.json();
      return convertBackendToFrontend(data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    if (newPassword) {
      MOCK_PASSWORDS[userId] = newPassword;
    }
    return users[index];
  }
  throw new Error('User not found');
}

/**
 * Delete a user
 * 
 * Backend replacement:
 * - DELETE /api/users/:id
 */
export async function deleteUser(userId: string): Promise<boolean> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users.splice(index, 1);
    delete MOCK_PASSWORDS[userId];
    return true;
  }
  return false;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Reset all data to initial state (useful for testing)
 */
export function resetData(): void {
  users = [...MOCK_USERS];
  tables = INITIAL_TABLES.map(mapTableDates); // Convert dates when resetting
  menuItems = [...MENU_ITEMS];
}

/**
 * Get all users including special accounts (kitchen, manager)
 * Useful for login screen
 */
export function getAllUsers(): User[] {
  return [...users, KITCHEN_USER, MANAGER_USER];
}

/**
 * Get a specific user by ID (including special accounts)
 */
export function getUserById(id: string): User | null {
  const allUsers = [...users, KITCHEN_USER, MANAGER_USER];
  return allUsers.find(u => u.id === id) || null;
}

// ============================================
// MENU MANAGEMENT SERVICES (Manager only)
// ============================================

/**
 * Create a new menu item
 * 
 * Backend replacement:
 * - POST /api/menu
 */
export async function createMenuItem(item: MenuItem): Promise<MenuItem> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/menu`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          imageUrl: item.image,
          available: item.available !== false
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create menu item');
      }
      const data = await response.json();
      return convertBackendToFrontend(data);
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  menuItems.push(item);
  return item;
}

/**
 * Update a menu item
 * 
 * Backend replacement:
 * - PUT /api/menu/:id
 */
export async function updateMenuItem(updatedItem: MenuItem): Promise<MenuItem> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${updatedItem.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: updatedItem.name,
          category: updatedItem.category,
          price: updatedItem.price,
          description: updatedItem.description,
          imageUrl: updatedItem.image,
          available: updatedItem.available !== false
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update menu item');
      }
      const data = await response.json();
      return convertBackendToFrontend(data);
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  const index = menuItems.findIndex(item => item.id === updatedItem.id);
  if (index !== -1) {
    menuItems[index] = updatedItem;
  }
  return updatedItem;
}

/**
 * Delete a menu item
 * 
 * Backend replacement:
 * - DELETE /api/menu/:id
 */
export async function deleteMenuItem(itemId: string): Promise<boolean> {
  if (!USE_MOCK_DATA) {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete menu item');
      }
      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  const index = menuItems.findIndex(item => item.id === itemId);
  if (index !== -1) {
    menuItems.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Toggle menu item availability
 * 
 * Backend replacement:
 * - PUT /api/menu/:id (update available field)
 */
export async function toggleMenuItemAvailability(itemId: string): Promise<MenuItem | null> {
  if (!USE_MOCK_DATA) {
    try {
      // First get the current item
      const items = await getMenuItems();
      const item = items.find(i => i.id === itemId);
      if (!item) return null;
      
      // Update with toggled availability
      const response = await fetch(`${API_BASE_URL}/menu/${itemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          available: !item.available
        }),
      });
      if (!response.ok) throw new Error('Failed to toggle availability');
      const data = await response.json();
      return convertBackendToFrontend(data);
    } catch (error) {
      console.error('Error toggling menu item availability:', error);
      throw error;
    }
  }
  
  // Mock data
  await new Promise(resolve => setTimeout(resolve, 200));
  const item = menuItems.find(i => i.id === itemId);
  if (item) {
    item.available = item.available === false ? true : false;
    return item;
  }
  
  return null;
}

// ============================================
// TABLE MANAGEMENT SERVICES (Manager only)
// ============================================

/**
 * Create a new table
 * 
 * Backend replacement:
 * - POST /api/tables
 */
export async function createTable(table: Table): Promise<Table> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  tables.push(table);
  return table;
}

/**
 * Delete a table
 * 
 * Backend replacement:
 * - DELETE /api/tables/:id
 */
export async function deleteTable(tableId: string): Promise<boolean> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const index = tables.findIndex(t => t.id === tableId);
  if (index !== -1) {
    tables.splice(index, 1);
    return true;
  }
  
  return false;
}

/**
 * Toggle table active status
 * 
 * Backend replacement:
 * - PATCH /api/tables/:id/active
 */
export async function toggleTableActive(tableId: string): Promise<Table | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const table = tables.find(t => t.id === tableId);
  if (table) {
    table.active = table.active === false ? true : false;
    return table;
  }
  
  return null;
}

// ============================================
// CATEGORY MANAGEMENT SERVICES (Manager only)
// ============================================

/**
 * Create a new category
 * 
 * Backend replacement:
 * - POST /api/categories
 */
export async function createCategory(categoryName: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (categories.includes(categoryName)) {
    throw new Error('Category already exists');
  }
  
  categories.push(categoryName);
  return categoryName;
}

/**
 * Update a category name
 * 
 * Backend replacement:
 * - PUT /api/categories/:name
 */
export async function updateCategory(oldName: string, newName: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const index = categories.findIndex(cat => cat === oldName);
  if (index === -1) {
    throw new Error('Category not found');
  }
  
  if (categories.includes(newName) && oldName !== newName) {
    throw new Error('Category name already exists');
  }
  
  // Update category name
  categories[index] = newName;
  
  // Update all menu items with this category
  menuItems.forEach(item => {
    if (item.category === oldName) {
      item.category = newName;
    }
  });
  
  return newName;
}

/**
 * Delete a category
 * 
 * Backend replacement:
 * - DELETE /api/categories/:name
 */
export async function deleteCategory(categoryName: string): Promise<boolean> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Check if there are items in this category
  const itemsInCategory = menuItems.filter(item => item.category === categoryName);
  if (itemsInCategory.length > 0) {
    throw new Error(`Cannot delete category with ${itemsInCategory.length} items. Please move or delete items first.`);
  }
  
  const index = categories.findIndex(cat => cat === categoryName);
  if (index !== -1) {
    categories.splice(index, 1);
    return true;
  }
  
  return false;
}
