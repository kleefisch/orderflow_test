// User & Authentication Types
export interface User {
  id: string;
  name: string;
  username: string;
  role: 'waiter' | 'kitchen' | 'manager';
}

export interface AuthCredentials {
  username: string;
  password: string; // Sent to backend in plain text (over HTTPS in production)
}

// CreateUserDTO includes password for user creation
// Note: Backend should NEVER return password in User responses
export interface CreateUserDTO extends User {
  password: string; // Only used when creating users, never returned by API
}

// Menu & Items Types
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  available?: boolean; // true by default, can be marked as unavailable
}

export interface OrderItem extends MenuItem {
  quantity: number;
  notes?: string;
  menuItemId?: string; // Backend uses this field
  orderId?: string; // Backend includes this in responses
  subtotal?: number; // Backend calculates this
}

// Order Types
export type OrderStatus = 'pending' | 'preparing' | 'done' | 'delivered';

export interface Order {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  notes?: string; // Optional notes for the entire order
  createdAt: Date;
  sentAt?: Date;
  preparingAt?: Date;
  doneAt?: Date;
  deliveredAt?: Date;
}

// Bill Types
export interface Bill {
  id: string;
  tableId: string;
  waiterId: string;
  status: 'open' | 'paid' | 'cancelled';
  subtotal: number;
  tipAmount: number;
  tipPercentage?: number;
  totalAmount: number;
  paymentMethod?: 'credit' | 'debit' | 'cash' | 'pix';
  paymentSplitType?: 'full' | 'equal' | 'custom' | 'items';
  paymentSplitDetails?: string; // JSON string
  openedAt: Date;
  closedAt?: Date;
  orders: Order[];
}

// Table Types
export interface Table {
  id: string;
  number: number;
  seats: number;
  status: 'available' | 'occupied' | 'reserved';
  orders: Order[];
  billId?: string;
  waiterId?: string;
  active?: boolean; // true by default, can be deactivated
}

// View & Navigation Types
export type ViewType = 'tables' | 'order' | 'payment';
export type TabType = 'tables' | 'kitchen' | 'dashboard' | 'users' | 'menu-setup' | 'table-setup';