import { useState, useEffect } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import type { MenuItem, OrderItem } from '../types';
import * as api from '../services/api';

interface MenuListProps {
  onAddItem: (item: OrderItem) => void;
}

export function MenuList({ onAddItem }: MenuListProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [items, cats] = await Promise.all([
      api.getMenuItems(),
      api.getMenuCategories()
    ]);
    // Filter only available items for ordering
    setMenuItems(items.filter(item => item.available !== false));
    setCategories(cats);
    if (cats.length > 0 && !selectedCategory) {
      setSelectedCategory(cats[0]);
    }
  };

  const filteredItems = menuItems.filter(item => item.category === selectedCategory);

  const handleOpenItemDialog = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setNotes('');
    // Trigger animation
    setTimeout(() => setIsAnimating(true), 10);
  };

  const handleAddToOrder = () => {
    if (!selectedItem) return;
    
    const orderItem: OrderItem = {
      ...selectedItem,
      quantity,
      notes: notes.trim() || undefined,
    };
    onAddItem(orderItem);
    handleCancel();
  };

  const handleCancel = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setSelectedItem(null);
      setQuantity(1);
      setNotes('');
    }, 300);
  };

  return (
    <div>
      {/* Category Tabs */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm flex-shrink-0 ${
              selectedCategory === category
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Menu Items Grid - Mobile First */}
      <div className="grid grid-cols-1 gap-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow flex"
          >
            <div className="relative w-24 h-24 flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
              <div>
                <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{item.description}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-base font-bold text-orange-600">
                  ${item.price.toFixed(2)}
                </span>
                <button
                  onClick={() => handleOpenItemDialog(item)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg font-semibold transition-all text-sm bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Item Dialog */}
      {selectedItem && (
        <div 
          className={`fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-opacity duration-300 ${
            isAnimating ? 'bg-black/40' : 'bg-black/0'
          }`}
          onClick={handleCancel}
        >
          <div 
            className={`bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out ${
              isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-8 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{selectedItem.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedItem.description}</p>
                  <p className="text-xl font-bold text-orange-600 mt-2">
                    ${selectedItem.price.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Image */}
              <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Quantity Selector */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center border border-gray-300 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-2xl font-bold text-gray-800 w-16 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. no onions, well done..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToOrder}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Add to Order
                </button>
              </div>

              {/* Total Preview */}
              <div className="mt-3 p-3 bg-orange-50 rounded-lg flex justify-between items-center">
                <span className="text-sm text-gray-700">Total:</span>
                <span className="text-lg font-bold text-orange-600">
                  ${(selectedItem.price * quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}