import React, { useState, useMemo } from 'react';
import { Table, MenuItem, OrderItem, TableStatus } from '../types';
import { 
  X, Check, Plus, Minus, Trash2, Search, Receipt, 
  Calendar, Users, FileText, ChevronRight, AlertCircle, ShoppingBag,
  Printer, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReceiptActionModal from './ReceiptActionModal';
import { printReceipt } from '../utils/receipt';

interface TableDetailDrawerProps {
  table: Table;
  menuItems: MenuItem[];
  onClose: () => void;
  onUpdateTable: (updatedTable: Table) => void;
  onCheckout: (
    subtotal: number, 
    serviceCharge: number, 
    tax: number, 
    total: number, 
    paymentMethod: 'UPI' | 'Cash' | 'Card',
    guestName?: string
  ) => void;
  upiId?: string;
  upiPayeeName?: string;
  printerEnabled?: boolean;
  printerIp?: string;
  printerPort?: string;
  printerProtocol?: string;
}

export default function TableDetailDrawer({
  table,
  menuItems,
  onClose,
  onUpdateTable,
  onCheckout,
  upiId,
  upiPayeeName,
  printerEnabled,
  printerIp,
  printerPort,
  printerProtocol
}: TableDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'order' | 'billing'>('status');
  const [showReceiptHub, setShowReceiptHub] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Card'>('Cash');
  const [cashAmountTendered, setCashAmountTendered] = useState<string>('');
  
  // Status edit state
  const [currentStatus, setCurrentStatus] = useState<TableStatus>(table.status);
  const [guests, setGuests] = useState<number>(table.guestCount || 2);
  const [resName, setResName] = useState<string>(table.reservationName || '');
  const [resTime, setResTime] = useState<string>(table.reservationTime || '');
  const [guestName, setGuestName] = useState<string>(table.guestName || table.reservationName || '');
  const [notes, setNotes] = useState<string>(table.notes || '');
  const [currentSize, setCurrentSize] = useState<'small' | 'medium' | 'large'>(table.size || 'medium');
  const [currentShape, setCurrentShape] = useState<'square' | 'circle' | 'rectangle' | 'line'>(table.shape || 'square');

  // Menu Search within active order taker
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilter, setMenuFilter] = useState<string>('All');

  // Load order items from table
  const [activeOrder, setActiveOrder] = useState<OrderItem[]>(table.currentOrder);

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return activeOrder.reduce((acc, item) => acc + (item.priceAtOrder * item.quantity), 0);
  }, [activeOrder]);

  const serviceChargePercent = 10;
  const taxPercent = 8;

  const serviceCharge = useMemo(() => {
    return Number((subtotal * (serviceChargePercent / 100)).toFixed(2));
  }, [subtotal]);

  const tax = useMemo(() => {
    return Number((subtotal * (taxPercent / 100)).toFixed(2));
  }, [subtotal]);

  const grandTotal = useMemo(() => {
    return Number((subtotal + serviceCharge + tax).toFixed(2));
  }, [subtotal, serviceCharge, tax]);

  // Handle active status block updates
  const handleUpdateStatusAndBasics = () => {
    const updatedTable: Table = {
      ...table,
      status: currentStatus,
      notes: notes,
      guestCount: currentStatus === 'occupied' ? guests : 0,
      reservationName: currentStatus === 'reserved' ? resName : undefined,
      reservationTime: currentStatus === 'reserved' ? resTime : undefined,
      guestName: currentStatus === 'occupied' ? (guestName || resName) : undefined,
      // If changed from occupied, clear order. If remains occupied, sync order.
      currentOrder: currentStatus === 'occupied' ? activeOrder : [],
      size: currentSize,
      shape: currentShape
    };
    onUpdateTable(updatedTable);
    onClose();
  };

  // Quick Order Item Operations
  const handleAddItemToOrder = (menuItem: MenuItem) => {
    if (!menuItem.inStock) return;
    setActiveOrder(prev => {
      const existing = prev.find(item => item.menuItemId === menuItem.id);
      if (existing) {
        return prev.map(item => 
          item.menuItemId === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prev, {
          menuItemId: menuItem.id,
          name: menuItem.name,
          quantity: 1,
          priceAtOrder: menuItem.price
        }];
      }
    });

    // Auto switch to Occupied status if someone orders
    if (currentStatus !== 'occupied') {
      setCurrentStatus('occupied');
    }
  };

  const handleDecrementItem = (menuItemId: string) => {
    setActiveOrder(prev => {
      const existing = prev.find(item => item.menuItemId === menuItemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter(item => item.menuItemId !== menuItemId);
      }
      return prev.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      );
    });
  };

  const handleRemoveItem = (menuItemId: string) => {
    setActiveOrder(prev => prev.filter(item => item.menuItemId !== menuItemId));
  };

  // Perform checkout
  const handleProceedCheckout = () => {
    if (activeOrder.length === 0) return;
    // Call parents custom billing logger
    onCheckout(subtotal, serviceCharge, tax, grandTotal, paymentMethod, guestName || table.guestName || table.reservationName);
    
    // Auto-clean table back to available
    const clearedTable: Table = {
      ...table,
      status: 'available',
      guestCount: 0,
      currentOrder: [],
      notes: '',
      reservationName: undefined,
      reservationTime: undefined,
      guestName: undefined
    };
    onUpdateTable(clearedTable);
    onClose();
  };

  // Filter items in stock
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                          item.description.toLowerCase().includes(menuSearch.toLowerCase());
      const matchCategory = menuFilter === 'All' || item.category === menuFilter;
      return matchSearch && matchCategory;
    });
  }, [menuItems, menuSearch, menuFilter]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Heavy frosted overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleUpdateStatusAndBasics} 
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs cursor-pointer"
      />

      {/* Primary detail container panel */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative bg-neutral-50 w-full max-w-lg md:max-w-xl h-full flex flex-col shadow-2xl overflow-hidden border-l border-neutral-100 z-10"
      >
        {/* Draw Header */}
        <div className="bg-white px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl">
              T{table.number}
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-800">Table {table.number} Operations</h2>
              <p className="text-xs text-neutral-400 font-medium">Capacity: Fits up to {table.capacity} guests</p>
            </div>
          </div>
          <button 
            onClick={handleUpdateStatusAndBasics}
            className="w-9 h-9 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Toggle Navigation tab rail */}
        <div className="bg-white border-b border-neutral-100 flex px-6 text-sm font-semibold text-neutral-500">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3.5 border-b-2 px-1 transition duration-200 cursor-pointer flex items-center gap-2 mr-6 ${
              activeTab === 'status' 
                ? 'border-orange-500 text-orange-600' 
                : 'border-transparent hover:text-neutral-800'
            }`}
          >
            <Users size={16} /> Table Info
          </button>
          
          <button
            onClick={() => setActiveTab('order')}
            className={`py-3.5 border-b-2 px-1 transition duration-200 cursor-pointer flex items-center gap-2 mr-6 ${
              activeTab === 'order' 
                ? 'border-orange-500 text-orange-600' 
                : 'border-transparent hover:text-neutral-800'
            }`}
          >
            <ShoppingBag size={16} /> Live Order Taker
            {activeOrder.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {activeOrder.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`py-3.5 border-b-2 px-1 transition duration-200 cursor-pointer flex items-center gap-2 ${
              activeTab === 'billing' 
                ? 'border-orange-500 text-orange-600' 
                : 'border-transparent hover:text-neutral-800'
            }`}
          >
            <Receipt size={16} /> Billing / Cashier
          </button>
        </div>

        {/* Sliding Panel Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-28">
          
          {/* TAB 1: STATUS & BASICS */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Status Radio select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Current Status</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'available', label: 'AVAILABLE', emoji: '✨', activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
                    { id: 'occupied', label: 'OCCUPIED', emoji: '👥', activeClass: 'border-orange-500 bg-orange-50 text-orange-700' },
                    { id: 'reserved', label: 'RESERVED', emoji: '📅', activeClass: 'border-blue-500 bg-blue-50 text-blue-700' },
                  ].map(stat => (
                    <button
                      type="button"
                      key={stat.id}
                      onClick={() => {
                        setCurrentStatus(stat.id as TableStatus);
                        if (stat.id === 'occupied' && guests === 0) {
                          setGuests(2);
                        }
                      }}
                      className={`py-4 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition ${
                        currentStatus === stat.id 
                          ? stat.activeClass 
                          : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="text-xl">{stat.emoji}</span>
                      {stat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Status Configurations */}
              <AnimatePresence mode="wait">
                {currentStatus === 'occupied' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white p-5 rounded-2xl pointer-events-auto shadow-xs border border-neutral-100 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-neutral-800">Seated Guests Tracker</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">Define guest counts. Table limit: {table.capacity} pax</div>
                      </div>
                      <div className="flex items-center gap-3 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100">
                        <button
                          type="button"
                          onClick={() => setGuests(prev => Math.max(1, prev - 1))}
                          className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-bold text-neutral-600 hover:bg-neutral-100 shadow-xs cursor-pointer"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-sm font-bold text-neutral-800 min-w-4 text-center">{guests}</span>
                        <button
                          type="button"
                          onClick={() => setGuests(prev => Math.min(table.capacity, prev + 1))}
                          className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-bold text-neutral-600 hover:bg-neutral-100 shadow-xs cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-50">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Lead Guest Name (Included on Receipt)</label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Elena Rostova or Walk-in Guest"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-800 placeholder-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition"
                      />
                    </div>

                    {guests > table.capacity && (
                      <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold bg-rose-50 p-3 rounded-lg border border-rose-100">
                        <AlertCircle size={15} /> Expected size exceeds recommended table load.
                      </div>
                    )}
                  </motion.div>
                )}

                {currentStatus === 'reserved' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white p-5 rounded-2xl shadow-xs border border-neutral-100 space-y-4"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-neutral-800">Reservation Contacts</div>
                      <p className="text-[11px] text-neutral-400">Save caller details for the dining map node</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Name</label>
                        <input
                          type="text"
                          value={resName}
                          onChange={(e) => setResName(e.target.value)}
                          placeholder="e.g. Mr. Henderson"
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Time Expectation</label>
                        <input
                          type="time"
                          value={resTime}
                          onChange={(e) => setResTime(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Kitchen / Server Notes Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <FileText size={14} /> Host / Kitchen Instruction Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Allergy warning for soy, VIP guest requesting premium sommelier recommendations, or seating preference..."
                  rows={4}
                  className="w-full bg-white p-4 rounded-2xl border border-neutral-200 text-xs font-medium text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LIVE ORDER TAKER */}
          {activeTab === 'order' && (
            <div className="space-y-6">
              {/* Table check active items */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="font-bold text-neutral-800 text-sm">Table Receipt Checklist</div>
                  <div className="text-xs font-bold text-neutral-400">
                    Items: {activeOrder.reduce((sum, i) => sum + i.quantity, 0)}
                  </div>
                </div>

                {activeOrder.length === 0 ? (
                  <div className="text-center py-6 text-neutral-400 text-xs">
                    <div className="text-2xl mb-2">📥</div>
                    No culinary or beverage selections logged yet
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {activeOrder.map(item => (
                      <div key={item.menuItemId} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                        <div>
                          <div className="text-xs font-bold text-neutral-800">{item.name}</div>
                          <div className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                            ₹{item.priceAtOrder.toFixed(2)} each
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2.5 bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-150">
                            <button
                              type="button"
                              onClick={() => handleDecrementItem(item.menuItemId)}
                              className="w-5 h-5 rounded-md bg-white hover:bg-neutral-100 text-neutral-600 font-black flex items-center justify-center text-xs shadow-2xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-neutral-800 min-w-3 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const mi = menuItems.find(m => m.id === item.menuItemId);
                                if (mi) handleAddItemToOrder(mi);
                              }}
                              className="w-5 h-5 rounded-md bg-white hover:bg-neutral-100 text-neutral-600 font-black flex items-center justify-center text-xs shadow-2xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.menuItemId)}
                            className="text-neutral-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Browse Menu & Add to card search area */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">Browse Menu Catalogue</span>
                  
                  {/* Category switcher */}
                  <div className="flex flex-wrap gap-1 bg-neutral-100 p-1 rounded-xl">
                    {['All', 'Appetizers', 'Main Course', 'Desserts', 'Drinks'].map(cat => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setMenuFilter(cat)}
                        className={`text-[10px] px-2 py-1 rounded-lg font-bold transition duration-200 cursor-pointer ${
                          menuFilter === cat 
                            ? 'bg-neutral-900 text-white shadow-xs' 
                            : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live search input */}
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 bg-white"
                  />
                </div>

                {/* Filtered items grid list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                  {filteredMenuItems.map(mi => (
                    <button
                      key={mi.id}
                      type="button"
                      disabled={!mi.inStock}
                      onClick={() => handleAddItemToOrder(mi)}
                      className={`p-3 rounded-2xl bg-white border text-left flex items-start gap-2.5 transition duration-200 hover:scale-[1.01] ${
                        mi.inStock 
                          ? 'border-neutral-100 hover:shadow-xs group hover:border-orange-200 cursor-pointer' 
                          : 'opacity-50 border-neutral-200 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-2xl bg-neutral-50 w-10 h-10 rounded-xl flex items-center justify-center p-1 group-hover:bg-orange-50/50 transition">
                        {mi.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-neutral-800 truncate">{mi.name}</h4>
                          <span className="text-xs font-extrabold text-orange-600">₹{mi.price.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">{mi.description}</p>
                        {!mi.inStock && (
                          <span className="text-[9px] bg-rose-50 text-rose-500 font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block">
                            OUT OF STOCK
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                  
                  {filteredMenuItems.length === 0 && (
                    <div className="col-span-full text-center py-6 text-neutral-400 text-xs">
                      No matching menu dishes found
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BILLING & PAYMENT CHECKOUT */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-neutral-150 shadow-sm relative overflow-hidden">
                {/* Decorative receipt watermarks */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-neutral-900" />
                
                <div className="text-center pb-5 border-b border-dashed border-neutral-200">
                  <span className="text-3xl">🍽</span>
                  <h3 className="font-bold text-neutral-800 text-sm tracking-wide uppercase mt-2">Bespoke Dining Co.</h3>
                  <p className="text-[11px] text-neutral-400 font-medium">Bespoke Dining Applet • Table {table.number}</p>
                </div>

                <div className="py-4 space-y-3.5 border-b border-dashed border-neutral-200">
                  <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold tracking-wider uppercase">
                    <span>Menu Item Selections</span>
                    <span>Subtotal</span>
                  </div>

                  {activeOrder.length === 0 ? (
                    <div className="text-center py-4 text-neutral-400 text-xs tracking-wide">
                      Your basket is currently empty. Seat guests or toggle order takers first.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeOrder.map(item => (
                        <div key={item.menuItemId} className="flex justify-between text-xs">
                          <div>
                            <span className="font-extrabold text-neutral-800">{item.quantity}x</span>{" " }
                            <span className="text-neutral-600 font-medium">{item.name}</span>
                          </div>
                          <span className="font-semibold text-neutral-800">
                            ₹{(item.priceAtOrder * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sub-charges math tally columns */}
                <div className="py-4 space-y-2.5 border-b border-dashed border-neutral-200 text-xs">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Auto-Service Charge ({serviceChargePercent}%)</span>
                    <span>₹{serviceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>VAT Sales Tax ({taxPercent}%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                </div>

                {/* Grand summary billing row */}
                <div className="pt-4 flex justify-between items-center text-neutral-800">
                  <span className="font-extrabold text-sm tracking-wide">Amount Due</span>
                  <span className="font-black text-2xl tracking-tight text-neutral-900">₹{grandTotal.toFixed(2)}</span>
                </div>

                {/* PAYMENT METHOD SELECTOR SELECTION */}
                {activeOrder.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-dashed border-neutral-200">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block mb-2.5">
                      Select Payment Channel
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Cash')}
                        className={`py-2.5 px-1 rounded-xl text-center font-bold text-[11px] border transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          paymentMethod === 'Cash'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="text-lg">💵</span>
                        <span>CASH</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI')}
                        className={`py-2.5 px-1 rounded-xl text-center font-bold text-[11px] border transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          paymentMethod === 'UPI'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="text-lg">📱</span>
                        <span>UPI QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Card')}
                        className={`py-2.5 px-1 rounded-xl text-center font-bold text-[11px] border transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          paymentMethod === 'Card'
                            ? 'bg-orange-50 border-orange-500 text-orange-800 shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="text-lg">💳</span>
                        <span>CARD</span>
                      </button>
                    </div>

                    {/* DYNAMIC PAYMENT SIMULATORS BELOW THE CHANNELS */}
                    <div className="mt-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-105">
                      {paymentMethod === 'Cash' && (
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] uppercase font-extrabold text-neutral-400 tracking-wider block">
                              Cash Received (Tendered)
                            </label>
                            {cashAmountTendered && (
                              <button
                                type="button"
                                onClick={() => setCashAmountTendered('')}
                                className="text-[9px] font-extrabold text-rose-600 hover:text-rose-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
                              >
                                ✕ Clear Input
                              </button>
                            )}
                          </div>

                          {/* Suggested exact values / quick-set bills */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wide block">Quick-Set Presets</span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[Math.ceil(grandTotal), 500, 1000, 2005].map(val => {
                                // Dynamic premium bills rounders
                                const actualVal = val === 2005 ? 2000 : val;
                                return (
                                  <button
                                    key={actualVal}
                                    type="button"
                                    onClick={() => setCashAmountTendered(actualVal.toString())}
                                    className={`py-1.5 rounded-lg text-[10px] font-extrabold transition cursor-pointer border ${
                                      cashAmountTendered === actualVal.toString()
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                                    }`}
                                  >
                                    ₹{actualVal}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Adding relative bill denominations (+50, +100, +200, +500) */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wide block">Add Bill Denominations</span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[10, 50, 100, 500].map(val => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setCashAmountTendered(prev => {
                                    const current = parseFloat(prev) || 0;
                                    return (current + val).toString();
                                  })}
                                  className="py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg text-[10px] font-extrabold transition cursor-pointer"
                                >
                                  +₹{val}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Input field */}
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-xs font-black text-neutral-400">₹</span>
                            <input
                              type="text"
                              value={cashAmountTendered}
                              onChange={(e) => setCashAmountTendered(e.target.value.replace(/[^0-9.]/g, ''))}
                              placeholder="0.00"
                              className="w-full pl-6 pr-3 py-2 rounded-lg border border-neutral-200 text-xs font-extrabold text-neutral-800 bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 placeholder-neutral-300 transition"
                            />
                          </div>

                          {/* LIVE CALCULATION DISPLAY */}
                          {(() => {
                            const tenderedVal = cashAmountTendered === '' ? 0 : parseFloat(cashAmountTendered) || 0;
                            const changeDue = tenderedVal - grandTotal;
                            if (tenderedVal === 0) {
                              return (
                                <div className="p-3 bg-neutral-100 rounded-2xl border border-neutral-200 text-center text-[10px] text-neutral-400 font-semibold italic">
                                  Waiting for cash receipt amount to compute change...
                                </div>
                              );
                            }

                            if (changeDue >= 0) {
                              return (
                                <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl space-y-2.5 animate-fadeIn shadow-xs">
                                  <div className="flex justify-between items-center text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider">
                                    <span>Payment Status</span>
                                    <span className="bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-sm">PAID PERFECTLY</span>
                                  </div>
                                  <div className="flex justify-between items-baseline pt-1 border-t border-emerald-200/50">
                                    <span className="text-xs font-bold text-emerald-800">CHANGE DUE:</span>
                                    <span className="text-xl font-black text-emerald-905 tracking-tight font-mono">
                                      ₹{changeDue.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-emerald-700/80 font-medium flex justify-between pt-1 border-t border-emerald-200/30">
                                    <span>Tendered: ₹{tenderedVal.toFixed(2)}</span>
                                    <span>Bill Amount: ₹{grandTotal.toFixed(2)}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      printReceipt({
                                        tableNumber: table.number,
                                        items: activeOrder,
                                        subtotal,
                                        serviceCharge,
                                        tax,
                                        total: grandTotal,
                                        guestCount: guests || table.guestCount,
                                        paymentMethod: 'Cash',
                                        guestName: guestName || table.guestName || table.reservationName
                                      });
                                      handleProceedCheckout();
                                    }}
                                    className="w-full mt-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <span>Payment Received & Print 💵</span>
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2 animate-fadeIn shadow-xs">
                                <div className="flex justify-between items-center text-[10px] text-amber-800 font-extrabold uppercase tracking-wider">
                                  <span>Payment Status</span>
                                  <span className="bg-amber-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-sm">INSUFFICIENT</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-1 border-t border-amber-150">
                                  <span className="text-xs font-bold text-amber-800">BALANCE DUE:</span>
                                  <span className="text-lg font-black text-amber-900 tracking-tight font-mono">
                                    ₹{Math.abs(changeDue).toFixed(2)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-amber-700/90 font-semibold leading-relaxed">
                                  ⚠️ Remaining amount of ₹{Math.abs(changeDue).toFixed(2)} is required to settle the bill.
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {paymentMethod === 'UPI' && (() => {
                        const upiUri = `upi://pay?pa=${upiId || 'restaurant@okaxis'}&pn=${encodeURIComponent(upiPayeeName || 'Bespoke Dining Co.')}&am=${grandTotal.toFixed(2)}&cu=INR`;
                        const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}&bgcolor=ffffff&color=262626`;
                        return (
                          <div className="text-center space-y-3 py-1 animate-fade-in">
                            <div className="inline-block p-2 bg-white rounded-2xl border border-neutral-150 shadow-md relative group/qr overflow-hidden">
                              <img
                                src={qrCodeSrc}
                                alt="UPI scan to pay dynamic QR code"
                                className="w-32 h-32 mx-auto object-contain select-none hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            </div>
                            <div>
                              <p className="text-[10px] font-black tracking-wide text-neutral-800">SCAN BHIM UPI QR TO PAY</p>
                              <p className="text-[9px] text-neutral-400 font-mono mt-0.5 break-all max-w-[220px] mx-auto select-all cursor-pointer truncate" title={upiUri}>
                                {upiId || 'restaurant@okaxis'}
                              </p>
                              <p className="text-[8px] text-neutral-400 font-sans font-medium mt-0.5">
                                Invoice Amount: <strong className="font-semibold text-neutral-700">₹{grandTotal.toFixed(2)}</strong>
                              </p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-semibold py-1 px-2.5 rounded-lg inline-block max-w-[200px] truncate mb-1">
                              📱 Payee: {upiPayeeName || 'Bespoke Dining Co.'}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                printReceipt({
                                  tableNumber: table.number,
                                  items: activeOrder,
                                  subtotal,
                                  serviceCharge,
                                  tax,
                                  total: grandTotal,
                                  guestCount: guests || table.guestCount,
                                  paymentMethod: 'UPI',
                                  guestName: guestName || table.guestName || table.reservationName
                                });
                                handleProceedCheckout();
                              }}
                              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <span>Payment Received - Auto Bill & Print ✅</span>
                            </button>
                          </div>
                        );
                      })()}

                      {paymentMethod === 'Card' && (
                        <div className="space-y-3 py-1">
                          <div className="relative h-24 bg-gradient-to-tr from-neutral-850 to-neutral-750 text-white rounded-2xl p-3 overflow-hidden border border-neutral-700 shadow-xs">
                            <div className="flex justify-between items-start">
                              <span className="text-[8px] font-black tracking-widest text-neutral-400">PRESTIGE CARD</span>
                              <span className="text-base font-black italic text-neutral-300">VISA</span>
                            </div>
                            <div className="mt-2.5">
                              <div className="w-7 h-5 bg-yellow-400/80 rounded-sm mb-1.5" />
                              <p className="font-mono text-[11px] tracking-widest text-neutral-200">•••• •••• •••• 4172</p>
                            </div>
                          </div>
                          <div className="text-center space-y-2.5">
                            <span className="text-[9px] text-neutral-400 font-bold block animate-pulse">
                              📟 READY: INSERT, TAP OR SWIPE CARD TO SETTLE
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => {
                                printReceipt({
                                  tableNumber: table.number,
                                  items: activeOrder,
                                  subtotal,
                                  serviceCharge,
                                  tax,
                                  total: grandTotal,
                                  guestCount: guests || table.guestCount,
                                  paymentMethod: 'Card',
                                  guestName: guestName || table.guestName || table.reservationName
                                });
                                handleProceedCheckout();
                              }}
                              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <span>Payment Received & Print 💳</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick printing and image sharing trigger suite */}
              {activeOrder.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => printReceipt({
                        tableNumber: table.number,
                        items: activeOrder,
                        subtotal,
                        serviceCharge,
                        tax,
                        total: grandTotal,
                        guestCount: guests || table.guestCount,
                        paymentMethod: paymentMethod,
                        guestName: guestName || table.guestName || table.reservationName
                      })}
                      className="py-3 px-3 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950 font-bold text-[11px] uppercase tracking-wider rounded-2xl border border-neutral-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer size={13} className="text-orange-500" />
                      <span>Print Bill</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowReceiptHub(true)}
                      className="py-3 px-3 bg-neutral-950 hover:bg-neutral-850 text-white font-bold text-[11px] uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Share2 size={13} className="text-orange-400" />
                      <span>Receipt Hub</span>
                    </button>
                  </div>

                  {/* Wi-Fi connected printer display state */}
                  {printerEnabled && printerIp && (
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-100/60 p-2.5 rounded-xl px-3 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="font-semibold text-neutral-500">Subnet Printer: <strong className="font-mono text-neutral-600 font-extrabold">{printerIp}</strong></span>
                      </div>
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-extrabold tracking-wide uppercase">{printerProtocol}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Helpful Settle Action Alert */}
              {activeOrder.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-3">
                  <span className="text-xl mt-0.5">💰</span>
                  <div>
                    <h4 className="text-xs font-bold text-orange-800">Settle check and archive?</h4>
                    <p className="text-[10px] text-orange-600 mt-1">
                      Pressing "Checkout Table" locks active items, registers revenue to analytics records, and resets Table {table.number} to Available.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Persistent bottom save drawer actions bar */}
        <div className="absolute bottom-0 inset-x-0 bg-white p-4 border-t border-neutral-100 flex gap-3 shadow-md z-20">
          <button
            type="button"
            onClick={handleUpdateStatusAndBasics}
            className="flex-1 py-3 text-neutral-600 font-bold text-xs bg-neutral-50 hover:bg-neutral-100 border border-neutral-100 rounded-xl transition cursor-pointer text-center"
          >
            Save & Exit Info
          </button>

          {activeTab === 'billing' || activeOrder.length > 0 ? (
            <button
              type="button"
              disabled={activeOrder.length === 0}
              onClick={handleProceedCheckout}
              className={`flex-1 py-3 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer ${
                activeOrder.length > 0 
                  ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-500/10' 
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Receipt size={14} /> Checkout ₹{grandTotal.toFixed(2)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('order')}
              className="flex-1 py-3 text-white bg-neutral-900 hover:bg-neutral-800 font-bold text-xs rounded-xl transition cursor-pointer text-center"
            >
              Add Ordered Items
            </button>
          )}
        </div>
      </motion.div>

      {/* Modern Receipt Share and Print Hub Overlay */}
      <AnimatePresence>
        {showReceiptHub && (
          <ReceiptActionModal
            data={{
              tableNumber: table.number,
              items: activeOrder,
              subtotal,
              serviceCharge,
              tax,
              total: grandTotal,
              guestCount: guests || table.guestCount,
              paymentMethod: paymentMethod,
              guestName: guestName || table.guestName || table.reservationName
            }}
            onClose={() => setShowReceiptHub(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
