import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Eye, EyeOff, Package, Tag, FolderPlus } from 'lucide-react';
import type { MenuItem } from '../types';
import * as api from '../services/api';

interface MenuSetupViewProps {
  onMenuUpdate?: () => void;
}

export function MenuSetupView({ onMenuUpdate }: MenuSetupViewProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoryName, setCategoryName] = useState('');
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    image: '',
    description: '',
    available: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [items, cats] = await Promise.all([
      api.getMenuItems(),
      api.getMenuCategories()
    ]);
    setMenuItems(items);
    setCategories(cats);
    // Set default category for form
    if (cats.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: cats[0] }));
    }
  };

  const handleOpenForm = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        price: item.price.toString(),
        image: item.image,
        description: item.description,
        available: item.available !== false,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: categories[0] || '',
        price: '',
        image: '',
        description: '',
        available: true,
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleOpenCategoryForm = (category?: string) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setShowCategoryForm(true);
  };

  const handleCloseCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryName('');
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory, categoryName);
      } else {
        await api.createCategory(categoryName);
      }
      await loadData();
      handleCloseCategoryForm();
    } catch (error: any) {
      alert(error.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (category: string) => {
    try {
      await api.deleteCategory(category);
      await loadData();
      if (selectedCategory === category) {
        setSelectedCategory('all');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemData: MenuItem = {
      id: editingItem?.id || Date.now().toString(),
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      image: formData.image,
      description: formData.description,
      available: formData.available,
    };

    if (editingItem) {
      await api.updateMenuItem(itemData);
    } else {
      await api.createMenuItem(itemData);
    }

    await loadData();
    handleCloseForm();
    onMenuUpdate?.();
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.deleteMenuItem(itemId);
        await loadData();
        onMenuUpdate?.();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item');
      }
    }
  };

  const handleToggleAvailability = async (itemId: string) => {
    try {
      setIsTogglingId(itemId);
      const updatedItem = await api.toggleMenuItemAvailability(itemId);
      await loadData();
      onMenuUpdate?.();
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Failed to update item availability');
    } finally {
      setIsTogglingId(null);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Appetizers':
        return 'bg-green-100 text-green-700';
      case 'Main Courses':
        return 'bg-orange-100 text-orange-700';
      case 'Beverages':
        return 'bg-blue-100 text-blue-700';
      case 'Desserts':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Menu Setup</h1>
          <p className="text-gray-600 text-sm mt-1">Manage menu items and availability</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm ${
            selectedCategory === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-white border border-gray-300 text-gray-700'
          }`}
        >
          All Items ({menuItems.length})
        </button>
        {categories.map((category) => (
          <div key={category} className="relative group">
            <button
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 pr-8 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm ${
                selectedCategory === category
                  ? 'bg-orange-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              {category} ({menuItems.filter(item => item.category === category).length})
            </button>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCategoryForm(category);
                }}
                className="p-1 bg-white hover:bg-gray-100 rounded transition-colors"
                title="Edit category"
              >
                <Edit2 className="w-3 h-3 text-gray-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete category "${category}"?`)) {
                    handleDeleteCategory(category);
                  }
                }}
                className="p-1 bg-white hover:bg-gray-100 rounded transition-colors"
                title="Delete category"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => handleOpenCategoryForm()}
          className="flex items-center space-x-1 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className={`bg-white rounded-xl shadow-sm p-4 border transition-all ${
              item.available === false 
                ? 'border-gray-300 opacity-60' 
                : 'border-gray-100 hover:shadow-md'
            }`}
          >
            <div className="flex items-start space-x-4">
              {/* Image */}
              <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {item.available === false && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <EyeOff className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-orange-600">${item.price.toFixed(2)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleAvailability(item.id);
                    }}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      item.available === false
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {item.available === false ? (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Mark Available</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Mark Unavailable</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenForm(item);
                    }}
                    className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No items found</p>
            <p className="text-gray-400 text-sm mt-2">Click "Add Item" to create a new menu item</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {editingItem ? 'Edit Menu Item' : 'Add New Item'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Caesar Salad"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    placeholder="Brief description of the item"
                    rows={3}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for placeholder image</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Item is available for ordering
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={handleCloseCategoryForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitCategory} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Appetizers"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseCategoryForm}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}