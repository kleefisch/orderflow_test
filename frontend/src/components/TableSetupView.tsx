import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Users, UtensilsCrossed, Power, PowerOff } from 'lucide-react';
import type { Table } from '../types';
import * as api from '../services/api';

interface TableSetupViewProps {
  onTableUpdate?: () => void;
}

export function TableSetupView({ onTableUpdate }: TableSetupViewProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [formData, setFormData] = useState({
    number: '',
    seats: '',
    active: true,
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    const allTables = await api.getTables();
    setTables(allTables);
  };

  const handleOpenForm = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        number: table.number.toString(),
        seats: table.seats.toString(),
        active: table.active !== false,
      });
    } else {
      setEditingTable(null);
      // Find next available table number
      const maxNumber = tables.reduce((max, t) => Math.max(max, t.number), 0);
      setFormData({
        number: (maxNumber + 1).toString(),
        seats: '4',
        active: true,
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTable(null);
    setFormData({
      number: '',
      seats: '',
      active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if table number already exists (excluding current table when editing)
    const numberExists = tables.some(
      t => t.number === parseInt(formData.number) && t.id !== editingTable?.id
    );

    if (numberExists) {
      alert(`Table number ${formData.number} already exists!`);
      return;
    }

    const tableData: Table = {
      id: editingTable?.id || Date.now().toString(),
      number: parseInt(formData.number),
      seats: parseInt(formData.seats),
      status: editingTable?.status || 'available',
      orders: editingTable?.orders || [],
      waiterId: editingTable?.waiterId,
      active: formData.active,
    };

    if (editingTable) {
      await api.updateTable(tableData);
    } else {
      await api.createTable(tableData);
    }

    await loadTables();
    handleCloseForm();
    onTableUpdate?.();
  };

  const handleDelete = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    
    if (table?.orders && table.orders.length > 0) {
      alert('Cannot delete a table with active orders!');
      return;
    }

    if (window.confirm(`Are you sure you want to delete Table ${table?.number}?`)) {
      await api.deleteTable(tableId);
      await loadTables();
      onTableUpdate?.();
    }
  };

  const handleToggleActive = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    
    if (table?.orders && table.orders.length > 0 && table.active !== false) {
      alert('Cannot deactivate a table with active orders!');
      return;
    }

    await api.toggleTableActive(tableId);
    await loadTables();
    onTableUpdate?.();
  };

  const sortedTables = [...tables].sort((a, b) => a.number - b.number);

  const filteredTables = sortedTables.filter(table => {
    if (filterStatus === 'active') return table.active !== false;
    if (filterStatus === 'inactive') return table.active === false;
    return true;
  });

  const activeCount = tables.filter(t => t.active !== false).length;
  const inactiveCount = tables.filter(t => t.active === false).length;

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'occupied':
        return 'bg-red-100 text-red-700';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusText = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'reserved':
        return 'Reserved';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Table Setup</h1>
          <p className="text-gray-600 text-sm mt-1">Manage restaurant tables and capacity</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Table</span>
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm ${
            filterStatus === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-white border border-gray-300 text-gray-700'
          }`}
        >
          All Tables ({tables.length})
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm ${
            filterStatus === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilterStatus('inactive')}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm ${
            filterStatus === 'inactive'
              ? 'bg-gray-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700'
          }`}
        >
          Inactive ({inactiveCount})
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map(table => (
          <div
            key={table.id}
            className={`bg-white rounded-xl shadow-sm p-5 border transition-all ${
              table.active === false 
                ? 'border-gray-300 opacity-60' 
                : 'border-gray-100 hover:shadow-md'
            }`}
          >
            {/* Table Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  table.active === false 
                    ? 'bg-gray-100' 
                    : table.status === 'available' 
                    ? 'bg-green-100' 
                    : table.status === 'occupied'
                    ? 'bg-red-100'
                    : 'bg-yellow-100'
                }`}>
                  <UtensilsCrossed className={`w-6 h-6 ${
                    table.active === false 
                      ? 'text-gray-400' 
                      : table.status === 'available' 
                      ? 'text-green-600' 
                      : table.status === 'occupied'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Table {table.number}</h3>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Users className="w-3 h-3" />
                    <span>{table.seats} seats</span>
                  </div>
                </div>
              </div>
              {table.active === false && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-600">
                  <PowerOff className="w-3 h-3" />
                  <span>Inactive</span>
                </div>
              )}
            </div>

            {/* Table Status */}
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(table.status)}`}>
                {getStatusText(table.status)}
              </span>
              {table.orders && table.orders.length > 0 && (
                <span className="ml-2 text-xs text-gray-600">
                  • {table.orders.length} {table.orders.length === 1 ? 'order' : 'orders'}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleToggleActive(table.id)}
                className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  table.active === false
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={table.orders && table.orders.length > 0 && table.active !== false}
              >
                {table.active === false ? (
                  <>
                    <Power className="w-3 h-3" />
                    <span>Activate</span>
                  </>
                ) : (
                  <>
                    <PowerOff className="w-3 h-3" />
                    <span>Deactivate</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleOpenForm(table)}
                className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(table.id)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                disabled={table.orders && table.orders.length > 0}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredTables.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
            <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No tables found</p>
            <p className="text-gray-400 text-sm mt-2">Click "Add Table" to create a new table</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">
                {editingTable ? `Edit Table ${editingTable.number}` : 'Add New Table'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Table Number *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., 1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Must be unique</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Seats *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., 4"
                  required
                />
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Table is active and available for use
                  </span>
                </label>
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
                  {editingTable ? 'Save Changes' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
