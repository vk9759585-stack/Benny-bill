import React, { useState, useMemo } from 'react';
import { MenuItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Sparkles, Filter, Archive, Check, Edit2, AlertCircle, ShoppingCart } from 'lucide-react';

interface MenuViewProps {
  menuItems: MenuItem[];
  onUpdateMenuItem: (updatedItem: MenuItem) => void;
  onAddMenuItem: (newItem: MenuItem) => void;
}

export default function MenuView({ menuItems, onUpdateMenuItem, onAddMenuItem }: MenuViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Menu Item form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<'Appetizers' | 'Main Course' | 'Desserts' | 'Drinks'>('Main Course');
  const [emoji, setEmoji] = useState('🍔');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Editing pricing states
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');

  // Quick Emoji picker lists
  const EMOJI_OPTIONS = ['🍔', '🥩', '🍕', '🍣', '🍟', '🐟', '🍄', '🍜', '🍝', '🥗', '☕', '🥤', '🍷', '🍺', '🥃', '🍵', '🍮', '🍰', '🍫', '🍨', '🍓', '🍋'];

  // Filters logic
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const handleToggleStock = (item: MenuItem) => {
    onUpdateMenuItem({
      ...item,
      inStock: !item.inStock
    });
  };

  const handleStartPriceEdit = (item: MenuItem) => {
    setEditingPriceId(item.id);
    setTempPrice(item.price.toString());
  };

  const handleSavePriceEdit = (item: MenuItem) => {
    const parsedPrice = parseFloat(tempPrice);
    if (!isNaN(parsedPrice) && parsedPrice >= 0) {
      onUpdateMenuItem({
        ...item,
        price: Number(parsedPrice.toFixed(2))
      });
    }
    setEditingPriceId(null);
  };

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a name.');
      return;
    }
    const val = parseFloat(price);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Please enter a valid price.');
      return;
    }

    const newItem: MenuItem = {
      id: 'm-' + Date.now(),
      name: name,
      price: val,
      category: category,
      emoji: emoji,
      description: description || 'Special house recommendation prepared daily with select organic ingredients.',
      inStock: true
    };

    onAddMenuItem(newItem);
    
    // Clear form states
    setName('');
    setPrice('');
    setCategory('Main Course');
    setEmoji('🍔');
    setDescription('');
    setErrorMsg('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner section */}
      <div className="bg-neutral-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Decorative ambient blobs */}
        <div className="absolute top-1/2 left-3/4 -translate-y-1/2 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-orange-600/30 text-orange-400 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 border border-orange-500/20">
              <Sparkles size={12} /> Menu Admin
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Culinary & Beverages Editor</h2>
          <p className="text-xs text-neutral-400 font-medium max-w-md">
            Publish dishes, toggle ingredients availability, manage live restaurant pricing, and set stock status on the fly.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-orange-600 border border-orange-500 hover:bg-orange-700 font-bold px-4 py-2.5 rounded-xl text-sm transition duration-200 cursor-pointer shadow-sm shadow-orange-500/10"
        >
          <Plus size={16} /> Create Item
        </button>
      </div>

      {/* Categories filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {['All', 'Appetizers', 'Main Course', 'Desserts', 'Drinks'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition duration-200 cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-neutral-900 text-white' 
                  : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Live Search input */}
        <div className="relative min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search catalog by keyword..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Menu dishes list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredItems.map(item => (
            <motion.div
              layout
              key={item.id}
              className={`bg-white rounded-3xl p-5 shadow-xs border border-neutral-100 flex flex-col justify-between min-h-[220px] transition hover:shadow-md ${
                !item.inStock ? 'border-neutral-200/80 bg-neutral-50/50' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-2xl">
                    {item.emoji}
                  </div>
                  
                  {/* Category Pill Tag */}
                  <span className="text-[10px] bg-neutral-50 border border-neutral-200 px-2.5 py-0.5 rounded-full text-neutral-400 font-bold tracking-wider uppercase">
                    {item.category}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-neutral-800 text-sm truncate">{item.name}</h4>
                    {!item.inStock && (
                      <span className="text-[8px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-md font-bold uppercase border border-rose-100 flex-shrink-0">
                        Sold Out
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 font-medium leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Bottom live settings controls */}
              <div className="mt-5 pt-4 border-t border-dashed border-neutral-150 flex items-center justify-between">
                {/* Price editor block */}
                <div className="flex items-center gap-1.5">
                  {editingPriceId === item.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-neutral-400">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        className="w-16 px-1.5 py-1 text-xs border border-neutral-300 rounded font-bold text-neutral-800 focus:outline-none focus:border-orange-500"
                        placeholder="0.00"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSavePriceEdit(item)}
                        className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                      >
                        <Check size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1group">
                      <span className="text-sm font-black text-neutral-800">₹{item.price.toFixed(2)}</span>
                      <button
                        onClick={() => handleStartPriceEdit(item)}
                        className="p-1 rounded text-neutral-400 hover:text-orange-600 transition cursor-pointer"
                      >
                        <Edit2 size={11} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Stock Toggle button */}
                <button
                  onClick={() => handleToggleStock(item)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition duration-200 cursor-pointer ${
                    item.inStock 
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  {item.inStock ? '🟢 Active' : '🔴 Sold Out'}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-12 text-neutral-400">
            <span className="text-3xl">🧩</span>
            <div className="text-sm font-bold mt-2">No culinary items matches query.</div>
            <p className="text-xs text-neutral-300">Try modifying search term or creating new items.</p>
          </div>
        )}
      </div>

      {/* Sliding Dialog Modal to Add Culinary Items */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-neutral-100 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-black text-neutral-900 mb-1">Create House Delicacy</h2>
            <p className="text-xs text-neutral-400 mb-6">Instantly publish a new food check, beverage node, or confectionery choice.</p>

            <form onSubmit={handleCreateMenuItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-1.5">Dish Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lobster thermidor"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-1.5">Price (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 48.00"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-1.5">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Appetizers', 'Main Course', 'Desserts', 'Drinks'] as const).map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`py-2 rounded-xl text-[10px] font-bold transition duration-200 cursor-pointer border ${
                        category === cat 
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' 
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200/50 hover:bg-neutral-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji icon select */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-1.5">
                  Emoji Icon Accent: <span className="text-neutral-800 font-bold ml-1">{emoji}</span>
                </label>
                <div className="flex flex-wrap gap-1.5 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 max-h-[100px] overflow-y-auto">
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setEmoji(em)}
                      className={`text-lg w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition ${
                        emoji === em ? 'bg-orange-600 text-white scale-110 shadow-sm' : 'hover:bg-neutral-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Culinary Description */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-1.5">Chef's Notes / Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ingredients origin, spice level warnings, gluten free details, or allergy recommendations..."
                  rows={3}
                  className="w-full bg-white p-3.5 rounded-2xl border border-neutral-200 text-xs font-semibold text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-lg border border-rose-100">
                  <AlertCircle size={15} /> {errorMsg}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-neutral-500 rounded-xl hover:bg-neutral-50 font-bold border border-neutral-150 transition cursor-pointer text-xs"
                >
                  Close Pane
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl font-bold transition cursor-pointer text-xs"
                >
                  Publish Recipe
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
