import { useState } from 'react';
import { ArrowLeft, CreditCard, Banknote, Smartphone, Users, Check, Minus, Plus, DollarSign, Receipt, X } from 'lucide-react';
import type { Table, OrderItem } from '../types';
import * as api from '../services/api';

interface PaymentViewProps {
  table: Table;
  onBack: () => void;
  onComplete: () => void;
}

type PaymentMethod = 'credit' | 'debit' | 'cash' | 'pix';
type SplitType = 'full' | 'equal' | 'custom' | 'items';

interface CustomSplit {
  id: string;
  name: string;
  amount: number;
}

interface ItemSplit {
  id: string;
  name: string;
  items: { itemId: string; itemName: string; itemPrice: number; quantity: number }[];
}

export function PaymentView({ table, onBack, onComplete }: PaymentViewProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [splitType, setSplitType] = useState<SplitType>('full');
  const [splitAmount, setSplitAmount] = useState(2);
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  
  // Custom amount split
  const [customSplits, setCustomSplits] = useState<CustomSplit[]>([
    { id: '1', name: 'Person 1', amount: 0 },
  ]);
  
  // Items split
  const [itemSplits, setItemSplits] = useState<ItemSplit[]>([
    { id: '1', name: 'Person 1', items: [] },
  ]);

  const allOrderItems = table.orders.flatMap((order, orderIdx) => 
    order.items.map((item, itemIdx) => ({ 
      orderItem: item, 
      index: `${orderIdx}-${itemIdx}-${item.id}` 
    }))
  );

  // Group items by ID for the Order Summary display
  const groupedItemsForDisplay = allOrderItems.reduce((acc, { orderItem }) => {
    const existing = acc.find(item => item.id === orderItem.id);
    if (existing) {
      existing.quantity += orderItem.quantity;
    } else {
      acc.push({ ...orderItem });
    }
    return acc;
  }, [] as OrderItem[]);

  const subtotal = table.orders.reduce((sum, order) => {
    return sum + order.items.reduce((orderSum, item) => orderSum + (item.price * item.quantity), 0);
  }, 0);

  const tipAmount = subtotal * (tipPercentage / 100);
  const totalWithTip = subtotal + tipAmount;
  const pricePerPerson = splitType === 'equal' ? totalWithTip / splitAmount : totalWithTip;

  const paymentMethods = [
    { id: 'credit' as PaymentMethod, name: 'Credit', icon: CreditCard },
    { id: 'debit' as PaymentMethod, name: 'Debit', icon: CreditCard },
    { id: 'cash' as PaymentMethod, name: 'Cash', icon: Banknote },
    { id: 'pix' as PaymentMethod, name: 'PIX', icon: Smartphone },
  ];

  const handleComplete = async () => {
    // Clear previous error
    setValidationError('');

    // Validate Custom Amount Split
    if (splitType === 'custom') {
      // Use tolerance to avoid floating-point precision issues (values like -0.00000001)
      if (Math.abs(customSplitRemaining) >= 0.01) {
        setValidationError(
          customSplitRemaining > 0 
            ? `Please assign the remaining $${customSplitRemaining.toFixed(2)}` 
            : `Total assigned exceeds the bill by $${Math.abs(customSplitRemaining).toFixed(2)}`
        );
        return;
      }
    }

    // Validate Items Split
    if (splitType === 'items') {
      if (assignedItemsQuantity < totalItemsQuantity) {
        const remaining = totalItemsQuantity - assignedItemsQuantity;
        setValidationError(
          `Please assign all items. ${remaining} item${remaining > 1 ? 's' : ''} remaining.`
        );
        return;
      }
    }

    // Prepare payment data
    const paymentSplitDetails = splitType === 'custom' 
      ? JSON.stringify(customSplits)
      : splitType === 'items'
      ? JSON.stringify(itemSplits)
      : splitType === 'equal'
      ? JSON.stringify({ splitAmount })
      : undefined;

    // Show success animation first
    setShowSuccess(true);

    // Complete payment via API
    if (table.billId) {
      try {
        await api.completeBillPayment(table.billId, {
          tipAmount,
          tipPercentage: tipPercentage > 0 ? tipPercentage : undefined,
          paymentMethod,
          paymentSplitType: splitType,
          paymentSplitDetails
        });
        
        // Wait for animation then call onComplete
        setTimeout(() => {
          onComplete();
        }, 2000);
      } catch (error) {
        console.error('Failed to complete payment:', error);
        setShowSuccess(false);
        setValidationError('Failed to process payment. Please try again.');
      }
    } else {
      // No billId (shouldn't happen, but handle gracefully)
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  const handleIncrementSplit = () => {
    if (splitAmount < 10) setSplitAmount(splitAmount + 1);
  };

  const handleDecrementSplit = () => {
    if (splitAmount > 2) setSplitAmount(splitAmount - 1);
  };

  // Custom amount handlers
  const addCustomSplit = () => {
    const newId = (customSplits.length + 1).toString();
    setCustomSplits([...customSplits, { id: newId, name: `Person ${newId}`, amount: 0 }]);
  };

  const removeCustomSplit = (id: string) => {
    if (customSplits.length > 1) {
      setCustomSplits(customSplits.filter(s => s.id !== id));
    }
  };

  const updateCustomSplitAmount = (id: string, amount: number) => {
    setCustomSplits(customSplits.map(s => s.id === id ? { ...s, amount } : s));
  };

  const customSplitTotal = customSplits.reduce((sum, split) => sum + split.amount, 0);
  const customSplitRemaining = totalWithTip - customSplitTotal;

  // Items split handlers
  const addItemSplit = () => {
    const newId = (itemSplits.length + 1).toString();
    setItemSplits([...itemSplits, { id: newId, name: `Person ${newId}`, items: [] }]);
  };

  const removeItemSplit = (id: string) => {
    if (itemSplits.length > 1) {
      setItemSplits(itemSplits.filter(s => s.id !== id));
    }
  };

  const toggleItemForPerson = (personId: string, itemId: string, itemName: string, itemPrice: number) => {
    setItemSplits(itemSplits.map(person => {
      if (person.id === personId) {
        const hasItem = person.items.some(i => i.itemId === itemId);
        if (hasItem) {
          return { ...person, items: person.items.filter(i => i.itemId !== itemId) };
        } else {
          return { ...person, items: [...person.items, { itemId, itemName, itemPrice, quantity: 1 }] };
        }
      }
      return person;
    }));
  };

  const incrementItemQuantity = (personId: string, itemId: string, maxQuantity: number) => {
    setItemSplits(itemSplits.map(person => {
      if (person.id === personId) {
        return {
          ...person,
          items: person.items.map(item => {
            if (item.itemId === itemId && item.quantity < maxQuantity) {
              return { ...item, quantity: item.quantity + 1 };
            }
            return item;
          })
        };
      }
      return person;
    }));
  };

  const decrementItemQuantity = (personId: string, itemId: string) => {
    setItemSplits(itemSplits.map(person => {
      if (person.id === personId) {
        return {
          ...person,
          items: person.items.map(item => {
            if (item.itemId === itemId && item.quantity > 1) {
              return { ...item, quantity: item.quantity - 1 };
            }
            return item;
          }).filter(item => item.quantity > 0)
        };
      }
      return person;
    }));
  };

  const getItemTotal = (items: { itemId: string; itemName: string; itemPrice: number; quantity: number }[]) => {
    const itemsSubtotal = items.reduce((sum, { itemPrice, quantity }) => sum + (itemPrice * quantity), 0);
    // Calculate tip proportionally
    const tipProportion = subtotal > 0 ? itemsSubtotal / subtotal : 0;
    const itemsTip = tipAmount * tipProportion;
    return itemsSubtotal + itemsTip;
  };

  const getAssignedQuantityForItem = (itemId: string) => {
    return itemSplits.reduce((sum, person) => {
      const item = person.items.find(i => i.itemId === itemId);
      return sum + (item ? item.quantity : 0);
    }, 0);
  };

  const getRemainingQuantityForItem = (itemId: string, totalQuantity: number) => {
    const assigned = getAssignedQuantityForItem(itemId);
    return totalQuantity - assigned;
  };

  const isItemAssigned = (itemIndex: string) => {
    return itemSplits.some(person => person.items.some(i => i.index === itemIndex));
  };

  // Calculate total items in order (by quantity)
  const totalItemsQuantity = allOrderItems.reduce((sum, { orderItem }) => sum + orderItem.quantity, 0);
  
  // Calculate assigned items (by quantity)
  const assignedItemsQuantity = itemSplits.reduce((sum, person) => 
    sum + person.items.reduce((personSum, item) => personSum + item.quantity, 0), 0
  );

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Confirmed!</h2>
          <p className="text-gray-600">Table {table.number} closed successfully</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto transition-all duration-300">
      <div className="bg-white rounded-xl shadow-sm p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">Payment</h2>
            <p className="text-xs text-gray-600">Table {table.number}</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-4 border-b pb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Order Summary</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {groupedItemsForDisplay.map(({ id, name, quantity, price }) => (
              <div key={id} className="flex justify-between text-sm">
                <span className="text-gray-700">{quantity}x {name}</span>
                <span className="text-gray-600">${(price * quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-3 border-t mt-3">
            <span className="font-semibold text-gray-800">Subtotal:</span>
            <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Tip Selection */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Tip</h3>
          <div className="grid grid-cols-4 gap-2">
            {[0, 5, 10, 15].map((tip) => (
              <button
                key={tip}
                onClick={() => setTipPercentage(tip)}
                className={`py-3 rounded-lg border-2 transition-all ${
                  tipPercentage === tip
                    ? 'border-orange-600 bg-orange-50 text-orange-600'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="font-bold">{tip}%</div>
                  {tip > 0 && (
                    <div className="text-xs mt-0.5">${(subtotal * (tip / 100)).toFixed(2)}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
          {tipPercentage > 0 && (
            <div className="flex justify-between items-center mt-3 text-sm">
              <span className="text-gray-600">Tip amount:</span>
              <span className="font-semibold text-orange-600">${tipAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center py-3 border-y mb-4">
          <span className="text-lg font-bold text-gray-800">Total:</span>
          <span className="text-2xl font-bold text-orange-600">
            ${totalWithTip.toFixed(2)}
          </span>
        </div>

        {/* Split Options */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Split Bill</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => { setSplitType('full'); setValidationError(''); }}
              className={`p-3 rounded-lg border-2 transition-all ${
                splitType === 'full'
                  ? 'border-orange-600 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CreditCard className={`w-5 h-5 mx-auto mb-1 ${
                splitType === 'full' ? 'text-orange-600' : 'text-gray-400'
              }`} />
              <p className="font-semibold text-xs text-gray-800">Full Payment</p>
            </button>
            <button
              onClick={() => { setSplitType('equal'); setValidationError(''); }}
              className={`p-3 rounded-lg border-2 transition-all ${
                splitType === 'equal'
                  ? 'border-orange-600 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Users className={`w-5 h-5 mx-auto mb-1 ${
                splitType === 'equal' ? 'text-orange-600' : 'text-gray-400'
              }`} />
              <p className="font-semibold text-xs text-gray-800">Split Equally</p>
            </button>
            <button
              onClick={() => { setSplitType('custom'); setValidationError(''); }}
              className={`p-3 rounded-lg border-2 transition-all ${
                splitType === 'custom'
                  ? 'border-orange-600 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <DollarSign className={`w-5 h-5 mx-auto mb-1 ${
                splitType === 'custom' ? 'text-orange-600' : 'text-gray-400'
              }`} />
              <p className="font-semibold text-xs text-gray-800">Custom Amount</p>
            </button>
            <button
              onClick={() => { setSplitType('items'); setValidationError(''); }}
              className={`p-3 rounded-lg border-2 transition-all ${
                splitType === 'items'
                  ? 'border-orange-600 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Receipt className={`w-5 h-5 mx-auto mb-1 ${
                splitType === 'items' ? 'text-orange-600' : 'text-gray-400'
              }`} />
              <p className="font-semibold text-xs text-gray-800">By Items</p>
            </button>
          </div>

          {/* Equal Split */}
          {splitType === 'equal' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Number of people:
              </label>
              <div className="flex items-center justify-center space-x-4 mb-3">
                <button
                  onClick={handleDecrementSplit}
                  disabled={splitAmount <= 2}
                  className="w-10 h-10 bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg flex items-center justify-center border border-gray-300"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-3xl font-bold text-orange-600 w-16 text-center">
                  {splitAmount}
                </span>
                <button
                  onClick={handleIncrementSplit}
                  disabled={splitAmount >= 10}
                  className="w-10 h-10 bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg flex items-center justify-center border border-gray-300"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-700 text-center">
                  Per person:{' '}
                  <span className="font-bold text-orange-600 text-lg">
                    ${pricePerPerson.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Custom Amount Split */}
          {splitType === 'custom' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3 mb-3">
                {customSplits.map((split) => (
                  <div key={split.id} className="flex items-center space-x-2">
                    <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">{split.name}</span>
                        {customSplits.length > 1 && (
                          <button
                            onClick={() => removeCustomSplit(split.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          defaultValue={split.amount === 0 ? '' : split.amount.toString()}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value === '') {
                              updateCustomSplitAmount(split.id, 0);
                              e.target.value = '';
                              return;
                            }
                            const parsed = parseFloat(value);
                            if (!isNaN(parsed) && parsed >= 0) {
                              updateCustomSplitAmount(split.id, parsed);
                              e.target.value = parsed.toFixed(2);
                            } else {
                              // Reset to current value if invalid
                              e.target.value = split.amount === 0 ? '' : split.amount.toFixed(2);
                            }
                          }}
                          placeholder="0.00"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-right"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={addCustomSplit}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors text-sm font-semibold mb-3"
              >
                + Add Person
              </button>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total assigned:</span>
                  <span className={`font-semibold ${customSplitTotal > totalWithTip ? 'text-red-600' : 'text-gray-800'}`}>
                    ${customSplitTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pb-2 border-b">
                  <span className="text-gray-600">Remaining:</span>
                  <span className={`font-semibold ${customSplitRemaining < -0.01 ? 'text-red-600' : Math.abs(customSplitRemaining) < 0.01 ? 'text-green-600' : 'text-orange-600'}`}>
                    ${customSplitRemaining.toFixed(2)}
                  </span>
                </div>
                {Math.abs(customSplitRemaining) >= 0.01 && (
                  <p className="text-xs text-center text-gray-500 italic">
                    {customSplitRemaining > 0 ? 'Amount remaining to assign' : 'Total exceeds bill amount'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Items Split */}
          {splitType === 'items' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-4 mb-3">
                {itemSplits.map((person) => {
                  const personTotal = getItemTotal(person.items);
                  return (
                    <div key={person.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-800">{person.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-orange-600">
                            ${personTotal.toFixed(2)}
                          </span>
                          {itemSplits.length > 1 && (
                            <button
                              onClick={() => removeItemSplit(person.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        {groupedItemsForDisplay.map((groupedItem) => {
                          const selectedItem = person.items.find(i => i.itemId === groupedItem.id);
                          const isSelected = !!selectedItem;
                          const remainingQuantity = getRemainingQuantityForItem(groupedItem.id, groupedItem.quantity);
                          const isFullyAssigned = !isSelected && remainingQuantity === 0;
                          
                          if (isSelected) {
                            // Show selected item with quantity controls
                            const maxAvailable = remainingQuantity + selectedItem.quantity;
                            return (
                              <div key={groupedItem.id} className="bg-orange-50 border-2 border-orange-500 rounded-lg p-2">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-orange-700 font-semibold text-sm flex-1">
                                    {groupedItem.name}
                                  </span>
                                  <span className="text-orange-600 font-bold text-sm">
                                    ${(groupedItem.price * selectedItem.quantity).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (selectedItem.quantity === 1) {
                                          toggleItemForPerson(person.id, groupedItem.id, groupedItem.name, groupedItem.price);
                                        } else {
                                          decrementItemQuantity(person.id, groupedItem.id);
                                        }
                                      }}
                                      className="w-7 h-7 bg-white hover:bg-orange-100 rounded-md flex items-center justify-center border border-orange-300"
                                    >
                                      {selectedItem.quantity === 1 ? (
                                        <X className="w-3.5 h-3.5 text-orange-600" />
                                      ) : (
                                        <Minus className="w-3.5 h-3.5 text-orange-600" />
                                      )}
                                    </button>
                                    <span className="text-orange-700 font-bold text-sm w-8 text-center">
                                      {selectedItem.quantity}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        incrementItemQuantity(person.id, groupedItem.id, maxAvailable);
                                      }}
                                      disabled={selectedItem.quantity >= maxAvailable}
                                      className="w-7 h-7 bg-white hover:bg-orange-100 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-md flex items-center justify-center border border-orange-300"
                                    >
                                      <Plus className="w-3.5 h-3.5 text-orange-600" />
                                    </button>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    of {groupedItem.quantity} • ${groupedItem.price.toFixed(2)} each
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <button
                              key={groupedItem.id}
                              onClick={() => !isFullyAssigned && toggleItemForPerson(person.id, groupedItem.id, groupedItem.name, groupedItem.price)}
                              disabled={isFullyAssigned}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-all ${
                                isFullyAssigned
                                  ? 'bg-gray-100 border border-gray-200 opacity-50 cursor-not-allowed'
                                  : 'bg-gray-50 border border-gray-200 hover:border-orange-300'
                              }`}
                            >
                              <span className="text-gray-700">
                                {groupedItem.quantity}x {groupedItem.name}
                                {remainingQuantity < groupedItem.quantity && remainingQuantity > 0 && (
                                  <span className="text-xs text-orange-600 ml-1">
                                    ({remainingQuantity} left)
                                  </span>
                                )}
                              </span>
                              <span className="text-gray-600">
                                ${(groupedItem.price * groupedItem.quantity).toFixed(2)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button
                onClick={addItemSplit}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors text-sm font-semibold mb-3"
              >
                + Add Person
              </button>

              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items assigned:</span>
                  <span className="font-semibold text-gray-800">
                    {assignedItemsQuantity} / {totalItemsQuantity}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Payment Method</h3>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    paymentMethod === method.id
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${
                    paymentMethod === method.id ? 'text-orange-600' : 'text-gray-400'
                  }`} />
                  <p className="font-semibold text-xs text-gray-800">{method.name}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleComplete}
          className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
        >
          Confirm Payment
        </button>
        {validationError && (
          <p className="text-sm text-red-500 mt-2 text-center">{validationError}</p>
        )}
      </div>
    </div>
  );
}