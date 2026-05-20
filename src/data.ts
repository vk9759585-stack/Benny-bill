import { Table, MenuItem, PastOrder } from './types';

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Salmon Carpaccio',
    price: 18.5,
    category: 'Appetizers',
    emoji: '🍣',
    description: 'Thinly sliced wild salmon with capers, red onions, microgreens, and lemon infused olive oil.',
    inStock: true,
  },
  {
    id: 'm2',
    name: 'Truffle Parmesan Fries',
    price: 12.0,
    category: 'Appetizers',
    emoji: '🍟',
    description: 'Double fried golden potatoes tossed in white truffle oil, grated Parmigiano-Reggiano, and fresh parsley.',
    inStock: true,
  },
  {
    id: 'm3',
    name: 'Crispy Pepper Calamari',
    price: 15.5,
    category: 'Appetizers',
    emoji: '🦑',
    description: 'Lightly battered calamari seasoned with toasted black pepper, served with a citrus garlic aioli.',
    inStock: true,
  },
  {
    id: 'm4',
    name: 'Prime Ribeye Steak',
    price: 42.0,
    category: 'Main Course',
    emoji: '🥩',
    description: '14oz USDA Prime bone-in ribeye, pan-seared with rosemary garlic butter, served with asparagus.',
    inStock: true,
  },
  {
    id: 'm5',
    name: 'Pan-Seared Sea Bass',
    price: 36.0,
    category: 'Main Course',
    emoji: '🐟',
    description: 'Crispy skin Chilean sea bass sitting on a bed of ginger-soy infused baby bok choy and jasmine rice.',
    inStock: true,
  },
  {
    id: 'm6',
    name: 'Wild Mushroom Risotto',
    price: 28.0,
    category: 'Main Course',
    emoji: '🍄',
    description: 'Creamy Arborio rice slow-cooked with a forest mushroom medley, black truffle paste, and shaved parmesan.',
    inStock: true,
  },
  {
    id: 'm7',
    name: 'Wagyu Butter Burger',
    price: 24.0,
    category: 'Main Course',
    emoji: '🍔',
    description: 'Aged Wagyu beef patty, molten cheddar, caramelized balsamic onions, and house burger sauce on brioche.',
    inStock: true,
  },
  {
    id: 'm8',
    name: 'Chocolate Molten Lava Cake',
    price: 12.5,
    category: 'Desserts',
    emoji: '🍫',
    description: 'Rich dark chocolate cake with a warm liquid chocolate center, served with Madagascan vanilla gelato.',
    inStock: true,
  },
  {
    id: 'm9',
    name: 'Golden Vanilla Crème Brûlée',
    price: 11.0,
    category: 'Desserts',
    emoji: '🍮',
    description: 'Velvety vanilla bean custard topped with a shatteringly crisp layer of caramelized turbinado sugar.',
    inStock: true,
  },
  {
    id: 'm10',
    name: 'Artisan Gelato Trio',
    price: 9.5,
    category: 'Desserts',
    emoji: '🍨',
    description: 'Three scoops of handcrafted organic gelato: Pistachio, Salted Caramel, and Tahitian Vanilla.',
    inStock: true,
  },
  {
    id: 'm11',
    name: 'Matcha Espresso Latte',
    price: 6.5,
    category: 'Drinks',
    emoji: '🍵',
    description: 'Whisked ceremonial-grade Kyoto matcha paired with cream and a double shot of dark espresso.',
    inStock: true,
  },
  {
    id: 'm12',
    name: 'Smoked Rosemary Old Fashioned',
    price: 16.0,
    category: 'Drinks',
    emoji: '🥃',
    description: 'Premium rye whiskey, bitters, orange peel, sweet demerara syrup, smoked with organic rosemary stalks.',
    inStock: true,
  },
  {
    id: 'm13',
    name: 'Fresh Strawberry Lemonade',
    price: 7.5,
    category: 'Drinks',
    emoji: '🍓',
    description: 'Muddled organic strawberries, fresh-squeezed yellow lemon juice, pure cane sugar, and sparkling mineral water.',
    inStock: true,
  },
  {
    id: 'm14',
    name: 'Imperial Jasmine Green Tea',
    price: 5.0,
    category: 'Drinks',
    emoji: '🫖',
    description: 'Loose leaf green tea scented with fresh jasmine blossoms, brewed in a traditional ceramic teapot.',
    inStock: true,
  }
];

