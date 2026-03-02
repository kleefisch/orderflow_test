import { BarChart3, Users, UtensilsCrossed, DollarSign, TrendingUp, Package } from 'lucide-react';
import type { Table } from '../types';

interface DashboardViewProps {
  tables: Table[];
}

export function DashboardView({ tables }: DashboardViewProps) {
  // Calculate metrics
  const totalTables = tables.length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const availableTables = tables.filter(t => t.status === 'available').length;
  const reservedTables = tables.filter(t => t.status === 'reserved').length;
  
  const totalOrders = tables.reduce((sum, table) => sum + table.orders.length, 0);
  const pendingOrders = tables.reduce((sum, table) => 
    sum + table.orders.filter(o => o.status === 'pending').length, 0
  );
  const preparingOrders = tables.reduce((sum, table) => 
    sum + table.orders.filter(o => o.status === 'preparing').length, 0
  );
  const readyOrders = tables.reduce((sum, table) => 
    sum + table.orders.filter(o => o.status === 'ready').length, 0
  );

  // Calculate total revenue from all orders
  const totalRevenue = tables.reduce((sum, table) => {
    return sum + table.orders.reduce((orderSum, order) => {
      return orderSum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity);
      }, 0);
    }, 0);
  }, 0);

  const totalItems = tables.reduce((sum, table) => {
    return sum + table.orders.reduce((orderSum, order) => {
      return orderSum + order.items.reduce((itemSum, item) => {
        return itemSum + item.quantity;
      }, 0);
    }, 0);
  }, 0);

  const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

  const metrics = [
    {
      title: 'Revenue Today',
      value: `R$ ${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
      trend: '+12%',
    },
    {
      title: 'Active Orders',
      value: totalOrders.toString(),
      icon: Package,
      color: 'bg-blue-500',
      trend: `${pendingOrders + preparingOrders} in progress`,
    },
    {
      title: 'Table Occupancy',
      value: `${occupancyRate}%`,
      icon: UtensilsCrossed,
      color: 'bg-orange-500',
      trend: `${occupiedTables}/${totalTables} occupied`,
    },
    {
      title: 'Items Sold',
      value: totalItems.toString(),
      icon: TrendingUp,
      color: 'bg-purple-500',
      trend: 'Today',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-medium mb-1">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-800 mb-2">{metric.value}</p>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">{metric.trend}</span>
                </div>
              </div>
              <div className={`${metric.color} p-3 rounded-lg`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tables Overview */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <UtensilsCrossed className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-800">Tables Overview</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-green-600">{availableTables}</span>
            </div>
            <p className="text-sm text-gray-600">Available</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-red-600">{occupiedTables}</span>
            </div>
            <p className="text-sm text-gray-600">Occupied</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-blue-600">{reservedTables}</span>
            </div>
            <p className="text-sm text-gray-600">Reserved</p>
          </div>
        </div>
      </div>

      {/* Orders Status */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <Package className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-800">Orders Status</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{pendingOrders}</p>
            <p className="text-xs text-gray-600 mt-1">Pending</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{preparingOrders}</p>
            <p className="text-xs text-gray-600 mt-1">Preparing</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{readyOrders}</p>
            <p className="text-xs text-gray-600 mt-1">Ready</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-600">{totalOrders}</p>
            <p className="text-xs text-gray-600 mt-1">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}