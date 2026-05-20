import React, { useState, useMemo } from 'react';
import { PastOrder } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, TrendingUp, Users, IndianRupee, Search, ListFilter, ClipboardCheck, ArrowUpDown, ChevronDown, ChevronUp, Printer, Share2 } from 'lucide-react';
import ReceiptActionModal from './ReceiptActionModal';
import { printReceipt, ReceiptData } from '../utils/receipt';

interface HistoryViewProps {
  pastOrders: PastOrder[];
  onClearHistory: () => void;
}

export default function HistoryView({ pastOrders, onClearHistory }: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('All');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedReceiptForHub, setSelectedReceiptForHub] = useState<ReceiptData | null>(null);

  // Financial tallies
  const metrics = useMemo(() => {
    const count = pastOrders.length;
    if (count === 0) {
      return { totalRevenue: 0, averageValue: 0, totalGuests: 0, count: 0 };
    }
    const rev = pastOrders.reduce((sum, order) => sum + order.total, 0);
    const guests = pastOrders.reduce((sum, order) => sum + order.guestCount, 0);
    return {
      totalRevenue: rev,
      averageValue: rev / count,
      totalGuests: guests,
      count
    };
  }, [pastOrders]);

  // Aggregate Category performance for visual SVG charts
  const categoryChartData = useMemo(() => {
    const sales = {
      'Appetizers': 0,
      'Main Course': 0,
      'Desserts': 0,
      'Drinks': 0
    };

    // Note: PastOrders items might not map immediately back, but we can intelligently infer categories or distribute
    // Let's check some known seed items or distribute evenly
    pastOrders.forEach(ord => {
      ord.items.forEach(itm => {
        const cost = itm.price * itm.quantity;
        // Simple map lookup or fallback standard mapping
        const nameLower = itm.name.toLowerCase();
        if (nameLower.includes('fries') || nameLower.includes('calamari') || nameLower.includes('carpaccio')) {
          sales['Appetizers'] += cost;
        } else if (nameLower.includes('steak') || nameLower.includes('sea bass') || nameLower.includes('burger') || nameLower.includes('risotto')) {
          sales['Main Course'] += cost;
        } else if (nameLower.includes('cake') || nameLower.includes('brûlée') || nameLower.includes('gelato')) {
          sales['Desserts'] += cost;
        } else {
          sales['Drinks'] += cost;
        }
      });
    });

    const totalSales = Object.values(sales).reduce((acc, v) => acc + v, 0) || 1;
    return Object.entries(sales).map(([cat, val]) => ({
      name: cat,
      value: val,
      percent: Math.round((val / totalSales) * 100),
      hex: cat === 'Main Course' ? '#ea580c' : cat === 'Appetizers' ? '#10b981' : cat === 'Desserts' ? '#3b82f6' : '#8b5cf6'
    }));
  }, [pastOrders]);

  // Filtering completed checks
  const filteredOrders = useMemo(() => {
    return pastOrders.filter(ord => {
      if (searchQuery) {
        const query = searchQuery.trim().toLowerCase();
        
        // 1. Match Table Number
        const matchesTable = ord.tableNumber.toString() === query || 
                             `table ${ord.tableNumber}`.toLowerCase().includes(query) ||
                             `t${ord.tableNumber}`.toLowerCase().includes(query);
                             
        // 2. Match Invoice ID
        const matchesInvoice = ord.id.toLowerCase().includes(query);
        
        // 3. Match Guest Name (if present)
        const matchesGuest = ord.guestName ? ord.guestName.toLowerCase().includes(query) : false;
        
        // 4. Match Order Items (item name search)
        const matchesItems = ord.items.some(item => item.name.toLowerCase().includes(query));
        
        if (!matchesTable && !matchesInvoice && !matchesGuest && !matchesItems) {
          return false;
        }
      }
      if (selectedPaymentMethod !== 'All' && ord.paymentMethod !== selectedPaymentMethod) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [pastOrders, searchQuery, selectedPaymentMethod]);

  const toggleAccordion = (id: string) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Top statistics cards columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Gross Revenue</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <IndianRupee size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-neutral-800 mt-2">₹{metrics.totalRevenue.toFixed(2)}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp size={11} /> 100% Settle Rate
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Avg Check Value</span>
            <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              ₹
            </span>
          </div>
          <div className="text-2xl font-black text-neutral-800 mt-2">₹{metrics.averageValue.toFixed(2)}</div>
          <p className="text-[10px] text-neutral-400 mt-1 font-semibold">Normalized base basket totals</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Guests Fed</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-neutral-800 mt-2">{metrics.totalGuests}</div>
          <p className="text-[10px] text-neutral-400 mt-1 font-semibold">Active host seated accounts</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Total Tickets</span>
            <span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              📋
            </span>
          </div>
          <div className="text-2xl font-black text-neutral-800 mt-2">{metrics.count} <span className="text-xs font-normal text-neutral-450">bills</span></div>
          <p className="text-[10px] text-neutral-400 mt-1 font-semibold">Archived checking files</p>
        </div>
      </div>

      {/* SVG micro chart: Categories performance split */}
      {metrics.count > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-800">Culinary Revenue Distribution</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Performance indices broken down by kitchen department</p>
            </div>
            
            {/* Legend indicators */}
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold">
              {categoryChartData.map(c => (
                <div key={c.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                  <span className="text-neutral-500">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid distribution visualization */}
          <div className="space-y-4">
            <div className="h-6 w-full rounded-lg overflow-hidden flex bg-neutral-100">
              {categoryChartData.map((c, i) => (
                <div
                  key={c.name}
                  style={{ width: `${c.value > 0 ? c.percent : 0}%`, backgroundColor: c.hex }}
                  className="h-full transition-all duration-500 first:rounded-l-lg last:rounded-r-lg"
                  title={`${c.name}: ${c.percent}%`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              {categoryChartData.map(c => (
                <div key={c.name} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{c.name}</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-base font-black text-neutral-800">₹{c.value.toFixed(2)}</span>
                    <span className="text-xs font-bold" style={{ color: c.hex }}>{c.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Itemized archived check searches */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-4 md:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-800">Archive Log Book</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Chronologically ordered check records</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Payment Method Option Pills */}
            <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-200">
              {(['All', 'Cash', 'UPI', 'Card'] as const).map(method => {
                const isActive = selectedPaymentMethod === method;
                return (
                  <button
                    key={method}
                    onClick={() => setSelectedPaymentMethod(method)}
                    type="button"
                    className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-neutral-800 shadow-xs border border-neutral-200/40'
                        : 'text-neutral-500 hover:text-neutral-800 border border-transparent'
                    }`}
                  >
                    {method === 'All' ? 'All' : method === 'Cash' ? 'Cash 💵' : method === 'UPI' ? 'UPI 📱' : 'Card 💳'}
                  </button>
                );
              })}
            </div>

            {/* Unified Search Input (Table, Invoice, Guest, or Order Items) */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search table, invoice, guest, or items..."
                className="pl-9 pr-3 py-1.5 w-64 sm:w-80 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-800 tracking-wide placeholder-neutral-400 focus:border-neutral-400 focus:outline-none transition-all"
              />
            </div>

            {pastOrders.length > 0 && (
              <button
                onClick={onClearHistory}
                className="px-3 py-1.5 text-xs font-bold text-rose-650 hover:bg-rose-50 border border-rose-100 rounded-xl transition cursor-pointer"
              >
                Flush Logs
              </button>
            )}
          </div>
        </div>

        {/* Chronological expandable receipt grid */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-neutral-400 text-xs">
            No completed invoices logged under this specification.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const isExpanded = expandedOrderId === order.id;
              const cleanTime = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div 
                  key={order.id} 
                  className={`border rounded-2xl transition duration-200 ${
                    isExpanded ? 'border-neutral-300 bg-neutral-50/20 shadow-xs' : 'border-neutral-150 bg-white'
                  }`}
                >
                  {/* Primary Trigger panel row */}
                  <div 
                    onClick={() => toggleAccordion(order.id)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
                        T{order.tableNumber}
                      </div>

                      <div>
                        <div className="text-xs font-extrabold text-neutral-800">
                          Invoice ID: <span className="font-mono text-neutral-400">{order.id.slice(-5).toUpperCase()}</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-semibold mt-0.5 flex items-center flex-wrap gap-1">
                          <span>{cleanTime}</span> • <span>{order.guestCount} {order.guestCount === 1 ? 'Guest' : 'Guests'}</span>
                          {order.guestName && (
                            <span className="text-neutral-600 font-extrabold bg-neutral-150 px-1 rounded-sm"> • 👤 {order.guestName}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-black text-neutral-800">₹{order.total.toFixed(2)}</div>
                        <div className="text-[9px] font-bold uppercase mt-0.5 text-right">
                          <span className="text-emerald-600">PAID ✓</span>
                          {order.paymentMethod && (
                            <span className="text-neutral-500 font-semibold ml-1">
                              via {order.paymentMethod === 'UPI' ? 'UPI 📱' : order.paymentMethod === 'Cash' ? 'Cash 💵' : 'Card 💳'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button className="text-neutral-400 hover:text-neutral-700">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable detailed checkout summaries */}
                  {isExpanded && (
                    <div className="px-4 pb-5 pt-3 border-t border-dashed border-neutral-200 bg-neutral-50/50 rounded-b-2xl space-y-4">
                      {/* item list breakdown */}
                      <div className="space-y-2.5">
                        <div className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest pb-1 border-b border-neutral-200">
                          Food & Beverage Breakdown
                        </div>
                        
                        {order.items.map((itm, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <div className="font-semibold text-neutral-700">
                              <span>{itm.quantity}x</span> <span className="text-neutral-600 font-medium">{itm.name}</span>
                            </div>
                            <span className="font-bold text-neutral-800">₹{(itm.price * itm.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Calculations mathematics & Quick Print Actions */}
                      <div className="pt-3 border-t border-neutral-200 flex flex-col sm:flex-row gap-4 justify-between items-end">
                        {/* Quick Action buttons for Print and Image sharing */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => printReceipt({
                              id: order.id,
                              tableNumber: order.tableNumber,
                              items: order.items,
                              subtotal: order.subtotal,
                              serviceCharge: order.serviceCharge,
                              tax: order.tax,
                              total: order.total,
                              guestCount: order.guestCount,
                              timestamp: order.timestamp,
                              paymentMethod: order.paymentMethod,
                              guestName: order.guestName
                            })}
                            className="flex-1 sm:flex-initial py-2 px-3.5 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950 font-bold text-[11px] uppercase tracking-wider rounded-xl border border-neutral-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Printer size={13} className="text-orange-500" />
                            <span>Print Slip</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptForHub({
                              id: order.id,
                              tableNumber: order.tableNumber,
                              items: order.items,
                              subtotal: order.subtotal,
                              serviceCharge: order.serviceCharge,
                              tax: order.tax,
                              total: order.total,
                              guestCount: order.guestCount,
                              timestamp: order.timestamp,
                              paymentMethod: order.paymentMethod,
                              guestName: order.guestName
                            })}
                            className="flex-1 sm:flex-initial py-2 px-3.5 bg-neutral-950 hover:bg-neutral-850 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Share2 size={13} className="text-orange-400" />
                            <span>Receipt Hub</span>
                          </button>
                        </div>

                        <div className="w-full sm:w-1/2 space-y-1.5 text-xs text-right">
                          <div className="flex justify-between text-neutral-400 font-medium">
                            <span>Subtotal:</span>
                            <span className="font-semibold text-neutral-700">₹{order.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-neutral-400 font-medium">
                            <span>Service Charge (10%):</span>
                            <span className="font-semibold text-neutral-700">₹{order.serviceCharge.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-neutral-400 font-medium">
                            <span>Taxes (8%):</span>
                            <span className="font-semibold text-neutral-700">₹{order.tax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-neutral-800 font-extrabold pt-1 border-t border-neutral-200 text-sm">
                            <span>Amount Paid:</span>
                            <span className="text-orange-600">₹{order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt share and print hub overlay for past records */}
      <AnimatePresence>
        {selectedReceiptForHub && (
          <ReceiptActionModal
            data={selectedReceiptForHub}
            onClose={() => setSelectedReceiptForHub(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