export const DEFAULT_TABLES: Table[] = [
  {
    id: 't1',
    number: 1,
    capacity: 2,
    status: 'occupied',
    guestCount: 2,
    currentOrder: [
      { menuItemId: 'm7', name: 'Wagyu Butter Burger', quantity: 2, priceAtOrder: 24.0 },
      { menuItemId: 'm2', name: 'Truffle Parmesan Fries', quantity: 1, priceAtOrder: 12.0 },
      { menuItemId: 'm11', name: 'Matcha Espresso Latte', quantity: 1, priceAtOrder: 6.5 },
      { menuItemId: 'm13', name: 'Fresh Strawberry Lemonade', quantity: 1, priceAtOrder: 7.5 }
    ],
    notes: 'Table requested window seating. Medium well on one burger.',
    size: 'medium',
    shape: 'square'
  },
  {
    id: 't2',
    number: 2,
    capacity: 4,
    status: 'available',
    guestCount: 0,
    currentOrder: [],
    size: 'medium',
    shape: 'square'
  },
  {
    id: 't3',
    number: 3,
    capacity: 6,
    status: 'reserved',
    guestCount: 0,
    currentOrder: [],
    reservationName: 'Mr. Henderson',
    reservationTime: '19:30',
    notes: 'Birthday celebration. Prefers quiet corner.',
    size: 'medium',
    shape: 'square'
  },
  {
    id: 't4',
    number: 4,
    capacity: 4,
    status: 'available',
    guestCount: 0,
    currentOrder: [],
    size: 'medium',
    shape: 'square'
  },
  {
    id: 't5',
    number: 5,
    capacity: 2,
    status: 'occupied',
    guestCount: 1,
    currentOrder: [
      { menuItemId: 'm1', name: 'Salmon Carpaccio', quantity: 1, priceAtOrder: 18.5 },
      { menuItemId: 'm12', name: 'Smoked Rosemary Old Fashioned', quantity: 2, priceAtOrder: 16.0 }
    ],
    notes: 'Regular guest. Allergy to walnuts.',
    size: 'small',
    shape: 'circle'
  },
  {
    id: 't6',
    number: 6,
    capacity: 8,
    status: 'available',
    guestCount: 0,
    currentOrder: [],
    size: 'large',
    shape: 'rectangle'
  },
  {
    id: 't7',
    number: 7,
    capacity: 4,
    status: 'available',
    guestCount: 0,
    currentOrder: [],
    size: 'medium',
    shape: 'line'
  },
  {
    id: 't8',
    number: 8,
    capacity: 2,
    status: 'reserved',
    guestCount: 0,
    currentOrder: [],
    reservationName: 'Elena Rostova',
    reservationTime: '20:00',
    size: 'small',
    shape: 'circle'
  }
];

export const SEED_PAST_ORDERS: PastOrder[] = [
  {
    id: 'po1',
    tableNumber: 4,
    guestCount: 4,
    items: [
      { name: 'Prime Ribeye Steak', quantity: 2, price: 42.0 },
      { name: 'Wild Mushroom Risotto', quantity: 2, price: 28.0 },
      { name: 'Smoked Rosemary Old Fashioned', quantity: 4, price: 16.0 },
      { name: 'Chocolate Molten Lava Cake', quantity: 2, price: 12.5 }
    ],
    subtotal: 229.0,
    serviceCharge: 22.9,
    tax: 18.32,
    total: 270.22,
    timestamp: '2026-05-20T12:45:00Z'
  },
  {
    id: 'po2',
    tableNumber: 2,
    guestCount: 2,
    items: [
      { name: 'Crispy Pepper Calamari', quantity: 1, price: 15.5 },
      { name: 'Pan-Seared Sea Bass', quantity: 2, price: 36.0 },
      { name: 'Fresh Strawberry Lemonade', quantity: 2, price: 7.5 }
    ],
    subtotal: 102.5,
    serviceCharge: 10.25,
    tax: 8.2,
    total: 120.95,
    timestamp: '2026-05-20T14:12:00Z'
  },
  {
    id: 'po3',
    tableNumber: 1,
    guestCount: 3,
    items: [
      { name: 'Truffle Parmesan Fries', quantity: 2, price: 12.0 },
      { name: 'Wagyu Butter Burger', quantity: 3, price: 24.0 },
      { name: 'Golden Vanilla Crème Brûlée', quantity: 1, price: 11.0 }
    ],
    subtotal: 107.0,
    serviceCharge: 10.7,
    tax: 8.56,
    total: 126.26,
    timestamp: '2026-05-20T15:30:00Z'
  }
];
