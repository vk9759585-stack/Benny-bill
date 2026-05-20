export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  priceAtOrder: number;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  guestCount: number;
  currentOrder: OrderItem[];
  notes?: string;
  reservationName?: string;
  reservationTime?: string;
  guestName?: string;
  size?: 'small' | 'medium' | 'large';
  shape?: 'square' | 'circle' | 'rectangle' | 'line';
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Appetizers' | 'Main Course' | 'Desserts' | 'Drinks';
  emoji: string;
  description: string;
  inStock: boolean;
}

export interface PastOrder {
  id: string;
  tableNumber: number;
  guestCount: number;
  guestName?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  serviceCharge: number;
  tax: number;
  total: number;
  timestamp: string; // ISO string or simple time
  paymentMethod?: 'UPI' | 'Cash' | 'Card';
}

export interface StaffUser {
  id: string;
  name: string;
  role: 'Host' | 'Manager' | 'Server' | 'Admin' | 'Billing Cashier' | 'Cashier';
  pin: string;
  avatarUrl: string;
  email?: string;
}

