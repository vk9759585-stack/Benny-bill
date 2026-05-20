import React, { useState } from 'react';
import { StaffUser } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Users, UserPlus, Eye, EyeOff, UtensilsCrossed, ShieldAlert } from 'lucide-react';
import { signInWithGoogle } from '../firebase';

interface LoginViewProps {
  onLoginSuccess: (user: StaffUser) => void;
  savedStaffUsers: StaffUser[];
  onRegisterStaff: (newStaff: StaffUser) => void;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export const PRESET_STAFF: StaffUser[] = [
  {
    id: 'staff-1',
    name: 'Alexis Carter',
    role: 'Host',
    pin: '1111',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'staff-2',
    name: 'Elena Rostova',
    role: 'Manager',
    pin: '2222',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'staff-3',
    name: 'Marcus Vance',
    role: 'Admin',
    pin: '3333',
    avatarUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 'staff-4',
    name: 'Siddharth Roy',
    role: 'Billing Cashier',
    pin: '4444',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
  }
];

export default function LoginView({ onLoginSuccess, savedStaffUsers, onRegisterStaff }: LoginViewProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(PRESET_STAFF[0]);
  const [pin, setPin] = useState<string>('');
  const [maskPin, setMaskPin] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // New Registration State
  const [regName, setRegName] = useState<string>('');
  const [regRole, setRegRole] = useState<'Host' | 'Manager' | 'Server' | 'Admin' | 'Billing Cashier' | 'Cashier'>('Server');
  const [regPin, setRegPin] = useState<string>('');
  const [regAvatar, setRegAvatar] = useState<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150');

  // Unified lists of staff
  const allStaff = [...PRESET_STAFF, ...savedStaffUsers];

  const handleKeyPress = (num: string) => {
    setErrorMsg('');
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handlePresetSelect = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setPin('');
    setErrorMsg('');
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStaff) {
      setErrorMsg('Please select a profile first.');
      return;
    }

    if (pin === selectedStaff.pin) {
      onLoginSuccess(selectedStaff);
    } else {
      setErrorMsg('Incorrect 4-digit PIN lock. Please try again.');
      setPin('');
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      const user = await signInWithGoogle();
      if (user) {
        const googleStaff: StaffUser = {
          id: user.uid,
          name: user.displayName || user.email || 'Google Crew',
          role: 'Admin', // Default Google login users to Admin access level
          pin: '',
          avatarUrl: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
          email: user.email || undefined
        };
        onLoginSuccess(googleStaff);
      }
    } catch (e: any) {
      console.error('Google Sign In Failed:', e);
      setErrorMsg(e?.message || 'Google Auth authentication request was declined.');
    }
  };

  // Watch pin to auto submit on 4 digits
  React.useEffect(() => {
    if (pin.length === 4 && selectedStaff) {
      handleLoginSubmit();
    }
  }, [pin]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setErrorMsg('Please enter a staff name');
      return;
    }
    if (regPin.length !== 4 || isNaN(Number(regPin))) {
      setErrorMsg('PIN must be exactly 4 numbers');
      return;
    }

    // Check if PIN code already exists
    if (allStaff.some(s => s.pin === regPin)) {
      setErrorMsg('This passcode PIN is already allocated');
      return;
    }

    const newStaff: StaffUser = {
      id: 'staff-custom-' + Date.now(),
      name: regName,
      role: regRole,
      pin: regPin,
      avatarUrl: regAvatar
    };

