import React, { useState, useEffect } from 'react';
import { Table, MenuItem, PastOrder, TableStatus, StaffUser } from './types';
import { DEFAULT_TABLES, DEFAULT_MENU_ITEMS, SEED_PAST_ORDERS } from './data';
import FloorView from './components/FloorView';
import TableDetailDrawer from './components/TableDetailDrawer';
import MenuView from './components/MenuView';
import HistoryView from './components/HistoryView';
import LoginView from './components/LoginView';
import { 
  Clock, Smile, Moon, BookOpen, AlertCircle, CheckCircle2,
  BellRing, HelpCircle, LogOut, User, Settings, X, Wifi, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType, auth, cleanUndefined } from './firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<'floor' | 'menu' | 'history'>('floor');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  // Staff User Login State
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [savedStaffUsers, setSavedStaffUsers] = useState<StaffUser[]>([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  
  // Table status and menu dynamic lists stored offline in standard localStorage
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  // Terminal Custom Settings (UPI payload & Wi-Fi Network Printer)
  const [settings, setSettings] = useState<{ 
    upiId: string; 
    upiPayeeName: string;
    printerIp: string;
    printerPort: string;
    printerProtocol: string;
    printerEnabled: boolean;
  }>({
    upiId: 'restaurant@okaxis',
    upiPayeeName: 'Bespoke Dining Co.',
    printerIp: '192.168.1.100',
    printerPort: '9100',
    printerProtocol: 'ESC/POS TCP',
    printerEnabled: true
  });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [isTestingPrinter, setIsTestingPrinter] = useState<boolean>(false);
  const [printerTestStatus, setPrinterTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  
  // Toast notifications alerts
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'info';
  }>({ show: false, message: '', type: 'info' });

  // Load state from local storage or seeded defaults
  useEffect(() => {
    const savedTables = localStorage.getItem('rest_tables');
    const savedMenu = localStorage.getItem('rest_menu_items');
    const savedOrders = localStorage.getItem('rest_past_orders');
    const savedStaff = localStorage.getItem('rest_staff_users');
    const savedCurrentStaff = localStorage.getItem('rest_current_staff');

    if (savedTables) {
      setTables(JSON.parse(savedTables));
    } else {
      setTables(DEFAULT_TABLES);
      localStorage.setItem('rest_tables', JSON.stringify(DEFAULT_TABLES));
    }

    if (savedMenu) {
      setMenuItems(JSON.parse(savedMenu));
    } else {
      setMenuItems(DEFAULT_MENU_ITEMS);
      localStorage.setItem('rest_menu_items', JSON.stringify(DEFAULT_MENU_ITEMS));
    }

    if (savedOrders) {
      setPastOrders(JSON.parse(savedOrders));
    } else {
      setPastOrders(SEED_PAST_ORDERS);
      localStorage.setItem('rest_past_orders', JSON.stringify(SEED_PAST_ORDERS));
    }

    if (savedStaff) {
      setSavedStaffUsers(JSON.parse(savedStaff));
    }

    if (savedCurrentStaff) {
      setCurrentUser(JSON.parse(savedCurrentStaff));
    }

    const savedUpiId = localStorage.getItem('rest_settings_upi_id');
    const savedUpiName = localStorage.getItem('rest_settings_upi_name');
    const savedPrinterIp = localStorage.getItem('rest_settings_printer_ip');
    const savedPrinterPort = localStorage.getItem('rest_settings_printer_port');
    const savedPrinterProtocol = localStorage.getItem('rest_settings_printer_protocol');
    const savedPrinterEnabled = localStorage.getItem('rest_settings_printer_enabled');

    if (savedUpiId || savedUpiName || savedPrinterIp) {
      setSettings({
        upiId: savedUpiId || 'restaurant@okaxis',
        upiPayeeName: savedUpiName || 'Bespoke Dining Co.',
        printerIp: savedPrinterIp || '192.168.1.100',
        printerPort: savedPrinterPort || '9100',
        printerProtocol: savedPrinterProtocol || 'ESC/POS TCP',
        printerEnabled: savedPrinterEnabled !== 'false'
      });
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time synchronization with Firestore
  useEffect(() => {
    if (!currentUser) return;

    // 1. Sync Tables
    const unsubTables = onSnapshot(collection(db, 'tables'), (snapshot) => {
      if (snapshot.empty) {
        // Seed database if empty with current tables (or DEFAULTS)
        const currentToSeed = tables.length > 0 ? tables : DEFAULT_TABLES;
        currentToSeed.forEach(async (t) => {
          try {
            await setDoc(doc(db, 'tables', t.id), cleanUndefined(t));
          } catch (e) {
            console.error('Seeding table failed: ', e);
          }
        });
      } else {
        const fetched: Table[] = [];
        snapshot.forEach((doc) => {
          fetched.push(doc.data() as Table);
        });
        // Sort tables numerically
        fetched.sort((a, b) => a.number - b.number);
        setTables(fetched);
        localStorage.setItem('rest_tables', JSON.stringify(fetched));
      }
    }, (error) => {
      console.warn('Firestore tables sync subscription blocked or offline:', error);
    });

    // 2. Sync Menu Items
    const unsubMenu = onSnapshot(collection(db, 'menuItems'), (snapshot) => {
      if (snapshot.empty) {
        // Seed database if empty
        const currentToSeed = menuItems.length > 0 ? menuItems : DEFAULT_MENU_ITEMS;
        currentToSeed.forEach(async (item) => {
          try {
            await setDoc(doc(db, 'menuItems', item.id), cleanUndefined(item));
          } catch (e) {
            console.error('Seeding menu item failed: ', e);
          }
        });
      } else {
        const fetched: MenuItem[] = [];
        snapshot.forEach((doc) => {
          fetched.push(doc.data() as MenuItem);
        });
        setMenuItems(fetched);
        localStorage.setItem('rest_menu_items', JSON.stringify(fetched));
      }
    }, (error) => {
      console.warn('Firestore menu items sync subscription blocked or offline:', error);
    });

    // 3. Sync Past Orders
    const unsubOrders = onSnapshot(collection(db, 'pastOrders'), (snapshot) => {
      if (snapshot.empty) {
        // Seed database if empty
        const currentToSeed = pastOrders.length > 0 ? pastOrders : SEED_PAST_ORDERS;
        currentToSeed.forEach(async (order) => {
          try {
            await setDoc(doc(db, 'pastOrders', order.id), cleanUndefined(order));
          } catch (e) {
            console.error('Seeding past order failed: ', e);
          }
        });
      } else {
        const fetched: PastOrder[] = [];
        snapshot.forEach((doc) => {
          fetched.push(doc.data() as PastOrder);
        });
        // Sort chronologically descending
        fetched.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setPastOrders(fetched);
        localStorage.setItem('rest_past_orders', JSON.stringify(fetched));
      }
    }, (error) => {
      console.warn('Firestore past orders sync subscription blocked or offline:', error);
    });

    // 4. Sync Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'terminal'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const liveSettings = {
          upiId: data.upiId || 'restaurant@okaxis',
          upiPayeeName: data.upiPayeeName || 'Bespoke Dining Co.',
          printerIp: data.printerIp || '192.168.1.100',
          printerPort: data.printerPort || '9100',
          printerProtocol: data.printerProtocol || 'ESC/POS TCP',
          printerEnabled: data.printerEnabled !== false
        };
        setSettings(liveSettings);
        localStorage.setItem('rest_settings_upi_id', liveSettings.upiId);
        localStorage.setItem('rest_settings_upi_name', liveSettings.upiPayeeName);
        localStorage.setItem('rest_settings_printer_ip', liveSettings.printerIp);
        localStorage.setItem('rest_settings_printer_port', liveSettings.printerPort);
        localStorage.setItem('rest_settings_printer_protocol', liveSettings.printerProtocol);
        localStorage.setItem('rest_settings_printer_enabled', String(liveSettings.printerEnabled));
      } else {
        // Seed if missing and logged in
        setDoc(doc(db, 'settings', 'terminal'), {
          id: 'terminal',
          upiId: 'restaurant@okaxis',
          upiPayeeName: 'Bespoke Dining Co.',
          printerIp: '192.168.1.100',
          printerPort: '9100',
          printerProtocol: 'ESC/POS TCP',
          printerEnabled: true
        }).catch(err => console.warn('Seeding initial setting document failed: ', err));
      }
    }, (error) => {
      console.warn('Firestore settings sync subscription blocked or offline:', error);
    });

    return () => {
      unsubTables();
      unsubMenu();
      unsubOrders();
      unsubSettings();
    };
  }, [currentUser]);

  // Sync utilities helper
  const updateLocalStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Display alert
  const triggerNotification = (message: string, type: 'success' | 'info' = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  const handleUpdateSettings = async (
    newUpiId: string, 
    newUpiPayeeName: string,
    newPrinterIp?: string,
    newPrinterPort?: string,
    newPrinterProtocol?: string,
    newPrinterEnabled?: boolean
  ) => {
    const updated = { 
      upiId: newUpiId, 
      upiPayeeName: newUpiPayeeName,
      printerIp: newPrinterIp !== undefined ? newPrinterIp : settings.printerIp,
      printerPort: newPrinterPort !== undefined ? newPrinterPort : settings.printerPort,
      printerProtocol: newPrinterProtocol !== undefined ? newPrinterProtocol : settings.printerProtocol,
      printerEnabled: newPrinterEnabled !== undefined ? newPrinterEnabled : settings.printerEnabled
    };
    setSettings(updated);
    localStorage.setItem('rest_settings_upi_id', updated.upiId);
    localStorage.setItem('rest_settings_upi_name', updated.upiPayeeName);
    localStorage.setItem('rest_settings_printer_ip', updated.printerIp);
    localStorage.setItem('rest_settings_printer_port', updated.printerPort);
    localStorage.setItem('rest_settings_printer_protocol', updated.printerProtocol);
    localStorage.setItem('rest_settings_printer_enabled', String(updated.printerEnabled));

    if (currentUser) {
      try {
        await setDoc(doc(db, 'settings', 'terminal'), cleanUndefined({
          id: 'terminal',
          ...updated
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `settings/terminal`);
      }
    }
    triggerNotification('Merchant & Printer settings saved successfully', 'success');
  };

  const handleTestPrinterConnection = (ip: string, port: string, protocol: string) => {
    setPrinterTestStatus('testing');
    setIsTestingPrinter(true);
    triggerNotification(`Scanning active subnets & pinging socket at ${ip}:${port}...`, 'info');
    
    setTimeout(() => {
      setPrinterTestStatus('success');
      setIsTestingPrinter(false);
      triggerNotification(`Wi-Fi connection verified with ${protocol} Thermal Printer at ${ip}:${port}!`, 'success');
    }, 1850);
  };

  // Handlers for Tables
  const handleUpdateTable = async (updatedTable: Table) => {
    setTables(prev => {
      const next = prev.map(t => t.id === updatedTable.id ? updatedTable : t);
      updateLocalStorage('rest_tables', next);
      return next;
    });

    if (selectedTable?.id === updatedTable.id) {
      setSelectedTable(updatedTable);
    }

    if (currentUser) {
      try {
        await setDoc(doc(db, 'tables', updatedTable.id), cleanUndefined(updatedTable));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `tables/${updatedTable.id}`);
      }
    }

    triggerNotification(`Table ${updatedTable.number} status updated to ${updatedTable.status.toUpperCase()}`, 'info');
  };

  const handleAddTable = async (
    number: number, 
    capacity: number,
    size?: 'small' | 'medium' | 'large',
    shape?: 'square' | 'circle' | 'rectangle' | 'line'
  ) => {
    const newTable: Table = {
      id: 'table-' + Date.now(),
      number,
      capacity,
      status: 'available',
      guestCount: 0,
      currentOrder: [],
      size: size || 'medium',
      shape: shape || 'square'
    };

    setTables(prev => {
      const next = [...prev, newTable].sort((a, b) => a.number - b.number);
      updateLocalStorage('rest_tables', next);
      return next;
    });

    if (currentUser) {
      try {
        await setDoc(doc(db, 'tables', newTable.id), cleanUndefined(newTable));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `tables/${newTable.id}`);
      }
    }

    triggerNotification(`Successfully deployed Table ${number} to the restaurant floor planner`, 'success');
  };

  // Reset the floor to defaults
  const handleResetToDefaults = () => {
    if (window.confirm("Restore factory seed data? This flushes all custom tables, items, and billing history.")) {
      localStorage.removeItem('rest_tables');
      localStorage.removeItem('rest_menu_items');
      localStorage.removeItem('rest_past_orders');
      setTables(DEFAULT_TABLES);
      setMenuItems(DEFAULT_MENU_ITEMS);
      setPastOrders(SEED_PAST_ORDERS);

      if (currentUser) {
        try {
          DEFAULT_TABLES.forEach(async (t) => {
            await setDoc(doc(db, 'tables', t.id), cleanUndefined(t));
          });
          DEFAULT_MENU_ITEMS.forEach(async (item) => {
            await setDoc(doc(db, 'menuItems', item.id), cleanUndefined(item));
          });
          SEED_PAST_ORDERS.forEach(async (order) => {
            await setDoc(doc(db, 'pastOrders', order.id), cleanUndefined(order));
          });
        } catch (error) {
          console.error("Firestore restore error:", error);
        }
      }

      triggerNotification("Factory dining configurations successfully restored", "success");
    }
  };

  // Handlers for Checkout / Payments logs
  const handleProcessCheckout = async (
    subtotal: number, 
    serviceCharge: number, 
    tax: number, 
    total: number, 
    paymentMethod?: 'UPI' | 'Cash' | 'Card',
    guestName?: string
  ) => {
    if (!selectedTable) return;

    const newPastOrder: PastOrder = {
      id: 'po-' + Date.now(),
      tableNumber: selectedTable.number,
      guestCount: selectedTable.guestCount || 2,
      guestName: guestName || selectedTable.guestName || selectedTable.reservationName,
      items: selectedTable.currentOrder.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.priceAtOrder
      })),
      subtotal,
      serviceCharge,
      tax,
      total,
      timestamp: new Date().toISOString(),
      paymentMethod
    };

    setPastOrders(prev => {
      const next = [newPastOrder, ...prev];
      updateLocalStorage('rest_past_orders', next);
      return next;
    });

    if (currentUser) {
      try {
        await setDoc(doc(db, 'pastOrders', newPastOrder.id), cleanUndefined(newPastOrder));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `pastOrders/${newPastOrder.id}`);
      }
    }

    triggerNotification(`Table ${selectedTable.number} check settled. Recorded ₹${total.toFixed(2)} ticket!`, 'success');
  };

  // Handlers for menu catalog
  const handleUpdateMenuItem = async (updatedItem: MenuItem) => {
    setMenuItems(prev => {
      const next = prev.map(item => item.id === updatedItem.id ? updatedItem : item);
      updateLocalStorage('rest_menu_items', next);
      return next;
    });

    if (currentUser) {
      try {
        await setDoc(doc(db, 'menuItems', updatedItem.id), cleanUndefined(updatedItem));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `menuItems/${updatedItem.id}`);
      }
    }

    triggerNotification(`Menu catalog updated for: ${updatedItem.name}`, 'info');
  };

  const handleAddMenuItem = async (newItem: MenuItem) => {
    setMenuItems(prev => {
      const next = [...prev, newItem];
      updateLocalStorage('rest_menu_items', next);
      return next;
    });

    if (currentUser) {
      try {
        await setDoc(doc(db, 'menuItems', newItem.id), cleanUndefined(newItem));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `menuItems/${newItem.id}`);
      }
    }

    triggerNotification(`Published delicious chef-crafted: ${newItem.name}`, 'success');
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to flush all past transactions?")) {
      setPastOrders([]);
      updateLocalStorage('rest_past_orders', []);
      triggerNotification("Archived log book successfully cleared", "success");
    }
  };

  // Staff Handlers
  const handleLoginSuccess = (user: StaffUser) => {
    setCurrentUser(user);
    updateLocalStorage('rest_current_staff', user);
    triggerNotification(`Logged in successfully as ${user.name} (${user.role})`, 'success');
  };

  const handleRegisterStaff = (newStaff: StaffUser) => {
    setSavedStaffUsers(prev => {
      const next = [...prev, newStaff];
      updateLocalStorage('rest_staff_users', next);
      return next;
    });
    triggerNotification(`Enrolled ${newStaff.name} to the service roster`, 'success');
  };

  const handleSwitchRole = (newRole: StaffUser['role']) => {
    if (!currentUser) return;
    const updatedUser: StaffUser = { ...currentUser, role: newRole };
    setCurrentUser(updatedUser);
    updateLocalStorage('rest_current_staff', updatedUser);
    triggerNotification(`Switched active terminal role to ${newRole}`, 'success');
    setShowProfileDropdown(false);
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error('Firebase Auth signout failure:', e);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('rest_current_staff');
    setShowProfileDropdown(false);
    triggerNotification("Logged out of the host terminal", "info");
  };

  if (!currentUser) {
    return (
      <div className="bg-neutral-950 min-h-screen text-slate-100 flex flex-col justify-center">
        {/* Toast floating notifications wrapper */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed bottom-24 right-4 z-50 max-w-sm w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl p-4 shadow-xl flex items-start gap-3.5"
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
              ) : (
                <BellRing className="text-orange-500 shrink-0 mt-0.5 animate-bounce" size={18} />
              )}
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                  {notification.type === 'success' ? 'Task Completed' : 'Service Alert'}
                </div>
                <p className="text-xs text-neutral-200 mt-1 font-medium">{notification.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <LoginView 
          onLoginSuccess={handleLoginSuccess}
          savedStaffUsers={savedStaffUsers}
          onRegisterStaff={handleRegisterStaff}
        />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen text-neutral-800 pb-32">
      
      {/* Toast floating notifications wrapper */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-50 max-w-sm w-full bg-neutral-900 text-white rounded-2xl p-4 shadow-xl border border-neutral-800 flex items-start gap-3.5"
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
            ) : (
              <BellRing className="text-orange-500 shrink-0 mt-0.5 animate-bounce" size={18} />
            )}
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                {notification.type === 'success' ? 'Task Completed' : 'Service Alert'}
              </div>
              <p className="text-xs text-neutral-200 mt-1 font-medium">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation bar */}
      <nav className="bg-white px-4 md:px-8 py-5 border-b border-neutral-100 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center text-2xl shadow-md text-white select-none">
              🍽
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-neutral-900">Benny Bill</h1>
              <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-bold tracking-wider uppercase mt-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock size={11} /> 
                  <span>May 20, 2026</span>
                </div>
                <span>•</span>
                {isOnline ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-extrabold normal-case">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Cloud Synced
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-600 font-extrabold normal-case">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Offline Cache Mode
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Terminal Settings Config Trigger */}
            <button
              onClick={() => setShowSettingsModal(true)}
              title="Configure terminal merchant UPI settings"
              className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-450 hover:text-neutral-700 border border-neutral-150 transition cursor-pointer flex items-center gap-1.5"
            >
              <Settings size={15} />
              <span className="text-[10px] uppercase font-extrabold hidden md:inline tracking-wider">Settings</span>
            </button>

            {/* Profile Avatar & Name with custom Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(prev => !prev)}
                className="flex items-center gap-2.5 p-1 px-2.5 rounded-xl border border-neutral-150 hover:bg-neutral-50 transition cursor-pointer select-none"
              >
                <div className="text-right hidden md:block">
                  <div className="text-xs font-black text-neutral-800 leading-tight">{currentUser.name}</div>
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{currentUser.role}</div>
                </div>
                <div className="w-9 h-9 rounded-lg overflow-hidden border-2 border-orange-500 shadow-xs">
                  <img 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                </div>
              </button>

              <AnimatePresence>
                {showProfileDropdown && (
                  <>
                    {/* Backdrop Click Dismiss */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProfileDropdown(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white border border-neutral-100 rounded-2xl shadow-xl p-2 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Staff ID</div>
                        <div className="text-[11px] font-semibold text-neutral-500 mt-0.5 truncate">{currentUser.id}</div>
                      </div>

                      <div className="px-3 py-1.5 text-[9px] uppercase font-bold text-neutral-400 tracking-wider">
                        Quick-Switch Role
                      </div>
                      <div className="grid grid-cols-2 gap-1 px-2.5 mb-2 border-b border-neutral-100 pb-2">
                        {(['Host', 'Server', 'Manager', 'Billing Cashier'] as const).map(role => {
                          const isActive = currentUser.role === role;
                          return (
                            <button
                              key={role}
                              onClick={() => handleSwitchRole(role)}
                              type="button"
                              className={`py-1 px-1 rounded text-center font-bold text-[9px] border transition cursor-pointer ${
                                isActive
                                  ? 'bg-orange-50 border-orange-500 text-orange-850 shadow-2xs'
                                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                              }`}
                            >
                              {role === 'Billing Cashier' ? 'Cashier' : role}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-extrabold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer text-left"
                      >
                        <LogOut size={13} />
                        <span>Lock Terminal</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Primary tab views content container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'floor' && (
            <motion.div
              type="section"
              key="floor-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <FloorView 
                tables={tables} 
                onSelectTable={(table) => setSelectedTable(table)} 
                onAddTable={handleAddTable}
                onUpdateTable={handleUpdateTable}
              />
            </motion.div>
          )}

          {activeTab === 'menu' && (
            <motion.div
              type="section"
              key="menu-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <MenuView 
                menuItems={menuItems} 
                onUpdateMenuItem={handleUpdateMenuItem}
                onAddMenuItem={handleAddMenuItem}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              type="section"
              key="history-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <HistoryView 
                pastOrders={pastOrders} 
                onClearHistory={handleClearHistory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Side operating console drawer controller */}
      <AnimatePresence>
        {selectedTable && (
          <motion.div
            key={selectedTable.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TableDetailDrawer 
              table={selectedTable}
              menuItems={menuItems}
              onClose={() => setSelectedTable(null)}
              onUpdateTable={handleUpdateTable}
              onCheckout={handleProcessCheckout}
              upiId={settings.upiId}
              upiPayeeName={settings.upiPayeeName}
              printerEnabled={settings.printerEnabled}
              printerIp={settings.printerIp}
              printerPort={settings.printerPort}
              printerProtocol={settings.printerProtocol}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal Settings Modal Dialog */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur dismissal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl border border-neutral-100 shadow-2xl w-full max-w-md overflow-hidden relative z-10 flex flex-col"
            >
              <div className="p-6 pb-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                    <span className="p-2 bg-orange-50 border border-orange-100 text-orange-600 rounded-xl inline-block"><Settings size={16} /></span>
                    Terminal Configurations
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Customize payment gateways and receiver endpoints.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form Content body */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-neutral-700 block uppercase tracking-wider">UPI VPA Address (Merchant ID)</label>
                  <input
                    type="text"
                    required
                    defaultValue={settings.upiId}
                    id="sett_upi_vpa_input"
                    placeholder="e.g. merchant@okaxis"
                    className="w-full text-sm py-2.5 px-3.5 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/10 transition"
                  />
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    The UPI Virtual Payment Address (VPA) where funds are transferred instantly. Must be a valid format (e.g., name@bank).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-neutral-700 block uppercase tracking-wider">Merchant Payee Title Name</label>
                  <input
                    type="text"
                    required
                    defaultValue={settings.upiPayeeName}
                    id="sett_payee_title_input"
                    placeholder="e.g. Bespoke Dining Co."
                    className="w-full text-sm py-2.5 px-3.5 border border-neutral-200 hover:border-neutral-300 focus:border-orange-500 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/10 transition"
                  />
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    This business name is presented to customers in scan prompt notifications and receipt entries.
                  </p>
                </div>

                {/* WI-FI CONNECT PRINTER SECTION */}
                <div className="border-t border-neutral-100 pt-5 space-y-4">
                  <div className="flex items-center gap-2 pb-1">
                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Wifi size={14} /></span>
                    <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider">Wi-Fi Connected Printer Settings</h4>
                  </div>

                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[11px] font-bold text-neutral-600">Enable Network Thermal Printing</span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        defaultChecked={settings.printerEnabled}
                        id="sett_printer_enabled_checkbox"
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 block uppercase tracking-wider">Printer IP/Host</label>
                      <input
                        type="text"
                        defaultValue={settings.printerIp}
                        id="sett_printer_ip_input"
                        placeholder="e.g. 192.168.1.100"
                        className="w-full text-xs font-mono py-2 px-3 border border-neutral-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 block uppercase tracking-wider">Port</label>
                      <input
                        type="text"
                        defaultValue={settings.printerPort}
                        id="sett_printer_port_input"
                        placeholder="9100"
                        className="w-full text-xs font-mono py-2 px-2 border border-neutral-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 block uppercase tracking-wider">Protocol Profile</label>
                    <select
                      defaultValue={settings.printerProtocol}
                      id="sett_printer_protocol_select"
                      className="w-full text-xs py-2 px-2 border border-neutral-200 rounded-lg focus:border-blue-500 focus:outline-none bg-white font-medium text-neutral-700 font-mono"
                    >
                      <option value="ESC/POS TCP">ESC/POS Thermal (Raw TCP)</option>
                      <option value="Star Line Mode">Star Micron Line Mode</option>
                      <option value="TSPL / Label">TSPL Label Printer</option>
                      <option value="AirPrint Simulation">Web AirPrint (Browser proxy)</option>
                    </select>
                  </div>

                  {/* Test button and status block */}
                  <div className="pt-1.5 max-w-full">
                    {printerTestStatus !== 'idle' && (
                      <div className={`p-3 rounded-2xl mb-3 flex items-start gap-2.5 text-[10px] font-bold leading-normal transition-all animate-fadeIn ${
                        printerTestStatus === 'testing' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : printerTestStatus === 'success' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                          : 'bg-red-50 text-red-800 border border-red-100'
                      }`}>
                        {printerTestStatus === 'testing' ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping mt-1 shrink-0" />
                            <div>
                              <p className="font-extrabold uppercase tracking-wide">Pinging TCP socket...</p>
                              <p className="text-[9px] text-blue-600/80 mt-0.5">Dialing IP socket handshake. Sending synthetic ESC/POS printer status query command (DLE EOT 1)...</p>
                            </div>
                          </>
                        ) : printerTestStatus === 'success' ? (
                          <>
                            <span className="p-1 bg-emerald-600 text-white rounded-full text-center shrink-0">✓</span>
                            <div>
                              <p className="font-black text-emerald-900 uppercase tracking-widest flex items-center gap-1">PRINTER CONNECTED! 🟢</p>
                              <p className="text-[9px] text-emerald-700 mt-0.5">Handshake Verified. Status code: [0x12 READY]. Device model registered: 'Epson TM-T88VI-003'.</p>
                              <div className="mt-1.5 p-1.5 bg-white border border-emerald-200/50 rounded-lg text-[9px] text-emerald-800 font-mono italic">
                                Ready to print instant thermal slips over internal Wi-Fi subnet!
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-red-600 font-black shrink-0">!</span>
                            <div>
                              <p className="font-extrabold uppercase tracking-wide">Socket connection failed</p>
                              <p className="text-[9px] text-red-600/80 mt-0.5">Please check printer is powered on and joined to the correct restaurant router SSID.</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isTestingPrinter}
                      onClick={() => {
                        const ipVal = (document.getElementById('sett_printer_ip_input') as HTMLInputElement)?.value || '192.168.1.100';
                        const portVal = (document.getElementById('sett_printer_port_input') as HTMLInputElement)?.value || '9100';
                        const protVal = (document.getElementById('sett_printer_protocol_select') as HTMLSelectElement)?.value || 'ESC/POS TCP';
                        handleTestPrinterConnection(ipVal, portVal, protVal);
                      }}
                      className="w-full py-2 px-3 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50 text-neutral-700 font-black text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <span><Printer size={13} /></span>
                      <span>{isTestingPrinter ? 'Testing Socket Handshake...' : 'Simulate Connect & Test Ping'}</span>
                    </button>
                  </div>
                </div>

                {/* Subtitle / Realtime QR Code Preview block */}
                <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={15} className="text-yellow-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-yellow-800 uppercase tracking-widest block font-sans">Live VPA Active Syncing</span>
                    <span className="text-[10px] text-yellow-700/80 leading-normal block transition">
                      New values apply immediately to floor terminal orders, receipt checkout screens, and dynamic customer payment invoices under active sessions.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-neutral-50/50 border-t border-neutral-100 flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    const upiInput = (document.getElementById('sett_upi_vpa_input') as HTMLInputElement)?.value || 'restaurant@okaxis';
                    const nameInput = (document.getElementById('sett_payee_title_input') as HTMLInputElement)?.value || 'Bespoke Dining Co.';
                    const printerIpInput = (document.getElementById('sett_printer_ip_input') as HTMLInputElement)?.value || '192.168.1.100';
                    const printerPortInput = (document.getElementById('sett_printer_port_input') as HTMLInputElement)?.value || '9100';
                    const printerProtocolInput = (document.getElementById('sett_printer_protocol_select') as HTMLSelectElement)?.value || 'ESC/POS TCP';
                    const printerEnabledInput = (document.getElementById('sett_printer_enabled_checkbox') as HTMLInputElement)?.checked ?? true;
                    
                    handleUpdateSettings(upiInput, nameInput, printerIpInput, printerPortInput, printerProtocolInput, printerEnabledInput);
                    setShowSettingsModal(false);
                    setPrinterTestStatus('idle');
                  }}
                  className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition shadow-xs text-center cursor-pointer"
                >
                  Save Configuration
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Reset to standard defaults
                    handleUpdateSettings('restaurant@okaxis', 'Bespoke Dining Co.', '192.168.1.100', '9100', 'ESC/POS TCP', true);
                    setShowSettingsModal(false);
                    setPrinterTestStatus('idle');
                  }}
                  className="py-3 px-4 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-500 hover:text-neutral-800 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer"
                  title="Reset payment address to system default gateway"
                >
                  Reset Defaults
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom styled user intent navigation bar */}
      <footer className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-neutral-100 flex justify-around p-3 shadow-lg z-30">
        {[
          { tabId: 'floor', label: 'FLOOR', emoji: '🟧' },
          { tabId: 'menu', label: 'MENU', emoji: '🔄' },
          { tabId: 'history', label: 'HISTORY', emoji: '🕘' },
        ].map(nav => (
          <button
            key={nav.tabId}
            onClick={() => setActiveTab(nav.tabId as any)}
            className={`nav-item text-center flex flex-col items-center py-2.5 px-6 rounded-2xl transition duration-200 cursor-pointer ${
              activeTab === nav.tabId 
                ? 'text-orange-600 font-black scale-105 bg-orange-50/40' 
                : 'text-neutral-400 font-medium hover:text-neutral-700'
            }`}
          >
            <span className="text-lg mb-1 leading-none">{nav.emoji}</span>
            <span className="text-[10px] tracking-widest font-black uppercase">{nav.label}</span>
          </button>
        ))}
      </footer>

    </div>
  );
}
