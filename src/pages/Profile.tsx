import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore, UserProfile } from '../store';
import React, { useState, useEffect } from 'react';
import { Camera, X, Check, Lock, ShieldCheck, Mail, Loader2, Save, Upload, ChevronLeft, Edit2, BadgeCheck, MapPin, Target, FileText, Users, Bell, Palette, Key, HelpCircle, LogOut } from 'lucide-react';
import { db, auth, uploadImage } from '../lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { updatePassword, updateProfile as updateAuthProfile } from 'firebase/auth';

export default function Profile() {
  const { profile, theme, toggleTheme, users, fanPosts, predictions } = useAppStore();
  const updateProfile = useAppStore(state => state.updateProfile);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editData, setEditData] = useState<UserProfile>({ ...profile });
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const navigate = useNavigate();

  // Handle auth state check
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setIsAuthChecking(false);
      if (!user) navigate('/auth');
    });
    return unsub;
  }, [navigate]);

  // Sync editData when modal opens or profile changes
  useEffect(() => {
    if (showEditModal) {
      setEditData({ ...profile });
    }
  }, [showEditModal, profile]);

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setMessage(null);
    console.log('Saving profile...', editData);
    try {
      // Create user data object for Firestore
      const docData = {
        name: editData.name || profile.name,
        location: editData.location || profile.location || '',
        avatar: editData.avatar || profile.avatar,
        email: profile.email || auth.currentUser.email || '',
        role: profile.role || 'user',
        uid: auth.currentUser.uid,
      };
      
      console.log('Pushing to Firestore:', docData);
      // Use setDoc with merge for robustness
      await setDoc(doc(db, 'users', auth.currentUser.uid), docData, { merge: true });

      // Update Auth Profile
      await updateAuthProfile(auth.currentUser, {
        displayName: editData.name,
        photoURL: editData.avatar
      });

      updateProfile(editData);
      setShowEditModal(false);
      setMessage({ text: 'تم تحديث البيانات بنجاح', type: 'success' });
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setMessage({ text: 'فشل تحديث البيانات: ' + (err.message || 'حاول مرة أخرى'), type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser || !newPassword) return;
    setPasswordLoading(true);
    setMessage(null);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      setMessage({ text: 'تم تغيير كلمة المرور بنجاح', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message === 'Firebase: Error (auth/requires-recent-login).' ? 'يجب تسجيل الخروج والدخول مرة أخرى لتغيير كلمة المرور' : 'حدث خطأ في تغيير كلمة المرور', type: 'error' });
    } finally {
      setPasswordLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleLogout = async () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      await auth.signOut();
      navigate('/auth');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file, 'avatars');
      setEditData({ ...editData, avatar: url });
    } catch (err) {
      console.error(err);
      alert('فشل في رفع الصورة');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden pb-24 w-full max-w-lg mx-auto bg-background-light dark:bg-background-dark min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-3 pb-4 pt-5 backdrop-blur-xl border-b border-border-light/50 dark:border-border-dark/50">
        <Link to="/" className="flex items-center justify-center p-2 -ml-2 rounded-full text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors pressable">
          <ChevronLeft size={24} />
        </Link>
        <h2 className="flex-1 text-right pr-4 text-xl font-black drop-shadow-sm tracking-tight text-slate-900 dark:text-white">ملفي الشخصي</h2>
        <div className="flex items-center gap-2">
          {profile.role === 'admin' && (
             <div className="h-8 px-3 rounded-xl bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-black flex items-center gap-1 border border-yellow-400/30 shadow-sm">
                <ShieldCheck size={14} />
                مدير النظام
             </div>
          )}
          <button 
            onClick={() => setShowEditModal(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light transition-colors pressable"
          >
            <Edit2 size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-col flex-1">
        {/* Messages */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`mx-4 mt-4 p-3 rounded-2xl text-xs font-black text-center ${message.type === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Admin Activator (For Omar only) */}
        {auth.currentUser?.email?.toLowerCase() === 'omarmagedugm@gmail.com' && profile.role !== 'admin' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-6 p-5 rounded-[2.5rem] bg-gradient-to-br from-primary to-primary-dark text-white shadow-xl shadow-primary/30 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <ShieldCheck size={120} />
            </div>
            <h3 className="text-lg font-black mb-2 relative z-10">مرحباً بك يا مدير!</h3>
            <p className="text-white/80 text-xs font-bold mb-4 relative z-10 leading-relaxed">
              لقد تم التعرف على بريدك الإلكتروني. قم بتفعيل لوحة التحكم الآن للبدء في إدارة المحتوى والأعضاء.
            </p>
            <button 
              onClick={async () => {
                if (confirm('هل تريد تفعيل صلاحيات الإدارة الكاملة الآن؟')) {
                  setLoading(true);
                  try {
                    await setDoc(doc(db, 'users', auth.currentUser!.uid), { 
                      role: 'admin',
                      uid: auth.currentUser!.uid,
                      email: auth.currentUser!.email,
                      name: profile.name || auth.currentUser?.displayName || 'المدير عمر'
                    }, { merge: true });
                    alert('تم تفعيل الإدارة بنجاح! سيتم إعادة تحميل التطبيق لتفعيل كافة الخيارات.');
                    window.location.reload();
                  } catch (e: any) {
                    alert('خطأ: ' + e.message);
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              className="w-full bg-white text-primary py-3 rounded-2xl font-black text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              تفعيل لوحة التحكم (Admin)
            </button>
          </motion.div>
        )}

        {/* Profile Card Section */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="flex flex-col items-center gap-5 p-6 pt-10"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-125"></div>
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-[2.5rem] h-36 w-36 border-4 border-white dark:border-surface-dark shadow-2xl relative z-10" 
              style={{ backgroundImage: `url('${profile.avatar || auth.currentUser?.photoURL || 'https://ui-avatars.com/api/?name=User'}')` }}
            >
            </div>
            {(profile.isVerified || profile.role === 'admin') && (
              <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-lg ring-4 ring-white dark:ring-surface-dark z-20">
                <BadgeCheck size={20} />
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center justify-center gap-1.5 text-center px-4">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
              {profile.name || auth.currentUser?.displayName || 'مستخدم جديد'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold text-sm">
                <MapPin size={16} />
                <span>{profile.location || 'الإسكندرية'}</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span className="text-xs font-black text-primary px-3 py-1 rounded-full bg-primary/10">عضو منذ {profile.joinDate || '٢٠٢٤'}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="grid grid-cols-3 gap-3 px-4 pb-8"
        >
          <div className="flex flex-col items-center justify-center gap-2 rounded-3xl bg-white p-5 shadow-sm border border-border-light/60 dark:border-border-dark dark:bg-card-dark pressable group cursor-pointer transition-colors hover:border-primary/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform">
              <Target size={24} />
            </div>
            <span className="mt-1 text-2xl font-black text-slate-900 dark:text-white tabular-nums">{predictions.filter(p => p.userId === profile.uid).length}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">التوقعات</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-3xl bg-white p-5 shadow-sm border border-border-light/60 dark:border-border-dark dark:bg-card-dark pressable group cursor-pointer transition-colors hover:border-blue-500/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <span className="mt-1 text-2xl font-black text-slate-900 dark:text-white tabular-nums">{fanPosts.filter(p => p.userId === profile.uid).length}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">المنشورات</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-3xl bg-white p-5 shadow-sm border border-border-light/60 dark:border-border-dark dark:bg-card-dark pressable group cursor-pointer transition-colors hover:border-yellow-500/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <span className="mt-1 text-2xl font-black text-slate-900 dark:text-white tabular-nums">{Math.max(users.length, 12)}</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">المتابعين</span>
          </div>
        </motion.div>

        {/* Settings Section */}
        <motion.div variants={itemVariants} className="flex flex-col px-4">
          <h3 className="mb-3 px-2 text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-primary"></span>
            إعدادات الحساب
          </h3>
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-border-light/60 dark:border-border-dark dark:bg-card-dark">
            {/* Notification Setting */}
            <button 
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-surface-dark pressable group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-surface-dark dark:text-slate-300 group-hover:text-primary transition-colors">
                  <Bell size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">الإشعارات</span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">تنبيهات المباريات، التحديثات</span>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${notificationsEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <motion.div 
                  animate={{ x: notificationsEnabled ? 20 : 2 }}
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </div>
            </button>
            <div className="h-px w-full bg-slate-100 dark:border-t dark:border-border-dark"></div>
            {/* Theme Setting */}
            <button 
              onClick={toggleTheme}
              className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-surface-dark pressable group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-surface-dark dark:text-slate-300 group-hover:text-primary transition-colors">
                  <Palette size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">الوضع الليلي</span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">تغيير مظهر التطبيق</span>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <motion.div 
                  animate={{ x: theme === 'dark' ? 20 : 2 }}
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </div>
            </button>
            <div className="h-px w-full bg-slate-100 dark:border-t dark:border-border-dark"></div>
            {/* Admin Panel */}
            {profile.role === 'admin' && (
              <>
                <Link to="/admin" className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-surface-dark pressable group">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">لوحة التحكم</span>
                      <span className="text-[10px] font-semibold text-primary/80 mt-0.5">إدارة الأخبار، المباريات، والأعضاء</span>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-primary" />
                </Link>
                <div className="h-px w-full bg-slate-100 dark:border-t dark:border-border-dark"></div>
              </>
            )}

            {/* Change Password */}
          </div>

            <div className="h-px w-full bg-slate-100 dark:border-t dark:border-border-dark"></div>
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-surface-dark pressable group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-surface-dark dark:text-slate-300 group-hover:text-primary transition-colors">
                  <Key size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">تغيير كلمة المرور</span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">تأمين حسابك بكلمة مرور جديدة</span>
                </div>
              </div>
              <ChevronLeft size={20} className="text-slate-400" />
            </button>

          <h3 className="mb-3 mt-8 px-2 text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-slate-400"></span>
            الدعم
          </h3>
          <div className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm border border-border-light/60 dark:border-border-dark dark:bg-card-dark">
            <button className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-surface-dark pressable group">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-surface-dark dark:text-slate-300 group-hover:text-primary transition-colors">
                  <HelpCircle size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">مركز المساعدة</span>
                </div>
              </div>
              <ChevronLeft size={20} className="text-slate-400" />
            </button>
            <div className="h-px w-full bg-slate-100 dark:border-t dark:border-border-dark"></div>
            <button 
              onClick={handleLogout}
              className="flex w-full items-center justify-between p-4 transition-colors hover:bg-red-50/50 dark:hover:bg-red-900/10 pressable group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
                  <LogOut size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-red-500 dark:text-red-400">تسجيل الخروج</span>
                </div>
              </div>
              <ChevronLeft size={20} className="text-red-300 dark:text-red-400/50" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-card-dark rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black">تعديل الملف الشخصي</h3>
                <button onClick={() => setShowEditModal(false)} className="p-1 px-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer">
                  <label className="cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                    <div 
                      className="w-24 h-24 rounded-full bg-cover bg-center border-2 border-primary shadow-md relative overflow-hidden"
                      style={{ backgroundImage: `url('${editData.avatar}')` }}
                    >
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="text-white animate-spin" size={24} />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-card-dark">
                      <Camera size={14} />
                    </div>
                  </label>
                </div>
                <div className="flex gap-2 mt-4 p-2 overflow-x-auto no-scrollbar max-w-full">
                  {[
                    'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff',
                    'https://ui-avatars.com/api/?name=ITTI&background=059669&color=fff',
                    'https://ui-avatars.com/api/?name=Alex&background=d97706&color=fff',
                    'https://ui-avatars.com/api/?name=Fan&background=dc2626&color=fff',
                    'https://ui-avatars.com/api/?name=Ittihad&background=1e293b&color=fff'
                  ].map((preset) => (
                    <button 
                      key={preset}
                      onClick={() => setEditData({...editData, avatar: preset})}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${editData.avatar === preset ? 'border-primary scale-110' : 'border-transparent'}`}
                    >
                      <img src={preset} className="w-full h-full rounded-full" alt="preset" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">رابط الصورة الشخصية</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={editData.avatar}
                      onChange={(e) => setEditData({...editData, avatar: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-sm focus:border-primary transition-colors outline-none font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">الاسم</label>
                  <input 
                    type="text" 
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-sm focus:border-primary transition-colors outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">الموقع</label>
                  <input 
                    type="text" 
                    value={editData.location}
                    onChange={(e) => setEditData({...editData, location: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-sm focus:border-primary transition-colors outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex-1 bg-primary text-white py-3 rounded-2xl font-black text-sm shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  حفظ التعديلات
                </button>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-surface-dark text-slate-600 dark:text-slate-300 py-3 rounded-2xl font-black text-sm"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-card-dark rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black">تغيير كلمة المرور</h3>
                <button onClick={() => setShowPasswordModal(false)} className="p-1 px-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl pr-12 pl-4 py-3 text-sm focus:border-primary transition-colors outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !newPassword}
                  className="flex-1 bg-primary text-white py-3 rounded-2xl font-black text-sm shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  تغيير الرقم السري
                </button>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-surface-dark text-slate-600 dark:text-slate-300 py-3 rounded-2xl font-black text-sm"
                >
                  إلغاء
                </button>
              </div>
              <p className="mt-4 text-[10px] text-center text-slate-400 font-bold">لأسباب أمنية قد يطلب منك النظام إعادة تسجيل الدخول</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
