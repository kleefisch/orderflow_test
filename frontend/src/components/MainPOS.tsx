import { useState, useEffect } from 'react';
import { LogOut, UtensilsCrossed, ChefHat, LayoutDashboard, Users, Package, Settings, Moon, Sun } from 'lucide-react';
import type { User, Table, ViewType, TabType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { OrderFlowLogo } from './OrderFlowLogo';
import { TablesView } from './TablesView';
import { OrderView } from './OrderView';
import { PaymentView } from './PaymentView';
import { KitchenView } from './KitchenView';
import { DashboardView } from './DashboardView';
import { UserManagementView } from './UserManagementView';
import { MenuSetupView } from './MenuSetupView';
import { TableSetupView } from './TableSetupView';
import * as api from '../services/api';

export function MainPOS() {
  const { user, role, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  if (!user || !role) return null;
  const [currentView, setCurrentView] = useState<ViewType>('tables');
  const [activeTab, setActiveTab] = useState<TabType>(role === 'manager' ? 'dashboard' : 'tables');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const [loadedTables, loadedUsers] = await Promise.all([
        api.getTables(),
        api.getUsers()
      ]);
      setTables(loadedTables);
      setUsers(loadedUsers);
    };
    
    loadData();
  }, []);

  // Kitchen users get their dedicated view with its own header
  if (role === 'kitchen') {
    return <KitchenView tables={tables} onUpdateTables={setTables} />
  }

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setCurrentView('order');
  };

  const handleUpdateTable = async (updatedTable: Table) => {
    try {
      // Persist to backend
      const savedTable = await api.updateTable(updatedTable);
      // Update local state with response from backend
      setTables(tables.map(t => t.id === savedTable.id ? savedTable : t));
      setSelectedTable(savedTable);
    } catch (error) {
      console.error('Failed to update table:', error);
      alert('Failed to update table. Please try again.');
    }
  };

  const handleBackToTables = () => {
    setCurrentView('tables');
    setSelectedTable(null);
  };

  const handleGoToPayment = () => {
    setCurrentView('payment');
  };

  const handleCompletePayment = async () => {
    // Payment is already processed by PaymentView component
    // Just refresh tables and navigate back
    try {
      const updatedTables = await api.getTables();
      setTables(updatedTables);
    } catch (error) {
      console.error('Failed to refresh tables:', error);
    }
    setCurrentView('tables');
    setSelectedTable(null);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'tables') {
      setCurrentView('tables');
      setSelectedTable(null);
    }
  };

  // Count pending orders for badge
  const pendingOrdersCount = tables.reduce((total, table) => {
    return total + table.orders.filter(order => 
      order.status === 'pending' || order.status === 'preparing'
    ).length;
  }, 0);

  // Determine if bottom nav should be shown
  const showBottomNav = currentView === 'tables' || activeTab === 'kitchen' || activeTab === 'dashboard' || activeTab === 'users' || activeTab === 'menu-setup' || activeTab === 'table-setup';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20"> {/* Added pb-20 for bottom nav space */}
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <OrderFlowLogo size="md" />
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{role}</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm border border-gray-300 dark:border-gray-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {activeTab === 'tables' && currentView === 'tables' && (
          <TablesView
            tables={tables}
            waiter={user}
            users={users}
            onTableSelect={handleTableSelect}
            onUpdateTable={handleUpdateTable}
          />
        )}

        {activeTab === 'kitchen' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Kitchen Queue</h2>
            {/* Kitchen Orders Display - Simplified for Waiters */}
            {tables.filter(t => t.orders.length > 0).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No active orders</p>
                <p className="text-gray-400 text-sm mt-2">Orders will appear here when sent to kitchen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tables
                  .filter(table => table.orders.length > 0)
                  .map(table => (
                    <div key={table.id}>
                      {table.orders.map(order => (
                        <div
                          key={order.id}
                          className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${
                            order.status === 'pending' ? 'border-l-red-500' :
                            order.status === 'preparing' ? 'border-l-yellow-500' :
                            order.status === 'done' ? 'border-l-green-500' :
                            'border-l-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-lg font-bold text-gray-800">
                              Table {table.number}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                              order.status === 'pending' ? 'bg-red-100 text-red-700' :
                              order.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                              order.status === 'done' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.status === 'pending' ? 'Pending' :
                               order.status === 'preparing' ? 'Preparing' :
                               order.status === 'done' ? 'Done' : 'Delivered'}
                            </span>
                          </div>

                          <div className="space-y-1.5 mb-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-sm text-gray-700">
                                <span className="font-semibold">{item.quantity}x</span> {item.name}
                                {item.notes && (
                                  <span className="text-orange-600 italic ml-2">
                                    • {item.notes}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Only show action button when done */}
                          {order.status === 'done' && (
                            <button
                              onClick={() => {
                                const updatedOrders = table.orders.map(o =>
                                  o.id === order.id ? { ...o, status: 'delivered' as const, deliveredAt: new Date() } : o
                                );
                                handleUpdateTable({ ...table, orders: updatedOrders });
                              }}
                              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors"
                            >
                              Mark as Delivered
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'dashboard' && (
          <DashboardView tables={tables} />
        )}
        
        {activeTab === 'users' && (
          <UserManagementView
            users={users}
            onUpdateUsers={setUsers}
          />
        )}
        
        {activeTab === 'menu-setup' && (
          <MenuSetupView />
        )}
        
        {activeTab === 'table-setup' && (
          <TableSetupView />
        )}
        
        {currentView === 'order' && selectedTable && (
          <OrderView
            table={selectedTable}
            waiter={user}
            onUpdateTable={handleUpdateTable}
            onBack={handleBackToTables}
            onGoToPayment={handleGoToPayment}
          />
        )}

        {currentView === 'payment' && selectedTable && (
          <PaymentView
            table={selectedTable}
            onBack={() => setCurrentView('order')}
            onComplete={handleCompletePayment}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-20">
          <div className="flex justify-around py-2 px-1">
            {role === 'manager' ? (
              <>
                <button
                  className={`flex flex-col items-center space-y-0.5 transition-colors py-1 px-2 rounded-lg ${
                    activeTab === 'dashboard' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange('dashboard')}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Dashboard</span>
                </button>
                <button
                  className={`flex flex-col items-center space-y-0.5 transition-colors py-1 px-2 rounded-lg ${
                    activeTab === 'users' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange('users')}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Users</span>
                </button>
                <button
                  className={`flex flex-col items-center space-y-0.5 transition-colors py-1 px-2 rounded-lg ${
                    activeTab === 'tables' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange('tables')}
                >
                  <UtensilsCrossed className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Tables</span>
                </button>
                <button
                  className={`flex flex-col items-center space-y-0.5 transition-colors py-1 px-2 rounded-lg ${
                    activeTab === 'menu-setup' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange('menu-setup')}
                >
                  <Package className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Menu</span>
                </button>
                <button
                  className={`flex flex-col items-center space-y-0.5 transition-colors py-1 px-2 rounded-lg ${
                    activeTab === 'table-setup' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange('table-setup')}
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Setup</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className={`flex flex-col items-center space-y-1 transition-colors ${
                    activeTab === 'tables' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange('tables')}
                >
                  <UtensilsCrossed className="w-6 h-6" />
                  <span className="text-xs font-semibold">Tables</span>
                </button>
                <button
                  className={`flex flex-col items-center space-y-1 relative transition-colors ${
                    activeTab === 'kitchen' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => handleTabChange('kitchen')}
                >
                  <div className="relative">
                    <ChefHat className="w-6 h-6" />
                    {pendingOrdersCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {pendingOrdersCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold">Kitchen</span>
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}