import { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, User, X, UserCheck, CalendarClock, Unlock } from 'lucide-react';
import type { Table, User as UserType } from '../types';
import * as api from '../services/api';

interface TablesViewProps {
  tables: Table[];
  waiter: UserType;
  users: UserType[];
  onTableSelect: (table: Table) => void;
  onUpdateTable: (table: Table) => void;
}

type FilterStatus = 'all' | 'available' | 'occupied' | 'reserved';

export function TablesView({ tables, waiter, users, onTableSelect, onUpdateTable }: TablesViewProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedTableForAction, setSelectedTableForAction] = useState<Table | null>(null);

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 hover:bg-green-200';
      case 'occupied':
        return 'bg-red-100 border-red-300 hover:bg-red-200';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200';
    }
  };

  const getStatusIcon = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'occupied':
        return <Users className="w-4 h-4 text-red-600" />;
      case 'reserved':
        return <Clock className="w-4 h-4 text-yellow-600" />;
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

  const statusCounts = {
    all: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  const handleTableClick = (table: Table) => {
    // If table is occupied with orders, go directly to order view
    if (table.status === 'occupied' && table.orders.length > 0) {
      onTableSelect(table);
    } else {
      // For available, reserved, or occupied without orders, show actions modal
      setSelectedTableForAction(table);
    }
  };

  const handleStartService = async () => {
    if (selectedTableForAction && onUpdateTable) {
      try {
        // Call the dedicated start-service endpoint which creates a bill and assigns the waiter
        const updatedTable = await api.startTableService(selectedTableForAction.id);
        onUpdateTable(updatedTable);
        setSelectedTableForAction(null);
        onTableSelect(updatedTable);
      } catch (error) {
        console.error('Failed to start service:', error);
        alert('Failed to start service. Please try again.');
      }
    }
  };

  const handleReserve = async () => {
    if (selectedTableForAction && onUpdateTable) {
      const updatedTable: Table = {
        ...selectedTableForAction,
        status: 'reserved',
        waiterId: waiter.id,
      };
      await onUpdateTable(updatedTable);
      setSelectedTableForAction(null);
    }
  };

  const handleUnreserve = async () => {
    if (selectedTableForAction && onUpdateTable) {
      const updatedTable: Table = {
        ...selectedTableForAction,
        status: 'available',
        waiterId: undefined,
      };
      await onUpdateTable(updatedTable);
      setSelectedTableForAction(null);
    }
  };

  const filteredTables = tables.filter(table => 
    filterStatus === 'all' || table.status === filterStatus
  );

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Select a Table</h2>
        
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
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setFilterStatus('available')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm ${
              filterStatus === 'available'
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700'
            }`}
          >
            Available ({statusCounts.available})
          </button>
          <button
            onClick={() => setFilterStatus('occupied')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm ${
              filterStatus === 'occupied'
                ? 'bg-red-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700'
            }`}
          >
            Occupied ({statusCounts.occupied})
          </button>
          <button
            onClick={() => setFilterStatus('reserved')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-sm ${
              filterStatus === 'reserved'
                ? 'bg-yellow-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700'
            }`}
          >
            Reserved ({statusCounts.reserved})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredTables.map((table) => {
          const assignedUser = table.waiterId 
            ? users.find(u => u.id === table.waiterId)
            : null;
          
          return (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`p-4 rounded-xl shadow-sm border-2 cursor-pointer hover:shadow-md transition-shadow duration-200 h-[160px] flex flex-col ${
                table.status === 'available'
                  ? 'bg-green-50 border-green-200 hover:border-green-300'
                  : table.status === 'occupied'
                  ? 'bg-red-50 border-red-200 hover:border-red-300'
                  : 'bg-orange-50 border-orange-200 hover:border-orange-300'
              }`}
            >
              <div className="flex flex-col items-center justify-center flex-1">
                {getStatusIcon(table.status)}
                <div className="text-center mt-2">
                  <div className="text-2xl font-bold text-gray-800">
                    {table.number}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {getStatusText(table.status)}
                  </div>
                  <div className="flex items-center justify-center space-x-1 mt-1">
                    <User className="w-3 h-3 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-700">
                      {table.seats}
                    </span>
                  </div>
                  <div className="h-4 mt-1">
                    {table.orders.length > 0 && (
                      <div className="text-xs font-semibold text-orange-600">
                        {table.orders.length} {table.orders.length === 1 ? 'order' : 'orders'}
                      </div>
                    )}
                  </div>
                  <div className="h-5 mt-0.5">
                    {assignedUser && (
                      <div className="text-xs text-gray-600 font-medium">
                        👤 {assignedUser.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tables found with this filter</p>
        </div>
      )}

      {/* Actions Modal */}
      {selectedTableForAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTableForAction(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Table {selectedTableForAction.number}
              </h3>
              <button
                onClick={() => setSelectedTableForAction(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm">{selectedTableForAction.seats} seats</span>
                <span className="mx-2">•</span>
                <span className={`text-sm font-semibold ${
                  selectedTableForAction.status === 'available' 
                    ? 'text-green-600' 
                    : selectedTableForAction.status === 'occupied'
                    ? 'text-red-600'
                    : 'text-orange-600'
                }`}>
                  {getStatusText(selectedTableForAction.status)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Continue Service - appears when table is occupied without orders */}
              {selectedTableForAction.status === 'occupied' && selectedTableForAction.orders.length === 0 && (
                <button
                  onClick={() => {
                    setSelectedTableForAction(null);
                    onTableSelect(selectedTableForAction);
                  }}
                  className="w-full py-4 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Continue Service</span>
                </button>
              )}

              {/* Start Service - only appears if not occupied */}
              {selectedTableForAction.status !== 'occupied' && (
                <button
                  onClick={handleStartService}
                  className="w-full py-4 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Start Service</span>
                </button>
              )}

              {selectedTableForAction.status === 'available' && (
                // Reserve option
                <button
                  onClick={handleReserve}
                  className="w-full py-4 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <CalendarClock className="w-5 h-5" />
                  <span>Reserve Table</span>
                </button>
              )}
              
              {selectedTableForAction.status === 'reserved' && (
                // Release reservation option
                <button
                  onClick={handleUnreserve}
                  className="w-full py-4 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <Unlock className="w-5 h-5" />
                  <span>Release Reservation</span>
                </button>
              )}

              {selectedTableForAction.status === 'occupied' && selectedTableForAction.orders.length === 0 && (
                // Release occupied table without orders
                <button
                  onClick={handleUnreserve}
                  className="w-full py-4 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 border-2 border-gray-300"
                >
                  <Unlock className="w-5 h-5" />
                  <span>Release Table</span>
                </button>
              )}

              <button
                onClick={() => setSelectedTableForAction(null)}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}