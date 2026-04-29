import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, LayoutDashboard, Flag, MessageSquare, Info, Mail, Home, ShieldCheck, Newspaper, Trophy, PlayCircle, MessagesSquare, Radio, User, History as HistoryIcon, ShoppingBag } from 'lucide-react';
import { useAppStore, UserProfile } from '../store';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export default function Sidebar({ isOpen, onClose, profile }: SidebarProps) {
  const { appSettings } = useAppStore();
  const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-4/5 max-w-sm h-full bg-white dark:bg-card-dark shadow-2xl flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-6 pb-8 bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              <button 
                onClick={onClose}
                className="absolute top-4 left-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <X size={18} />
              </button>
              <Link to="/profile" onClick={onClose} className="flex items-center gap-4 relative z-10 pt-4 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="h-16 w-16 rounded-2xl bg-white/20 p-0.5 ring-1 ring-white/30 shadow-inner overflow-hidden">
                  <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover rounded-[14px]" />
                </div>
                <div>
                  <h3 className="text-lg font-black">{profile.name}</h3>
                  <p className="text-white/70 text-[10px] font-bold">عضو ماسي • سيد البلد</p>
                </div>
              </Link>
            </div>

            {/* Sidebar Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isAdmin && (
                <Link to="/admin" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light border border-primary/20 pressable mb-4">
                  <LayoutDashboard size={20} />
                  <div className="flex flex-col">
                    <span className="text-sm font-black italic">ADMIN CONSOLE</span>
                    <span className="text-[9px] font-bold opacity-70">إدارة محتوى التطبيق</span>
                  </div>
                </Link>
              )}
              <div className="pt-2 pb-1 px-4">
                 <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">التنقل السريع</p>
              </div>
              
              <Link to="/" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <Home size={20} className="text-primary" />
                <span className="text-sm font-bold">الرئيسية</span>
              </Link>

              <Link to="/news" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <Newspaper size={20} />
                <span className="text-sm font-bold">الأخبار والتغطيات</span>
              </Link>

              <Link to="/matches" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <Trophy size={20} />
                <span className="text-sm font-bold">جدول المباريات</span>
              </Link>

              <Link to="/media" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <PlayCircle size={20} />
                <span className="text-sm font-bold">الميديا والملخصات</span>
              </Link>

              <Link to="/fan-zone" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <MessagesSquare size={20} className="text-accent" />
                <span className="text-sm font-black">منطقة الجماهير</span>
              </Link>

              <Link to="/live" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <Radio size={20} className="text-red-500 animate-pulse" />
                <span className="text-sm font-bold">البث المباشر</span>
              </Link>

              <Link to="/profile" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <User size={20} />
                <span className="text-sm font-bold">حسابي</span>
              </Link>
              <div className="pt-4 pb-1 px-4 border-t border-slate-100 dark:border-border-dark mt-2">
                 <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">معلومات</p>
              </div>
              <Link to="/history" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable uppercase">
                <HistoryIcon size={20} />
                <span className="text-sm font-bold">تاريخ النادي</span>
              </Link>
              <Link to="/store" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable uppercase">
                <ShoppingBag size={20} />
                <span className="text-sm font-bold">متجر الجماهير</span>
              </Link>
              <button onClick={() => { alert('يمكنك مراسلتنا عبر: support@itthifan.app'); onClose(); }} className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable text-right">
                <Mail size={20} />
                <span className="text-sm font-bold">اتصل بنا</span>
              </button>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-border-dark">
              <div className="flex items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-card-dark/50 border border-border-light dark:border-border-dark gap-3">
                <img src={appSettings.appLogo} className="h-8 w-8 opacity-40 grayscale" alt="" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400">إصدار التطبيق 1.2.0</p>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{appSettings.appName}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