    onRegisterStaff(newStaff);
    setSelectedStaff(newStaff);
    setIsRegistering(false);
    setPin('');
    setErrorMsg('');
    // Clear out
    setRegName('');
    setRegPin('');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
      {/* Background Ambience styling */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#ea580c0c,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#1e1b4b12,transparent_60%)]" />
      
      <div className="w-full max-w-4xl grid md:grid-cols-12 gap-6 bg-neutral-900/40 border border-neutral-800/80 rounded-3xl p-6 backdrop-blur-md relative z-10">
        
        {/* Left Side: Staff Profiles Selector */}
        <div className="md:col-span-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-800/80 pb-6 md:pb-0 md:pr-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-500">
                <UtensilsCrossed size={16} />
              </div>
              <span className="text-xs font-black tracking-widest text-neutral-400 uppercase">Bespoke Dining Co.</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Staff Host Terminal</h2>
            <p className="text-xs text-neutral-400 mt-1 mb-6">Select your profile to unlock active floor controls.</p>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {allStaff.map(s => {
                const isSelected = selectedStaff?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handlePresetSelect(s)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3.5 transition-all text-sm font-semibold cursor-pointer ${
                      isSelected
                        ? 'bg-orange-600/10 border-orange-500 text-white shadow-[0_0_15px_-3px_rgba(234,88,12,0.15)]'
                        : 'bg-neutral-900 border-neutral-800/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/42'
                    }`}
                  >
                    <img
                      src={s.avatarUrl}
                      alt={s.name}
                      className={`w-10 h-10 rounded-xl object-cover border-2 ${
                        isSelected ? 'border-orange-500' : 'border-neutral-800'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-white font-black text-sm">{s.name}</div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mt-0.5">{s.role}</div>
                    </div>
                    {isSelected ? (
                      <Unlock size={14} className="text-orange-500 shrink-0" />
                    ) : (
                      <Lock size={14} className="text-neutral-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-dashed border-neutral-800/80">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full h-11 flex items-center justify-center gap-2.5 px-4 bg-white hover:bg-neutral-100 text-neutral-950 font-black rounded-2xl text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-[0_0_15px_-3px_rgba(255,255,255,0.15)] select-none"
              >
                <GoogleIcon />
                <span>Google Crew Sign In</span>
              </button>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => {
                setIsRegistering(prev => !prev);
                setErrorMsg('');
              }}
              className="flex items-center justify-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition w-full py-2 bg-neutral-900 border border-neutral-800/80 rounded-xl cursor-pointer"
            >
              {isRegistering ? (
                <>Return to Login</>
              ) : (
                <>
                  <UserPlus size={14} className="text-orange-500" />
                  Add Team Member
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Keypad PIN / Register Form */}
        <div className="md:col-span-7 flex flex-col justify-center min-h-[360px]">
          <AnimatePresence mode="wait">
            {!isRegistering ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {selectedStaff && (
                  <div className="text-center">
                    <img
                      src={selectedStaff.avatarUrl}
                      alt={selectedStaff.name}
                      className="w-16 h-16 rounded-2xl object-cover mx-auto border-2 border-orange-500 shadow-lg shadow-orange-500/10 mb-3"
                    />
                    <h3 className="text-lg font-black text-white">{selectedStaff.name}</h3>
                    <p className="text-xs text-neutral-400">Enter your 4-digit PIN code to access floor maps</p>
                  </div>
                )}

                {/* PIN progress indicator */}
                <div className="flex justify-center items-center gap-3">
                  {[0, 1, 2, 3].map(idx => (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                        idx < pin.length
                          ? 'bg-orange-500 scale-110 shadow-[0_0_10px_#ea580c]'
                          : 'bg-neutral-800 border border-neutral-700'
                      }`}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setMaskPin(!maskPin)}
                    className="ml-3 text-neutral-400 hover:text-white"
                  >
                    {maskPin ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Simulated Digital PIN display when unmasked */}
                {!maskPin && pin.length > 0 && (
                  <div className="text-center font-mono text-lg font-bold text-orange-500 tracking-wider">
                    {pin}
                  </div>
                )}

                {/* Numeric Keypad Grid */}
                <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeyPress(num)}
                      className="w-16 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center font-bold text-white hover:bg-neutral-800 active:scale-95 transition cursor-pointer text-lg"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-16 h-12 text-xs font-bold text-neutral-400 hover:text-white rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeyPress('0')}
                    className="w-16 h-12 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center font-bold text-white hover:bg-neutral-800 active:scale-95 transition cursor-pointer text-lg"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="w-16 h-12 text-xs font-bold text-neutral-400 hover:text-white rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                {/* Fast presets helpful bypass banner */}
                <div className="text-center">
                  <span className="text-[10px] text-neutral-500 font-bold bg-neutral-950 px-2.5 py-1 rounded-full uppercase border border-neutral-800/40">
                    Hint: {selectedStaff?.name.split(' ')[0]}'s PIN is: <span className="font-mono text-orange-400">{selectedStaff?.pin}</span>
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleRegister} className="space-y-4 max-w-sm mx-auto">
                  <div className="text-center mb-1">
                    <h3 className="text-lg font-black text-white">Enroll New Staff Member</h3>
                    <p className="text-xs text-neutral-400">Initialize custom pin codes & credentials</p>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-neutral-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Kim"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-extrabold text-neutral-400 mb-1">Designated Role</label>
                    <select
                      value={regRole}
                      onChange={e => setRegRole(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="Host">Host</option>
                      <option value="Manager">Manager</option>
                      <option value="Server">Server</option>
                      <option value="Admin">Admin</option>
                      <option value="Billing Cashier">Billing Cashier</option>
                      <option value="Cashier">Cashier</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-neutral-400 mb-1">Secure PIN (4 Digits)</label>
                      <input
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        placeholder="e.g. 5555"
                        value={regPin}
                        onChange={e => setRegPin(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 font-mono text-center tracking-widest text-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-neutral-400 mb-1">Avatar Preset</label>
                      <select
                        value={regAvatar}
                        onChange={e => setRegAvatar(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150">Avatar Purple</option>
                        <option value="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150">Avatar Blue</option>
                        <option value="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150">Avatar Teal</option>
                        <option value="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150">Avatar Dark</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer transition active:scale-95"
                  >
                    Add Team Member
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback error messages */}
          {errorMsg && (
            <div className="mt-4 text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl flex items-center gap-2 max-w-sm mx-auto animate-shake">
              <ShieldAlert size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
