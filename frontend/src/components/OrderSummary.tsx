import { Minus, Plus, Trash2 } from 'lucide-react';
import type { OrderItem } from '../types';

interface OrderSummaryProps {
  orders: OrderItem[];
  onUpdateItem: (itemId: string, quantity: number, notes?: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export function OrderSummary({ orders, onUpdateItem, onRemoveItem }: OrderSummaryProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No items added yet</p>
        <p className="text-xs mt-1">Browse the menu to add items</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((item) => (
        <div key={item.id} className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="font-semibold text-gray-800 text-sm">{item.name}</div>
              <div className="text-xs text-gray-600">${item.price.toFixed(2)} each</div>
              {item.notes && (
                <div className="text-xs text-orange-600 italic mt-1">
                  Note: {item.notes}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateItem(item.id, item.quantity - 1, item.notes)}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                disabled={item.quantity <= 1}
              >
                <Minus className="w-4 h-4 text-gray-700" />
              </button>
              <span className="w-8 text-center font-semibold text-gray-800">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateItem(item.id, item.quantity + 1, item.notes)}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            <button
              onClick={() => onRemoveItem(item.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
