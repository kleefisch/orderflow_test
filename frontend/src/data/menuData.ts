import type { MenuItem } from '../types';

export const MENU_ITEMS: MenuItem[] = [
  // Appetizers
  {
    id: '1',
    name: 'Caesar Salad',
    category: 'Appetizers',
    price: 28.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%2381C784" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3ECaesar Salad%3C/text%3E%3C/svg%3E',
    description: 'Romaine lettuce, croutons, parmesan and caesar dressing'
  },
  {
    id: '2',
    name: 'Bruschetta',
    category: 'Appetizers',
    price: 24.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23A5D6A7" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3EBruschetta%3C/text%3E%3C/svg%3E',
    description: 'Italian bread, fresh tomato, basil and olive oil'
  },
  {
    id: '3',
    name: 'Sushi Platter',
    category: 'Appetizers',
    price: 45.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%2366BB6A" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3ESushi Platter%3C/text%3E%3C/svg%3E',
    description: '12 pieces of assorted sushi and sashimi'
  },

  // Main Courses
  {
    id: '4',
    name: 'Grilled Steak',
    category: 'Main Courses',
    price: 89.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23EF5350" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3EGrilled Steak%3C/text%3E%3C/svg%3E',
    description: 'Grilled filet mignon with potatoes and vegetables'
  },
  {
    id: '5',
    name: 'Artisan Burger',
    category: 'Main Courses',
    price: 52.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23F4511E" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3EArtisan Burger%3C/text%3E%3C/svg%3E',
    description: '180g burger, cheese, bacon, lettuce and tomato'
  },
  {
    id: '6',
    name: 'Pasta Carbonara',
    category: 'Main Courses',
    price: 48.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23FF7043" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3EPasta Carbonara%3C/text%3E%3C/svg%3E',
    description: 'Fresh pasta with creamy sauce, bacon and parmesan'
  },
  {
    id: '7',
    name: 'Pizza Margherita',
    category: 'Main Courses',
    price: 42.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23FF5722" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3EPizza Margherita%3C/text%3E%3C/svg%3E',
    description: 'Tomato sauce, mozzarella, basil and olive oil'
  },

  // Beverages
  {
    id: '8',
    name: 'Espresso Coffee',
    category: 'Beverages',
    price: 8.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%236D4C41" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="28" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3EEspresso Coffee%3C/text%3E%3C/svg%3E',
    description: 'Traditional espresso coffee'
  },
  {
    id: '9',
    name: 'Orange Juice',
    category: 'Beverages',
    price: 12.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23FFA726" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3EOrange Juice%3C/text%3E%3C/svg%3E',
    description: 'Fresh orange juice 300ml'
  },
  {
    id: '10',
    name: 'Soda',
    category: 'Beverages',
    price: 8.00,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%2342A5F5" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3ESoda%3C/text%3E%3C/svg%3E',
    description: 'Soda can 350ml'
  },
  {
    id: '11',
    name: 'House Cocktail',
    category: 'Beverages',
    price: 28.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23AB47BC" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3EHouse Cocktail%3C/text%3E%3C/svg%3E',
    description: 'Special house cocktail'
  },

  // Desserts
  {
    id: '12',
    name: 'Tiramisu',
    category: 'Desserts',
    price: 24.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23D4A373" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3ETiramisu%3C/text%3E%3C/svg%3E',
    description: 'Italian dessert with coffee and mascarpone'
  },
  {
    id: '13',
    name: 'Lava Cake',
    category: 'Desserts',
    price: 28.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%238D6E63" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="white" text-anchor="middle" dy=".3em" font-family="Arial"%3ELava Cake%3C/text%3E%3C/svg%3E',
    description: 'Warm chocolate cake with ice cream'
  },
  {
    id: '14',
    name: 'Cheesecake',
    category: 'Desserts',
    price: 22.90,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23FFEB3B" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="%23333" text-anchor="middle" dy=".3em" font-family="Arial"%3ECheesecake%3C/text%3E%3C/svg%3E',
    description: 'Creamy cheesecake with berry sauce'
  },
];

export const CATEGORIES = ['Appetizers', 'Main Courses', 'Beverages', 'Desserts'];