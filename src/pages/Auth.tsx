import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { updateProfile: updateLocalProfile, appSettings } = useAppStore();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const isAdmin = user.email?.toLowerCase() === 'copyrightofficialco@gmail.com';
        const userData = {
          uid: user.uid,
          name: user.displayName || 'مشجع إتحادي',
          email: user.email,
          role: (isAdmin ? 'admin' : 'user') as 'user' | 'admin',
          joinDate: new Date().getFullYear().toString(),
          avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=random`,
          stats: { predictions: 0, comments: 0, favorites: 0 }
        };
        await setDoc(doc(db, 'users', user.uid), userData);
        updateLocalProfile(userData);
      } else {
        updateLocalProfile(userDoc.data());
      }
      navigate('/profile');
    } catch (err: any) {
      console.error(err);
      setError('فشل تسجيل الدخول بجوجل');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        
        // Create user doc in Firestore
        const joinDate = new Date().getFullYear().toString();
        // Check if bootstrap admin
        const isAdmin = email.toLowerCase() === 'copyrightofficialco@gmail.com';
        
        const userData: any = {
          uid: user.uid,
          name,
          email,
          role: (isAdmin ? 'admin' : 'user') as 'user' | 'admin',
          joinDate,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          stats: {
            predictions: 0,
            comments: 0,
            favorites: 0
          }
        };

        await setDoc(doc(db, 'users', user.uid), userData);
        updateLocalProfile(userData);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          updateLocalProfile(userDoc.data());
        }
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message === 'Firebase: Error (auth/email-already-in-use).' ? 'البريد الإلكتروني مستخدم بالفعل' : 'حدث خطأ في الدخول، تأكد من البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col p-6 items-center justify-center relative overflow-hidden font-display">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -ml-32 -mb-32"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
             <img src={appSettings.appLogo} alt="Logo" className="h-20 w-20 object-contain drop-shadow-xl" />
             <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10"></div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{appSettings.appName}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">عشاق سيد البلد</p>
        </div>

        <div className="bg-white dark:bg-card-dark rounded-3xl p-8 shadow-2xl border border-border-light dark:border-border-dark">
          <div className="flex bg-slate-100 dark:bg-surface-dark p-1 rounded-2xl mb-8">
            <button 
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${mode === 'login' ? 'bg-white dark:bg-card-dark shadow-sm text-primary' : 'text-slate-500'}`}
            >
              دخول
            </button>
            <button 
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${mode === 'signup' ? 'bg-white dark:bg-card-dark shadow-sm text-primary' : 'text-slate-500'}`}
            >
              تسجيل جديد
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 text-right">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-black text-slate-500 mb-1.5 block px-1">الاسم الكامل</label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="أدخل اسمك"
                        className="w-full bg-slate-50 dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl py-3.5 pr-12 pl-4 text-sm focus:border-primary outline-none transition-all font-bold"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-xs font-black text-slate-500 mb-1.5 block px-1">البريد الإلكتروني</label>
              <div className="relative text-left">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl py-3.5 pr-12 pl-4 text-sm focus:border-primary outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 mb-1.5 block px-1">كلمة المرور</label>
              <div className="relative text-left">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl py-3.5 pr-12 pl-4 text-sm focus:border-primary outline-none transition-all font-bold"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-[10px] font-bold bg-red-50 dark:bg-red-900/10 p-2 rounded-lg text-center">{error}</p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 pressable disabled:opacity-70 mt-4 active:scale-95"
            >
              {loading && mode !== 'login' ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب')}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-border-dark"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white dark:bg-card-dark text-slate-500 font-bold">أو</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark text-slate-700 dark:text-white py-4 rounded-2xl font-black text-sm shadow-sm transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              الدخول بواسطة Google
            </button>
          </form>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="mt-8 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors mx-auto font-black text-sm"
        >
          <ArrowLeft size={16} />
          التصفح كزائر
        </button>
      </motion.div>
    </div>
  );
}
