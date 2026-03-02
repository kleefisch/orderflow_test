import { useState } from 'react';
import { Minus, Plus, Trash2, MessageSquare } from 'lucide-react';
import type { OrderItem } from '../types';

interface OrderCartProps {
  orders: OrderItem[];
  onUpdateItem: (itemId: string, quantity: number, notes?: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export function OrderCart({ orders, onUpdateItem, onRemoveItem }: OrderCartProps) {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const handleIncrement = (item: OrderItem) => {
    onUpdateItem(item.id, item.quantity + 1, item.notes);
  };

  const handleDecrement = (item: OrderItem) => {
    if (item.quantity > 1) {
      onUpdateItem(item.id, item.quantity - 1, item.notes);
    }
  };

  const handleStartEditNotes = (item: OrderItem) => {
    setEditingNotes(item.id);
    setNoteText(item.notes || '');
  };

  const handleSaveNotes = (item: OrderItem) => {
    onUpdateItem(item.id, item.quantity, noteText.trim() || undefined);
    setEditingNotes(null);
    setNoteText('');
  };

  const handleCancelNotes = () => {
    setEditingNotes(null);
    setNoteText('');
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
          <MessageSquare className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">No items in order</p>
        <p className="text-xs text-gray-400 mt-1">Add items from menu</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((item, index) => (
        <div
          key={`${item.id}-${index}`}
          className="bg-gray-50 rounded-lg p-3 space-y-2"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h4>
              <p className="text-sm text-orange-600">
                ${item.price.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => onRemoveItem(item.id)}
              className="text-red-500 hover:text-red-700 p-1 ml-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDecrement(item)}
                className="w-7 h-7 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300"
              >
                <Minus className="w-3 h-3 text-gray-600" />
              </button>
              <span className="w-10 text-center font-semibold text-gray-800 text-sm">
                {item.quantity}
              </span>
              <button
                onClick={() => handleIncrement(item)}
                className="w-7 h-7 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300"
              >
                <Plus className="w-3 h-3 text-gray-600" />
              </button>
            </div>
            <span className="font-bold text-gray-800 text-sm">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>

          {/* Notes Section */}
          {editingNotes === item.id ? (
            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. no onions, well done..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={2}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSaveNotes(item)}
                  className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelNotes}
                  className="flex-1 px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {item.notes ? (
                <div
                  onClick={() => handleStartEditNotes(item)}
                  className="bg-white px-3 py-2 rounded-lg text-xs text-gray-600 cursor-pointer hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>{item.notes}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleStartEditNotes(item)}
                  className="flex items-center space-x-1 text-xs text-orange-600 hover:text-orange-700"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Add note</span>
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}