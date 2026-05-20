import React, { useState } from 'react';
import { Table, TableStatus } from '../types';
import { motion } from 'motion/react';
import { Users, Plus, ClipboardList, Filter, HelpCircle, UtensilsCrossed, Sparkles, Calendar, BookOpen } from 'lucide-react';

interface FloorViewProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
  onAddTable: (
    number: number, 
    capacity: number,
    size?: 'small' | 'medium' | 'large',
    shape?: 'square' | 'circle' | 'rectangle' | 'line'
  ) => void;
  onUpdateTable: (table: Table) => void;
}

export default function FloorView({ tables, onSelectTable, onAddTable, onUpdateTable }: FloorViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState<string>('');
  const [newTableCat, setNewTableCat] = useState<number>(4);
  const [newTableSize, setNewTableSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [newTableShape, setNewTableShape] = useState<'square' | 'circle' | 'rectangle' | 'line'>('square');
  const [errorMsg, setErrorMsg] = useState('');

  // Book Reservation State
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [resName, setResName] = useState('');
  const [resTime, setResTime] = useState('');
  const [resGuests, setResGuests] = useState<number>(2);
  const [resTableId, setResTableId] = useState<string>('');
  const [resNotes, setResNotes] = useState('');
  const [reserveError, setReserveError] = useState('');

  // Host Stand Quick Metrics
  const totalTables = tables.length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;
  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupancyPercentage = totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0;

  // Filter tables
  const filteredTables = tables.filter(table => {
    if (statusFilter === 'all') return true;
    return table.status === statusFilter;
  });

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newTableNum);
    if (isNaN(num) || num <= 0) {
      setErrorMsg('Please enter a valid table number.');
      return;
    }
    if (tables.some(t => t.number === num)) {
      setErrorMsg(`Table ${num} already exists.`);
      return;
    }
    setErrorMsg('');
    onAddTable(num, newTableCat, newTableSize, newTableShape);
    setNewTableNum('');
    setNewTableCat(4);
    setNewTableSize('medium');
    setNewTableShape('square');
    setShowAddModal(false);
  };

  const handleReserveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName.trim()) {
      setReserveError('Please enter guest name.');
      return;
    }
    if (!resTime) {
      setReserveError('Please select a reservation time.');
      return;
    }
    if (!resTableId) {
      setReserveError('Please select a dining table.');
      return;
    }

    const selected = tables.find(t => t.id === resTableId);
    if (!selected) {
      setReserveError('Selected table not found.');
      return;
    }

    const updated: Table = {
      ...selected,
      status: 'reserved',
      reservationName: resName,
      reservationTime: resTime,
      guestCount: resGuests,
      notes: resNotes ? `${selected.notes ? selected.notes + ' | ' : ''}${resNotes}` : selected.notes
    };

    onUpdateTable(updated);

    // Reset forms
    setResName('');
    setResTime('');
    setResGuests(2);
    setResTableId('');
    setResNotes('');
    setReserveError('');
    setShowReserveModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Key Performance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <UtensilsCrossed size={22} />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Occupancy</div>
            <div className="text-xl font-bold text-neutral-800">{occupancyPercentage}%</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Available</div>
            <div className="text-xl font-bold text-neutral-800">{availableCount} <span className="text-sm font-normal text-neutral-400">tables</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <Calendar size={22} />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Reservations</div>
            <div className="text-xl font-bold text-neutral-800">{reservedCount} <span className="text-sm font-normal text-neutral-400">booked</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-500">
            <Users size={22} />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Seating Capacity</div>
            <div className="text-xl font-bold text-neutral-800">
              {tables.reduce((acc, t) => acc + (t.status === 'occupied' ? t.guestCount : 0), 0)} / {tables.reduce((acc, t) => acc + t.capacity, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Filters + New Table button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-400 font-medium flex items-center gap-1.5 mr-2">
            <Filter size={15} /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Tables', count: totalTables },
            { id: 'available', label: 'Available', count: availableCount, colorClass: 'bg-emerald-500' },
            { id: 'occupied', label: 'Occupied', count: occupiedCount, colorClass: 'bg-orange-500' },
            { id: 'reserved', label: 'Reserved', count: reservedCount, colorClass: 'bg-blue-500' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition duration-200 cursor-pointer ${
                statusFilter === btn.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {btn.colorClass && <span className={`w-2 h-2 rounded-full ${btn.colorClass}`} />}
              {btn.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                statusFilter === btn.id ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-200/60 text-neutral-500'
              }`}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => {
              const firstAvail = tables.find(t => t.status === 'available');
              if (firstAvail) setResTableId(firstAvail.id);
              setShowReserveModal(true);
            }}
            className="flex items-center justify-center gap-1.5 bg-neutral-900 border border-neutral-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-800 active:scale-95 transition cursor-pointer shadow-sm self-stretch sm:self-auto"
          >
            <Calendar size={15} className="text-orange-500" /> Book Reservation
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 active:scale-95 transition cursor-pointer shadow-sm shadow-orange-500/10 self-stretch sm:self-auto"
          >
            <Plus size={16} /> Add Table
          </button>
        </div>
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTables.map(table => {
          const orderTotal = table.currentOrder.reduce((acc, item) => acc + (item.priceAtOrder * item.quantity), 0);
          const size = table.size || 'medium';
          const shape = table.shape || 'square';

          let sizeCardClass = 'min-h-[290px] col-span-1';
          if (size === 'small') {
            sizeCardClass = 'min-h-[250px] col-span-1';
          } else if (size === 'large') {
            sizeCardClass = 'min-h-[310px] sm:col-span-1 md:col-span-2';
          }

          let innerShapeClass = 'w-20 h-20 rounded-2xl';
          if (shape === 'circle') {
            innerShapeClass = 'w-20 h-20 rounded-full';
          } else if (shape === 'rectangle') {
            innerShapeClass = 'w-32 h-20 rounded-xl';
          } else if (shape === 'line') {
            innerShapeClass = 'w-20 h-20 rounded-lg border-2 border-dashed bg-transparent';
          }

          const statusColorClasses = 
            table.status === 'occupied' ? 'bg-orange-50 text-orange-600 border-orange-200' :
            table.status === 'reserved' ? 'bg-blue-50 text-blue-600 border-blue-200' :
            'bg-emerald-50 text-emerald-600 border-emerald-200';

          return (
            <motion.div
              key={table.id}
              layoutId={`table-card-${table.id}`}
              onClick={() => onSelectTable(table)}
              className={`group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md border border-neutral-100 cursor-pointer relative flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${sizeCardClass}`}
            >
              {/* Table Status Light Bubble */}
              <div className="absolute top-5 right-5 flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full ${
                  table.status === 'occupied' ? 'bg-orange-500 shadow-sm shadow-orange-500/20 animate-pulse' :
                  table.status === 'reserved' ? 'bg-blue-500 shadow-sm shadow-blue-500/20' :
                  'bg-emerald-500 shadow-sm shadow-emerald-500/20'
                }`} />
              </div>

              {/* Central Dynamic Visual */}
              <div className="flex flex-col items-center justify-center pt-4">
                <div className={`flex items-center justify-center text-3xl mb-3 transition-colors duration-300 ${innerShapeClass} ${statusColorClasses}`}>
                  {table.status === 'occupied' ? '👥' : table.status === 'reserved' ? '📅' : '✨'}
                </div>

                <div className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest">Table</div>
                <div className="text-5xl font-black text-neutral-800 tracking-tight mt-1 group-hover:scale-105 transition-transform duration-300">
                  {table.number}
                </div>
                
                {/* Visual shape & size indicators */}
                <span className="mt-2 px-2.5 py-0.5 rounded-full bg-neutral-50 border border-neutral-100/60 text-[9px] font-extrabold text-neutral-450 uppercase tracking-wider">
                  {size} • {shape}
                </span>
              </div>

              {/* Dynamic Bottom Badge / Context Tracker */}
              <div className="mt-5 pt-4 border-t border-dashed border-neutral-100">
                {table.status === 'occupied' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
                      <span className="flex items-center gap-1 text-orange-600">
                        <Users size={12} /> {table.guestCount} {table.guestCount === 1 ? 'Guest' : 'Guests'}
                      </span>
                      <span>₹{orderTotal.toFixed(2)}</span>
                    </div>
                    {table.currentOrder.length > 0 ? (
                      <div className="text-[11px] text-neutral-400 line-clamp-1 italic font-medium">
                        {table.currentOrder.map(itm => `${itm.quantity}x ${itm.name}`).join(', ')}
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-300 font-medium">Seated • No items ordered yet</div>
                    )}
                  </div>
                ) : table.status === 'reserved' ? (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                      <Calendar size={13} /> Reserved
                    </div>
                    <div className="text-[11px] text-neutral-700 font-bold truncate">
                      {table.reservationName || 'Guest'}
                    </div>
                    {table.reservationTime && (
                      <div className="text-[10px] text-neutral-400 font-semibold">
                        Expected @ {table.reservationTime}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                      Available
                    </div>
                    <div className="text-[10px] text-neutral-400 font-medium mt-0.5">
                      Fits up to {table.capacity} guests
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

        {/* Dynamic Modal for adding tables */}
        {showAddModal && (
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative border border-neutral-100"
            >
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Create Dining Table</h2>
              <p className="text-xs text-neutral-400 mb-4">Introduce a new node to the restaurant floor planner instantly.</p>

              <form onSubmit={handleAddTableSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Table Number</label>
                  <input
                    type="number"
                    value={newTableNum}
                    onChange={(e) => setNewTableNum(e.target.value)}
                    placeholder="e.g. 9"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Seating Capacity</label>
                  <div className="flex gap-2">
                    {[2, 4, 6, 8].map(cap => (
                       <button
                        type="button"
                        key={cap}
                        onClick={() => setNewTableCat(cap)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                          newTableCat === cap
                            ? 'bg-orange-600 text-white'
                            : 'bg-neutral-50 text-neutral-600 border border-neutral-100 hover:bg-neutral-100'
                        }`}
                      >
                        {cap} Pax
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Size Setting */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Physical Card Size</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'small', label: 'Small' },
                      { id: 'medium', label: 'Medium' },
                      { id: 'large', label: 'Large (Elongated)' }
                    ].map(sz => (
                      <button
                        type="button"
                        key={sz.id}
                        onClick={() => setNewTableSize(sz.id as any)}
                        className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition duration-200 cursor-pointer ${
                          newTableSize === sz.id
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-50 text-neutral-600 border border-neutral-100 hover:bg-neutral-100'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Shape Setting */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Table Geometric Shape</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'square', label: 'Square ⏹' },
                      { id: 'circle', label: 'Circle ⏺' },
                      { id: 'rectangle', label: 'Rectangle ▬' },
                      { id: 'line', label: 'Line / Bar 🔘' }
                    ].map(shp => (
                      <button
                        type="button"
                        key={shp.id}
                        onClick={() => setNewTableShape(shp.id as any)}
                        className={`py-2 rounded-xl text-[11px] font-bold transition duration-200 cursor-pointer ${
                          newTableShape === shp.id
                            ? 'bg-orange-600 text-white'
                            : 'bg-neutral-50 text-neutral-600 border border-neutral-100 hover:bg-neutral-100'
                        }`}
                      >
                        {shp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {errorMsg && (
                  <div className="text-xs font-semibold text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 text-neutral-500 rounded-xl hover:bg-neutral-50 font-bold border border-neutral-100 transition cursor-pointer text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl font-bold transition cursor-pointer text-sm"
                  >
                    Add Table
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Dynamic Modal for booking reservations */}
        {showReserveModal && (
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-neutral-100"
            >
              <h2 className="text-xl font-black text-neutral-900 mb-1 flex items-center gap-2">
                <Calendar size={22} className="text-orange-500" /> Book Reservation
              </h2>
              <p className="text-xs text-neutral-400 mb-5">Secure a spot in the reservation book and assign it to a table nodeset.</p>

              <form onSubmit={handleReserveSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Guest Name</label>
                  <input
                    type="text"
                    value={resName}
                    onChange={(e) => setResName(e.target.value)}
                    placeholder="e.g. Alexis Carter"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Expected Time</label>
                    <input
                      type="time"
                      value={resTime}
                      onChange={(e) => setResTime(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Guest Count</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={resGuests}
                      onChange={(e) => setResGuests(parseInt(e.target.value) || 2)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                </div>

                {/* Capacity warning alert */}
                {(() => {
                  const selectedTable = tables.find(t => t.id === resTableId);
                  if (selectedTable && resGuests > selectedTable.capacity) {
                    return (
                      <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl flex items-center gap-1.5 animate-pulse">
                        ⚠️ Caution: guest count ({resGuests}) exceeds selected table capacity ({selectedTable.capacity} Pax).
                      </div>
                    );
                  }
                  return null;
                })()}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Assign Dining Table</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 border border-neutral-200 rounded-xl p-2 bg-neutral-50/50">
                    {(() => {
                      const availableTables = tables.filter(t => t.status === 'available');
                      if (availableTables.length === 0) {
                        return (
                          <div className="col-span-2 text-center py-6 text-xs text-neutral-400 font-semibold italic">
                            ⚠️ No available tables to assign. Please checkout or clear a table first.
                          </div>
                        );
                      }
                      return availableTables.map(t => {
                        const isSelected = resTableId === t.id;
                        return (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() => setResTableId(t.id)}
                            className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-xs ring-2 ring-orange-500/10'
                                : 'border-neutral-200/80 bg-white text-neutral-800 hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold text-xs text-neutral-800">Table {t.number}</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Available" />
                            </div>
                            <div className="text-[10px] text-neutral-400 font-semibold mt-1">
                              Fits {t.capacity} Pax
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Special Requests / Notes</label>
                  <textarea
                    value={resNotes}
                    onChange={(e) => setResNotes(e.target.value)}
                    placeholder="e.g. Window seat requested, anniversary"
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition resize-none"
                  />
                </div>

                {reserveError && (
                  <div className="text-xs font-semibold text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100 animate-shake">
                    {reserveError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReserveModal(false)}
                    className="flex-1 py-3 text-neutral-500 rounded-xl hover:bg-neutral-50 font-bold border border-neutral-100 transition cursor-pointer text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl font-bold transition cursor-pointer text-sm"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
    </div>
  );
}
