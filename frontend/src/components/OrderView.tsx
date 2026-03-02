import { useState } from 'react';
import { ArrowLeft, Send, Plus, CheckCircle, Clock, ChefHat } from 'lucide-react';
import type { Table, User, OrderItem, Order } from '../types';
import { MenuList } from './MenuList';
import { OrderSummary } from './OrderSummary';
import * as api from '../services/api';

interface OrderViewProps {
  table: Table;
  waiter: User;
  onUpdateTable: (table: Table) => void;
  onBack: () => void;
  onGoToPayment: () => void;
}

export function OrderView({ table, waiter, onUpdateTable, onBack, onGoToPayment }: OrderViewProps) {
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  const handleAddItem = (item: OrderItem) => {
    const existingIndex = currentOrderItems.findIndex(o => o.id === item.id && o.notes === item.notes);
    
    if (existingIndex >= 0) {
      const updated = [...currentOrderItems];
      updated[existingIndex].quantity += item.quantity;
      setCurrentOrderItems(updated);
    } else {
      setCurrentOrderItems([...currentOrderItems, item]);
    }
  };

  const handleUpdateItem = (itemId: string, quantity: number, notes?: string) => {
    if (quantity === 0) {
      setCurrentOrderItems(currentOrderItems.filter(item => item.id !== itemId));
    } else {
      setCurrentOrderItems(currentOrderItems.map(item => 
        item.id === itemId ? { ...item, quantity, notes } : item
      ));
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentOrderItems(currentOrderItems.filter(item => item.id !== itemId));
  };

  const handleSendToKitchen = async () => {
    if (currentOrderItems.length === 0) return;

    try {
      // Create order in backend
      const newOrder: Order = {
        id: `order-${Date.now()}`,
        items: currentOrderItems,
        status: 'pending',
        createdAt: new Date(),
        sentAt: new Date(),
        notes: '',
      };

      const savedOrder = await api.createOrder(table.id, newOrder);

      // Update table with new order
      const updatedTable: Table = {
        ...table,
        status: 'occupied',
        orders: [...table.orders, savedOrder],
        waiterId: waiter.id,
      };

      onUpdateTable(updatedTable);
      setCurrentOrderItems([]);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to send order to kitchen. Please try again.');
    }
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      // Update order status in backend
      const updatedOrder = await api.updateOrderStatus(table.id, orderId, 'delivered');

      if (updatedOrder) {
        const updatedOrders = table.orders.map(order => 
          order.id === orderId ? updatedOrder : order
        );

        const updatedTable: Table = {
          ...table,
          orders: updatedOrders,
        };

        onUpdateTable(updatedTable);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to mark order as delivered. Please try again.');
    }
  };

  const totalCurrentItems = currentOrderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCurrentPrice = currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const allOrdersTotal = table.orders.reduce((sum, order) => {
    return sum + order.items.reduce((orderSum, item) => orderSum + (item.price * item.quantity), 0);
  }, 0);

  const grandTotal = allOrdersTotal + totalCurrentPrice;

  // Check order statuses
  const hasReadyOrders = table.orders.some(order => order.status === 'done');
  const hasPendingOrders = table.orders.some(order => 
    order.status === 'pending' || order.status === 'preparing'
  );
  const allOrdersDelivered = table.orders.length > 0 && 
    table.orders.every(order => order.status === 'delivered');

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'preparing':
        return <ChefHat className="w-3 h-3" />;
      case 'done':
        return <CheckCircle className="w-3 h-3" />;
      case 'delivered':
        return <CheckCircle className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-700';
      case 'done':
        return 'bg-blue-100 text-blue-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">Table {table.number}</h2>
            <p className="text-xs text-gray-600">{table.seats} seats</p>
          </div>
        </div>

        {/* Orders Status */}
        {table.orders.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <h3 className="text-sm font-bold text-gray-700">Orders</h3>
            {table.orders.map((order) => (
              <div key={order.id} className="bg-gray-50 rounded-lg p-3 transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • {formatTime(order.createdAt)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </span>
                </div>
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-700">{item.quantity}x {item.name}</span>
                      <span className="text-gray-600">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                {/* Deliver Button for Done Orders */}
                {order.status === 'done' && (
                  <button
                    onClick={() => handleMarkAsDelivered(order.id)}
                    className="w-full mt-3 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Mark as Delivered</span>
                  </button>
                )}
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-bold text-gray-800">Table Total:</span>
              <span className="text-sm font-bold text-gray-800">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Current Order Section */}
      {!showMenu ? (
        <div className="bg-white rounded-xl shadow-sm p-4 transition-all duration-300">
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            {currentOrderItems.length > 0 ? 'New Items' : 'Add Items'}
          </h3>
          
          <OrderSummary
            orders={currentOrderItems}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />

          <div className="mt-4 space-y-3">
            {currentOrderItems.length > 0 && (
              <div className="flex items-center justify-between text-sm border-t pt-3">
                <span className="text-gray-600">Items:</span>
                <span className="font-semibold text-gray-800">{totalCurrentItems}</span>
              </div>
            )}
            
            <button
              onClick={() => setShowMenu(true)}
              className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Browse Menu</span>
            </button>

            {currentOrderItems.length > 0 && (
              <button
                onClick={handleSendToKitchen}
                className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Add Order (${totalCurrentPrice.toFixed(2)})</span>
              </button>
            )}

            {allOrdersDelivered && !hasPendingOrders && currentOrderItems.length === 0 && (
              <button
                onClick={onGoToPayment}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200"
              >
                Close Table & Payment
              </button>
            )}

            {/* Info Messages */}
            {hasReadyOrders && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg transition-all duration-200">
                <p className="text-xs text-blue-800 font-semibold">
                  ✓ You have orders ready to deliver
                </p>
              </div>
            )}
            
            {hasPendingOrders && !hasReadyOrders && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg transition-all duration-200">
                <p className="text-xs text-yellow-800">
                  Kitchen is preparing your orders...
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-4 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Menu</h3>
            <button
              onClick={() => setShowMenu(false)}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Done
            </button>
          </div>
          
          <MenuList onAddItem={handleAddItem} />

          {/* Current Order Summary - Always Visible in Menu */}
          {currentOrderItems.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-bold text-gray-800 mb-2">Current Order</h4>
              <div className="space-y-2 mb-3">
                {currentOrderItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                    <span className="text-gray-700">{item.quantity}x {item.name}</span>
                    <span className="text-gray-600 font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-3 text-sm font-bold border-t pt-2">
                <span className="text-gray-800">Subtotal ({totalCurrentItems} items):</span>
                <span className="text-orange-600">${totalCurrentPrice.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
              >
                Review Order
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}