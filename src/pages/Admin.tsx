import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { db, auth, uploadImage } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Newspaper, 
  PlayCircle, 
  Trophy, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Radio, 
  Rss, 
  ArrowRight, 
  Users as UsersIcon, 
  Settings as SettingsIcon,
  ShieldAlert,
  Loader2,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Activity,
  UserPlus,
  Check,
  Menu,
  Tags,
  Shield,
  Lock,
  Star,
  History as HistoryIcon
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

export default function Admin() {
  const { 
    news, media, matches, liveStream, users, appSettings, profile, clubs, polls, fanPosts, predictions,
    clubTitles, clubStats, historyEvents, stadiums, newsCategories,
    products, orders,
    setClubTitles, setClubStats, setHistoryEvents, setStadiums, setNewsCategories,
    setProducts, setOrders
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'media' | 'matches' | 'live' | 'users' | 'settings' | 'clubs' | 'polls' | 'comments' | 'posts' | 'predictions' | 'fanzone' | 'history' | 'news-categories' | 'products' | 'orders' | 'roles'>('overview');
  const [showSidebar, setShowSidebar] = useState(false);
  const [historySubTab, setHistorySubTab] = useState<'stats' | 'titles' | 'timeline' | 'stadiums'>('stats');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'processing' | 'delivered'>('all');
  const [comments, setComments] = useState<any[]>([]);
  const [fanComments, setFanComments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, type: 'image' | 'video' = 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file, activeTab);
      if (type === 'video' && activeTab === 'media') {
        // Try to capture a frame or use a default thumbnail
        setFormData({ ...formData, [fieldName]: url, thumbnailUrl: 'https://images.unsplash.com/photo-1510563399035-7140409890a5' });
      } else {
        setFormData({ ...formData, [fieldName]: url });
      }
    } catch (err) {
      console.error(err);
      alert('فشل في رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const UploadField = ({ label, fieldName, currentUrl, type = 'image' }: { label: string, fieldName: string, currentUrl?: string, type?: 'image' | 'video' }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 mb-1 block">{label}</label>
      <div className="flex flex-col gap-2">
        {currentUrl ? (
          <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border-light dark:border-border-dark group flex items-center justify-center bg-slate-900 shadow-inner">
            {type === 'image' ? (
              <img src={currentUrl} className="w-full h-full object-cover" />
            ) : (
              <video src={currentUrl} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => setFormData({ ...formData, [fieldName]: '' })}
                className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-surface-dark border-2 border-dashed border-slate-200 dark:border-border-dark py-6 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group">
            <input 
              type="file" 
              accept={type === 'image' ? "image/*" : "video/*"} 
              className="hidden" 
              onChange={(e) => handleFileUpload(e, fieldName, type)}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="animate-spin text-primary" size={24} />
            ) : (
              <Plus size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
            )}
            <div className="text-center">
               <span className="text-[10px] font-black text-slate-500 block">
                 {uploading ? 'جاري الرفع...' : 'اضغط للرفع'}
               </span>
               <span className="text-[8px] text-slate-400 font-bold uppercase">{type === 'image' ? 'صورة' : 'فيديو'}</span>
            </div>
          </label>
        )}
      </div>
    </div>
  );

  const UploadOrUrlField = ({ label, fieldName, currentUrl, type = 'image' }: { label: string, fieldName: string, currentUrl?: string, type?: 'image' | 'video' }) => {
    const isExternalUrl = currentUrl?.startsWith('http') && !currentUrl?.includes('firebasestorage');
    const [mode, setMode] = useState<'upload' | 'url'>(isExternalUrl ? 'url' : 'upload');

    return (
      <div className="space-y-2 bg-slate-50/50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter block">{label}</label>
          <div className="flex gap-1 bg-white dark:bg-surface-dark p-1 rounded-lg border border-slate-200 dark:border-border-dark">
            <button 
              onClick={() => setMode('upload')}
              className={`text-[8px] font-black px-2.5 py-1 rounded-md transition-all ${mode === 'upload' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              UPLD
            </button>
            <button 
              onClick={() => setMode('url')}
              className={`text-[8px] font-black px-2.5 py-1 rounded-md transition-all ${mode === 'url' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              URL
            </button>
          </div>
        </div>
        
        {mode === 'upload' ? (
          <UploadField label="" fieldName={fieldName} currentUrl={currentUrl} type={type} />
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder={type === 'image' ? "https://example.com/image.jpg" : "https://example.com/video.mp4"} 
                className="flex-1 p-3 rounded-xl border border-border-light bg-white dark:bg-surface-dark dark:border-border-dark text-xs font-mono text-left dir-ltr focus:border-primary outline-none transition-all" 
                value={currentUrl || ''} 
                onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
              />
            </div>
            {currentUrl && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border-light dark:border-border-dark flex items-center justify-center bg-slate-900 group shadow-inner">
                {type === 'image' ? (
                  <img src={currentUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <PlayCircle size={32} className="text-white opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all" />
                  </div>
                )}
                <button 
                  onClick={() => setFormData({ ...formData, [fieldName]: '' })}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (location.state?.editId && location.state?.editCategory) {
      const { editId, editCategory } = location.state;
      const list = editCategory === 'news' ? news : editCategory === 'media' ? media : matches;
      const item = list.find((i: any) => i.id === editId);
      if (item) {
        setFormData({ ...item });
        setIsEditing(true);
        setEditingId(editId);
        setActiveTab(editCategory as any);
        setShowModal(true);
      }
    }
  }, [location.state, news, media, matches]);

  // Security check: roles with dashboard access
  const allowedRoles = ['admin', 'superadmin', 'moderator', 'editor'];
  if (!allowedRoles.includes(profile.role || '')) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-black mb-2">عذراً، لا تمتلك صلاحيات</h1>
        <p className="text-slate-500 mb-6">هذه الصفحة مخصصة لمديري ومسؤولي النظام فقط.</p>
        <button onClick={() => navigate('/')} className="bg-primary text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2">
          <ArrowRight size={20} />
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const handleAdd = async () => {
    setLoading(true);
    try {
      if (activeTab === 'news') {
        const payload = {
          title: formData.title || 'عنوان افتراضي',
          content: formData.content || '',
          image: formData.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018',
          category: formData.category || 'أخبار النادي',
          date: isEditing ? (formData.date || new Date().toISOString()) : new Date().toISOString(),
          author: 'المشرف',
          type: formData.rssUrl ? 'rss' : 'manual',
          rssUrl: formData.rssUrl || '',
          status: formData.status || 'published'
        };
        
        if (isEditing && editingId) {
          await updateDoc(doc(db, 'news', editingId), payload);
        } else {
          await addDoc(collection(db, 'news'), payload);
        }
      } else if (activeTab === 'media') {
        const payload = {
          title: formData.title || 'فيديو جديد',
          type: formData.type || 'video',
          source: formData.source || (formData.url?.includes('youtube.com') || formData.url?.includes('youtu.be') ? 'youtube' : 'upload'),
          url: formData.url || '',
          thumbnailUrl: formData.thumbnailUrl || (formData.type === 'video' ? 'https://images.unsplash.com/photo-1510563399035-7140409890a5' : (formData.url || 'https://images.unsplash.com/photo-1510563399035-7140409890a5')),
          date: isEditing ? (formData.date || new Date().toISOString()) : new Date().toISOString(),
          duration: formData.duration || '',
          views: formData.views || '0'
        };

        const cleanPayload = Object.fromEntries(
          Object.entries(payload).filter(([_, v]) => v !== undefined)
        );

        if (isEditing && editingId) {
          await updateDoc(doc(db, 'media', editingId), cleanPayload);
        } else {
          await addDoc(collection(db, 'media'), cleanPayload);
        }
      } else if (activeTab === 'users') {
        const payload = {
          name: formData.name || '',
          role: formData.role || 'user'
        };

        if (isEditing && editingId) {
          await updateDoc(doc(db, 'users', editingId), payload);
        }
      } else if (activeTab === 'matches') {
        const payload = {
          homeTeam: formData.homeTeam || 'الاتحاد',
          awayTeam: formData.awayTeam || 'الفريق الخصم',
          homeLogo: formData.homeLogo || 'https://upload.wikimedia.org/wikipedia/ar/thumb/0/0e/Al_Ittihad_Alexandria_Club_Logo.svg/512px-Al_Ittihad_Alexandria_Club_Logo.svg.png',
          awayLogo: formData.awayLogo || 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Al_Ahly_SC_logo.png/150px-Al_Ahly_SC_logo.png',
          homeScore: formData.homeScore !== undefined && formData.homeScore !== null ? String(formData.homeScore) : (formData.status === 'upcoming' ? '-' : '0'),
          awayScore: formData.awayScore !== undefined && formData.awayScore !== null ? String(formData.awayScore) : (formData.status === 'upcoming' ? '-' : '0'),
          date: formData.date || new Date().toISOString(),
          competition: formData.competition || 'الدوري المصري',
          status: formData.status || 'upcoming',
          stadium: formData.stadium || '',
          // If we are editing a live match, we refresh the timerStartTime to "now" 
          // and use the provided base minute as the new starting point to ensure continuity
          timerStartTime: (formData.status === 'live' && formData.isTimerRunning) ? new Date().toISOString() : (formData.timerStartTime || null),
          timerBaseMinute: Number(formData.timerBaseMinute || 0),
          isTimerRunning: formData.isTimerRunning || false,
          isMatchDay: formData.isMatchDay || false
        };

        if (isEditing && editingId) {
          await updateDoc(doc(db, 'matches', editingId), payload);
        } else {
          await addDoc(collection(db, 'matches'), payload);
        }
      } else if (activeTab === 'settings') {
        await setDoc(doc(db, 'settings', 'global'), {
          appName: formData.appName || appSettings.appName,
          appLogo: formData.appLogo || appSettings.appLogo
        });
      } else if (activeTab === 'live') {
        await setDoc(doc(db, 'settings', 'liveStream'), {
          isActive: formData.isActive ?? liveStream.isActive,
          url: formData.url || liveStream.url,
          title: formData.title || liveStream.title,
          viewers: Number(formData.viewers || liveStream.viewers)
        });
      } else if (activeTab === 'clubs') {
        const payload = {
          name: formData.name || '',
          logo: formData.logo || ''
        };
        if (isEditing && editingId) {
          await updateDoc(doc(db, 'clubs', editingId), payload);
        } else {
          await addDoc(collection(db, 'clubs'), payload);
        }
      } else if (activeTab === 'polls') {
        const options = (Array.isArray(formData.options) 
          ? formData.options 
          : (formData.options ? formData.options.split(',').map((o: string) => o.trim()) : []))
          .filter(o => o.trim() !== '');
        const payload = {
          question: formData.question || '',
          options,
          votes: isEditing ? (formData.votes || {}) : Object.fromEntries(options.map((_, i) => [i, 0])),
          voters: isEditing ? (formData.voters || []) : [],
          voterChoices: isEditing ? (formData.voterChoices || {}) : {},
          active: formData.active ?? true,
          createdAt: isEditing ? formData.createdAt : new Date().toISOString()
        };
        if (isEditing && editingId) {
          await updateDoc(doc(db, 'polls', editingId), payload);
        } else {
          await addDoc(collection(db, 'polls'), payload);
        }
      } else if (activeTab === 'predictions') {
        const payload = {
          matchId: formData.matchId || '',
          homeScore: Number(formData.homeScore || 0),
          awayScore: Number(formData.awayScore || 0),
          userId: isEditing ? formData.userId : (auth.currentUser?.uid || 'guest'),
          userName: formData.userName || 'مشجع إتحادي',
          userEmail: formData.userEmail || '',
          createdAt: isEditing ? formData.createdAt : new Date().toISOString()
        };
        if (isEditing && editingId) {
          await updateDoc(doc(db, 'predictions', editingId), payload);
        } else {
          await addDoc(collection(db, 'predictions'), payload);
        }
      } else if (activeTab === 'news-categories') {
        const categories = formData.categories || newsCategories;
        await setDoc(doc(db, 'settings', 'newsCategories'), { list: categories });
        setNewsCategories(categories);
      } else if (activeTab === 'products') {
        const payload = {
          name: formData.name || '',
          price: Number(formData.price || 0),
          description: formData.description || '',
          category: formData.category || 'tshirt',
          imageUrl: formData.imageUrl || '',
          stock: Number(formData.stock || 0)
        };
        if (isEditing && editingId) {
          await updateDoc(doc(db, 'products', editingId), payload);
        } else {
          await addDoc(collection(db, 'products'), payload);
        }
      } else if (activeTab === 'history') {
        if (historySubTab === 'stats') {
          const payload = {
            label: formData.label || '',
            value: Number(formData.value || 0),
            icon: formData.icon || 'star'
          };
          if (isEditing && editingId) {
            await updateDoc(doc(db, 'club_stats', editingId), payload);
          } else {
            await addDoc(collection(db, 'club_stats'), payload);
          }
        } else if (historySubTab === 'titles') {
          const payload = {
            name: formData.name || '',
            count: Number(formData.count || 0),
            icon: formData.icon || 'trophy',
            category: formData.category || 'football'
          };
          if (isEditing && editingId) {
            await updateDoc(doc(db, 'club_titles', editingId), payload);
          } else {
            await addDoc(collection(db, 'club_titles'), payload);
          }
        } else if (historySubTab === 'timeline') {
          const payload = {
            year: formData.year || '',
            title: formData.title || '',
            desc: formData.desc || ''
          };
          if (isEditing && editingId) {
            await updateDoc(doc(db, 'club_timeline', editingId), payload);
          } else {
            await addDoc(collection(db, 'club_timeline'), payload);
          }
        } else if (historySubTab === 'stadiums') {
          const payload = {
            name: formData.name || '',
            type: formData.type || '',
            desc: formData.desc || '',
            imageUrl: formData.imageUrl || ''
          };
          if (isEditing && editingId) {
            await updateDoc(doc(db, 'club_stadiums', editingId), payload);
          } else {
            await addDoc(collection(db, 'club_stadiums'), payload);
          }
        }
      }

      alert('تم الحفظ بنجاح');
      setShowModal(false);
      setFormData({});
      setIsEditing(false);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'comments') {
      const q = query(collection(db, 'live_comments'), orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(q, (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    } else if (activeTab === 'fan-comments' || activeTab === 'fanzone') {
      const q = query(collection(db, 'fan_comments'), orderBy('createdAt', 'desc'), limit(100));
      return onSnapshot(q, (snapshot) => {
        setFanComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    } else if (activeTab === 'history') {
      const unsub1 = onSnapshot(query(collection(db, 'club_stats')), (s) => setClubStats(s.docs.map(d => ({ id: d.id, ...d.data() } as any))));
      const unsub2 = onSnapshot(query(collection(db, 'club_titles')), (s) => setClubTitles(s.docs.map(d => ({ id: d.id, ...d.data() } as any))));
      const unsub3 = onSnapshot(query(collection(db, 'club_timeline'), orderBy('year', 'asc')), (s) => setHistoryEvents(s.docs.map(d => ({ id: d.id, ...d.data() } as any))));
      const unsub4 = onSnapshot(query(collection(db, 'club_stadiums')), (s) => setStadiums(s.docs.map(d => ({ id: d.id, ...d.data() } as any))));
      const unsub5 = onSnapshot(doc(db, 'settings', 'newsCategories'), (s) => {
        if (s.exists()) setNewsCategories(s.data().list);
      });
      const unsub6 = onSnapshot(query(collection(db, 'products')), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as any))));
      const unsub7 = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() } as any))));
      return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); };
    }
  }, [activeTab]);

  const handleDelete = async (coll: string, id: string) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      try {
        await deleteDoc(doc(db, coll, id));
      } catch (err) {
        console.error(err);
        alert('فشل الحذف');
      }
    }
  };

  const handleTimerAction = async (action: 'start' | 'pause' | 'reset', match: any) => {
    let updates: any = {};
    const now = new Date().toISOString();
    
    if (action === 'start') {
      updates = {
        isTimerRunning: true,
        timerStartTime: now,
        status: 'live'
      };
    } else if (action === 'pause') {
      const elapsed = match.timerStartTime ? Math.floor((new Date().getTime() - new Date(match.timerStartTime).getTime()) / 60000) : 0;
      updates = {
        isTimerRunning: false,
        timerBaseMinute: (match.timerBaseMinute || 0) + elapsed,
        timerStartTime: null
      };
    } else if (action === 'reset') {
      updates = {
        isTimerRunning: false,
        timerBaseMinute: 0,
        timerStartTime: null,
        status: 'upcoming'
      };
    }

    try {
      await updateDoc(doc(db, 'matches', match.id), updates);
    } catch (err) {
      console.error(err);
      alert('فشل تحديث المؤقت');
    }
  };

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const calculateCurrentMinute = (match: any) => {
    if (!match.isTimerRunning || !match.timerStartTime) return Number(match.timerBaseMinute || 0);
    const start = new Date(match.timerStartTime).getTime();
    if (isNaN(start)) return Number(match.timerBaseMinute || 0);
    const elapsed = Math.max(0, Math.floor((new Date().getTime() - start) / 60000));
    return Number(match.timerBaseMinute || 0) + elapsed;
  };

  const handleEditMatch = (match: any) => {
    setFormData({ ...match });
    setIsEditing(true);
    setEditingId(match.id);
    setActiveTab('matches');
    setShowModal(true);
  };

  const handleEditNews = (item: any) => {
    setFormData({ ...item, image: item.image || item.imageUrl });
    setIsEditing(true);
    setEditingId(item.id);
    setShowModal(true);
  };

  const openAddModal = () => {
    if (activeTab === 'polls') {
      setFormData({ options: ['', ''], active: true });
    } else {
      setFormData({});
    }
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col pb-24 min-h-screen bg-slate-50 dark:bg-background-dark relative">
      {/* Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Sidebar Drawer */}
      <div className={`fixed inset-y-0 right-0 z-[70] transition-transform duration-300 transform ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
        <AdminSidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setShowSidebar(false); }} onClose={() => setShowSidebar(false)} />
      </div>

      {/* Header Mobile */}
      <div className="bg-white dark:bg-card-dark border-b border-border-light dark:border-border-dark p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
             <button onClick={() => setShowSidebar(true)} className="w-10 h-10 bg-slate-50 dark:bg-surface-dark rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 pressable">
               <Menu size={20} />
             </button>
             <div className="flex flex-col">
               <h2 className="font-black text-sm tracking-tight leading-none">إدارة المنصة</h2>
               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Admin Panel</span>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/profile" className="text-[10px] bg-slate-100 dark:bg-surface-dark text-slate-500 px-3 py-1.5 rounded-lg font-bold pressable">
              خروج
            </Link>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {activeTab === 'overview' ? 'نظرة عامة على المنتدى' :
             activeTab === 'news' ? 'إدارة الأخبار' : 
             activeTab === 'news-categories' ? 'إدارة أقسام الأخبار' :
             activeTab === 'fanzone' ? 'إدارة منطقة الجماهير' :
             activeTab === 'media' ? 'إدارة الميديا' : 
             activeTab === 'matches' ? 'إدارة المباريات' : 
             activeTab === 'posts' ? 'منشورات الجماهير' :
             activeTab === 'predictions' ? 'إدارة توقعات المباريات' :
             activeTab === 'users' ? 'إدارة الأعضاء' : 
             activeTab === 'roles' ? 'الأدوار والصلاحيات' : 
             activeTab === 'settings' ? 'إعدادات المنصة' : 
             activeTab === 'clubs' ? 'إدارة الأندية' : 
             activeTab === 'polls' ? 'إدارة الاستطلاعات' : 
             activeTab === 'comments' ? 'إدارة التعليقات' : 'البث المباشر'}
          </h1>
          {['news', 'media', 'matches', 'clubs', 'polls', 'predictions'].includes(activeTab) && (
            <button 
              onClick={openAddModal}
              className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg font-bold shadow-sm shadow-primary/20 hover:scale-105 transition-all text-xs"
            >
              <Plus size={14} />
              إضافة
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {activeTab === 'fanzone' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setActiveTab('posts')}
                  className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col items-center gap-2 shadow-sm hover:scale-105 transition-all"
                >
                  <MessageSquare size={24} className="text-orange-500" />
                  <span className="font-black text-xs">منشورات الجماهير</span>
                  <span className="text-[10px] font-bold text-slate-400">{fanPosts.length} منشور</span>
                </button>
                <button 
                  onClick={() => setActiveTab('fan-comments')}
                  className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col items-center gap-2 shadow-sm hover:scale-105 transition-all"
                >
                  <MessageSquare size={24} className="text-pink-500" />
                  <span className="font-black text-xs">تعليقات الفان زون</span>
                  <span className="text-[10px] font-bold text-slate-400">{fanComments.length} تعليق</span>
                </button>
                <button 
                  onClick={() => setActiveTab('polls')}
                  className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col items-center gap-2 shadow-sm hover:scale-105 transition-all"
                >
                  <BarChart3 size={24} className="text-green-500" />
                  <span className="font-black text-xs">الاستطلاعات</span>
                  <span className="text-[10px] font-bold text-slate-400">{polls.length} استطلاع</span>
                </button>
                <button 
                  onClick={() => setActiveTab('predictions')}
                  className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col items-center gap-2 shadow-sm hover:scale-105 transition-all"
                >
                  <Trophy size={24} className="text-yellow-500" />
                  <span className="font-black text-xs">توقعات المباريات</span>
                  <span className="text-[10px] font-bold text-slate-400">{predictions.length} توقع</span>
                </button>
                <button 
                  onClick={() => setActiveTab('comments')}
                  className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col items-center gap-2 shadow-sm hover:scale-105 transition-all"
                >
                  <MessageSquare size={24} className="text-blue-500" />
                  <span className="font-black text-xs">تعليقات البث</span>
                  <span className="text-[10px] font-bold text-slate-400">{comments.length} تعليق</span>
                </button>
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                <h3 className="font-black text-sm mb-2 text-primary">إحصائيات سريعة</h3>
                <div className="flex justify-between items-center bg-white dark:bg-card-dark p-4 rounded-xl">
                  <div className="text-center flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">الأكثر تفاعلاً</p>
                    <p className="text-sm font-black text-primary">
                      {fanPosts.length > 0 ? (fanPosts.sort((a,b) => (b.likes||0) - (a.likes||0))[0].userName) : '---'}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-slate-100 mx-4"></div>
                  <div className="text-center flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">تصويتات اليوم</p>
                    <p className="text-sm font-black text-primary">
                      {polls.filter(p => p.active).length} نشط
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col gap-1 shadow-sm">
                   <div className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-primary mb-1">
                     <UsersIcon size={18} />
                   </div>
                   <span className="text-2xl font-black">{users.length}</span>
                   <span className="text-[10px] font-bold text-slate-500 uppercase">عضو مسجل</span>
                </div>
                <div className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col gap-1 shadow-sm">
                   <div className="bg-blue-500/10 w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 mb-1">
                     <Newspaper size={18} />
                   </div>
                   <span className="text-2xl font-black">{news.length}</span>
                   <span className="text-[10px] font-bold text-slate-500 uppercase">خبر منشور</span>
                </div>
                <div className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col gap-1 shadow-sm">
                   <div className="bg-orange-500/10 w-8 h-8 rounded-lg flex items-center justify-center text-orange-500 mb-1">
                     <MessageSquare size={18} />
                   </div>
                   <span className="text-2xl font-black">{fanPosts.length}</span>
                   <span className="text-[10px] font-bold text-slate-500 uppercase">منشور جماهير</span>
                </div>
                <div className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col gap-1 shadow-sm">
                   <div className="bg-green-500/10 w-8 h-8 rounded-lg flex items-center justify-center text-green-500 mb-1">
                     <BarChart3 size={18} />
                   </div>
                   <span className="text-2xl font-black">{predictions.length}</span>
                   <span className="text-[10px] font-bold text-slate-500 uppercase">توقعات مباريات</span>
                </div>
              </div>

              <div className="bg-white dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    النشاط الأخير
                  </h3>
                </div>
                <div className="space-y-3">
                  {(([...news, ...media, ...fanPosts] as any[])
                    .sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())
                    .slice(0, 5) as any[])
                    .map((item, i) => (
                      <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-50 dark:border-border-dark last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-surface-dark flex items-center justify-center flex-shrink-0 text-slate-500">
                           {item.title ? <Newspaper size={14} /> : <MessageSquare size={14} />}
                        </div>
                        <div className="flex-1">
                           <p className="text-xs font-bold line-clamp-1">{item.title || item.content}</p>
                           <p className="text-[9px] text-slate-400 font-bold">{new Date(item.date || item.createdAt || 0).toLocaleString('ar-EG')}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <UserPlus size={16} className="text-blue-500" />
                    أحدث الأعضاء
                  </h3>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {users.slice(0, 5).map((u, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <img src={u.avatar} className="w-10 h-10 rounded-full border border-slate-100" />
                      <span className="text-[8px] font-bold truncate w-full text-center">{u.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'news-categories' && (
            <div className="bg-white dark:bg-card-dark rounded-3xl border border-border-light dark:border-border-dark p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Tags size={20} />
                </div>
                <div>
                   <h3 className="font-black text-sm">أقسام الأخبار</h3>
                   <p className="text-[10px] font-bold text-slate-400">إدارة التصنيفات المتاحة للأخبار</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {newsCategories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-surface-dark px-3 py-2 rounded-xl border border-slate-100 dark:border-border-dark group">
                    <span className="text-xs font-bold">{cat}</span>
                    <button 
                      onClick={() => {
                        const newList = newsCategories.filter((_, idx) => idx !== i);
                        setFormData({ categories: newList });
                        handleAdd();
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="new-category"
                  placeholder="اسم القسم الجديد..." 
                  className="flex-1 p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold" 
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('new-category') as HTMLInputElement;
                    if (input.value) {
                      const newList = [...newsCategories, input.value];
                      setFormData({ categories: newList });
                      handleAdd();
                      input.value = '';
                    }
                  }}
                  className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs"
                >
                  إضافة
                </button>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <button onClick={handleAdd} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-[11px] flex items-center gap-2 pressable">
                  <Plus size={14} /> منتج جديد
                </button>
                <div className="text-right">
                   <h3 className="text-xs font-black">إدارة المخزن</h3>
                   <p className="text-[10px] text-slate-400 font-bold">إضافة وتعديل منتجات متجر الجماهير</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {products.map(product => (
                  <div key={product.id} className="bg-white dark:bg-card-dark p-3 rounded-2xl border border-border-light dark:border-border-dark flex items-center gap-4">
                    <img src={product.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1 text-right">
                       <h4 className="text-xs font-black">{product.name}</h4>
                       <p className="text-[10px] text-primary font-bold tabular-nums mt-0.5">{product.price} ج.م</p>
                       <span className="text-[9px] bg-slate-100 dark:bg-surface-dark px-2 py-0.5 rounded-lg text-slate-500 font-bold">{product.category}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setFormData({...product}); setIsEditing(true); setEditingId(product.id); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete('products', product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="flex flex-col gap-4">
               <div className="grid grid-cols-1 gap-3">
                 {orders.map(order => (
                   <div key={order.id} className="bg-white dark:bg-card-dark p-4 rounded-3xl border border-border-light dark:border-border-dark text-right space-y-3">
                     <div className="flex items-center justify-between border-b border-slate-50 dark:border-border-dark pb-2">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                          order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {order.status === 'pending' ? 'بانتظار التأكيد' : 
                          order.status === 'delivered' ? 'تم التوصيل' : 'جاري التنفيذ'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
                     </div>
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <p className="text-xs font-black text-slate-800 dark:text-white">{order.productName}</p>
                           <p className="text-[10px] text-primary font-bold tabular-nums">الإجمالي: {order.totalPrice} ج.م</p>
                        </div>
                        <div className="text-left">
                           <p className="text-[10px] font-bold text-slate-800 dark:text-white">{order.userName}</p>
                           <p className="text-[10px] text-slate-500 font-bold tabular-nums">{order.userPhone}</p>
                        </div>
                     </div>
                     <div className="bg-slate-50 dark:bg-surface-dark p-3 rounded-2xl text-[10px] font-bold text-slate-500">
                        📍 {order.userAddress}
                     </div>
                     <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => updateDoc(doc(db, 'orders', order.id), { status: 'processing' })}
                            className="flex-1 py-2 bg-primary text-white rounded-xl text-[10px] font-black"
                          >
                            تجهيز الطلب
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button 
                            onClick={() => updateDoc(doc(db, 'orders', order.id), { status: 'delivered' })}
                            className="flex-1 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black"
                          >
                            تم التوصيل
                          </button>
                        )}
                        <button onClick={() => handleDelete('orders', order.id)} className="p-2 text-red-500 border border-red-100 rounded-xl"><Trash2 size={16} /></button>
                     </div>
                   </div>
                 ))}
                 {orders.length === 0 && (
                   <div className="py-20 text-center text-slate-400 font-bold text-sm">لا توجد طلبات شراء حالياً</div>
                 )}
               </div>
            </div>
          )}

          {activeTab === 'news' && news.map((item) => (
            <div key={item.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                     <h3 className="font-bold text-sm line-clamp-1 leading-tight">{item.title}</h3>
                     {item.type === 'rss' && <Rss size={10} className="text-orange-500" title="جلب تلقائي (RSS)" />}
                     {item.status === 'draft' && <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-black">مسودة</span>}
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEditNews(item)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete('news', item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'media' && media.map((item) => (
            <div key={item.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                       <PlayCircle size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm line-clamp-1 leading-tight">{item.title}</h3>
                  <span className="text-[10px] text-slate-500">{item.type === 'video' ? 'فيديو' : 'صورة'} • {new Date(item.date).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      setFormData({ ...item });
                      setIsEditing(true);
                      setEditingId(item.id);
                      setShowModal(true);
                    }} 
                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete('media', item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'matches' && matches.map((item) => (
            <div key={item.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex flex-col gap-2">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-right whitespace-nowrap">{item.homeTeam} × {item.awayTeam}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold text-right ${item.status === 'live' ? 'text-red-500' : 'text-slate-500'}`}>
                        {item.status === 'live' ? 'مباشر' : item.status === 'finished' ? 'منتهية' : 'قادمة'}
                      </span>
                      {item.isMatchDay && (
                        <span className="text-[10px] font-black bg-accent/20 text-accent px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Match Day</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black ml-1">{item.homeScore} - {item.awayScore}</span>
                  {item.status === 'live' && (
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-surface-dark px-2 py-1 rounded-lg border border-border-light dark:border-border-dark">
                      <span className="text-[10px] font-black tabular-nums">{calculateCurrentMinute(item)}'</span>
                      <button 
                        onClick={() => handleTimerAction(item.isTimerRunning ? 'pause' : 'start', item)}
                        className={`p-1 rounded-md transition-colors ${item.isTimerRunning ? 'text-orange-500 bg-orange-50' : 'text-green-500 bg-green-50'}`}
                      >
                        {item.isTimerRunning ? <X size={12} /> : <PlayCircle size={12} />}
                      </button>
                      <button 
                        onClick={() => handleTimerAction('reset', item)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditMatch(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete('matches', item.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'posts' && (
            <div className="flex flex-col gap-4">
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-black text-primary uppercase">إدارة المحتوى والمشرفين</span>
              </div>
              {fanPosts.map((post) => (
                <div key={post.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-4 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={post.userAvatar} className="w-10 h-10 rounded-full border border-slate-100" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black">{post.userName}</p>
                          {post.isPinned && <span className="text-[8px] bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded font-black">مثبت📌</span>}
                          {post.isLocked && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black">مغلق🔒</span>}
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold">{post.createdAt ? new Date(post.createdAt).toLocaleString('ar-EG') : 'منذ فترة'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => updateDoc(doc(db, 'fan_posts', post.id), { isPinned: !post.isPinned })}
                        className={`p-2 rounded-lg transition-all ${post.isPinned ? 'text-yellow-500 bg-yellow-50' : 'text-slate-400 hover:bg-slate-50'}`}
                        title="تثبيت المنشور"
                      >
                        <Shield size={16} />
                      </button>
                      <button 
                        onClick={() => updateDoc(doc(db, 'fan_posts', post.id), { isLocked: !post.isLocked })}
                        className={`p-2 rounded-lg transition-all ${post.isLocked ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:bg-slate-50'}`}
                        title="قفل التعليقات"
                      >
                        <Lock size={16} />
                      </button>
                      <button onClick={() => handleDelete('fan_posts', post.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="حذف بالكامل">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-relaxed">{post.content}</p>
                  {post.image && (
                    <img src={post.image} className="w-full h-40 object-cover rounded-xl border border-border-light dark:border-border-dark" />
                  )}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-50 dark:border-border-dark text-[10px] font-black text-slate-500">
                    <span>{post.likes || 0} إعجاب</span>
                    <span>{post.comments || 0} تعليق</span>
                  </div>
                </div>
              ))}
              {fanPosts.length === 0 && <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 dark:border-border-dark text-slate-400 font-bold text-sm">لا توجد منشورات جماهير</div>}
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="flex flex-col gap-3">
              {predictions.map((p) => {
                const match = matches.find(m => m.id === p.matchId);
                const isMatchFinished = match?.status === 'finished';
                const isCorrect = isMatchFinished && 
                                Number(match.homeScore) === Number(p.homeScore) && 
                                Number(match.awayScore) === Number(p.awayScore);
                
                return (
                  <div key={p.id} className={`bg-white dark:bg-card-dark rounded-xl border ${isCorrect ? 'border-green-500 shadow-green-100' : 'border-border-light dark:border-border-dark shadow-sm'} p-3 flex flex-col gap-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full w-fit">{p.userName}</span>
                          {isMatchFinished && (
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {isCorrect ? <Check size={8} /> : <X size={8} />}
                              {isCorrect ? 'توقع صحيح' : 'توقع خاطئ'}
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold mt-1">{p.userEmail}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            setFormData({ ...p });
                            setIsEditing(true);
                            setEditingId(p.id);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete('predictions', p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-surface-dark p-2 rounded-lg">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{match?.homeTeam || 'فريق غير معروف'}</span>
                      <div className="flex items-center gap-2">
                         <div className="flex flex-col items-center">
                           <span className="text-[8px] text-slate-400 mb-0.5">توقعه</span>
                           <span className={`w-6 h-6 flex items-center justify-center bg-white dark:bg-card-dark border ${isCorrect ? 'border-green-200 text-green-600' : 'border-border-light dark:border-border-dark'} rounded font-black text-sm`}>{p.homeScore}</span>
                         </div>
                         <span className="text-xs text-slate-400 font-black">-</span>
                         <div className="flex flex-col items-center">
                           <span className="text-[8px] text-slate-400 mb-0.5">توقعه</span>
                           <span className={`w-6 h-6 flex items-center justify-center bg-white dark:bg-card-dark border ${isCorrect ? 'border-green-200 text-green-600' : 'border-border-light dark:border-border-dark'} rounded font-black text-sm`}>{p.awayScore}</span>
                         </div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{match?.awayTeam || 'فريق غير معروف'}</span>
                    </div>
                    {isMatchFinished && (
                      <div className="text-center px-2 py-1 bg-slate-100/50 dark:bg-surface-dark/50 rounded-md flex items-center justify-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase">النتيجة الحقيقية:</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{match.homeScore} - {match.awayScore}</span>
                      </div>
                    )}
                    <p className="text-[8px] text-slate-400 text-left font-bold">{p.createdAt ? new Date(p.createdAt).toLocaleString('ar-EG') : ''}</p>
                  </div>
                );
              })}
              {predictions.length === 0 && <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 dark:border-border-dark text-slate-400 font-bold text-sm">لا توجد توقعات بعد</div>}
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="flex flex-col gap-4">
               <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 flex flex-col gap-2">
                 <h3 className="font-black text-sm text-primary">نظام إدارة الصلاحيات</h3>
                 <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                   يمكنك من هنا تغيير أدوار المستخدمين للحصول على صلاحيات مخصصة داخل المنصة وإدارة أقسام معينة.
                 </p>
               </div>
               
               {users.map((u) => (
                  <div key={u.uid} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} className="w-10 h-10 rounded-full border border-slate-100" />
                      <div>
                        <h4 className="text-xs font-black">{u.name}</h4>
                        <p className="text-[10px] text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {['superadmin', 'admin', 'moderator', 'editor', 'verified', 'user'].map(r => (
                         <button 
                           key={r}
                           disabled={u.uid === auth.currentUser?.uid && r !== u.role}
                           onClick={() => {
                             if(confirm('تأكيد تغيير صلاحية المستخدم؟')) {
                               updateDoc(doc(db, 'users', u.uid!), { role: r });
                             }
                           }}
                           className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                             u.role === r 
                               ? 'bg-primary text-white shadow-sm' 
                               : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-surface-dark dark:text-slate-400'
                           } ${u.uid === auth.currentUser?.uid && r !== u.role ? 'opacity-50 cursor-not-allowed' : ''}`}
                         >
                           {r === 'superadmin' ? 'Super Admin' : 
                            r === 'admin' ? 'Admin' : 
                            r === 'moderator' ? 'Moderator' : 
                            r === 'editor' ? 'Editor' : 
                            r === 'verified' ? 'Verified User' : 'Regular User'}
                         </button>
                       ))}
                    </div>
                  </div>
               ))}
            </div>
          )}

          {activeTab === 'users' && users.map((u) => (
            <div key={u.uid} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={u.avatar} className="w-12 h-12 rounded-full border-2 border-slate-100 dark:border-border-dark" />
                  {u.role === 'admin' && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[8px] font-black px-1 rounded border border-white">ADMIN</div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold leading-tight">{u.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold mb-1">{u.email}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                      {u.role === 'admin' ? 'مدير نظام' : 'عضو'}
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold">عضو منذ {u.joinDate}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                 <button 
                  title="تعديل اسم العضو"
                  onClick={() => {
                    setFormData({ ...u });
                    setIsEditing(true);
                    setEditingId(u.uid!);
                    setShowModal(true);
                  }}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                 >
                   <Edit2 size={18} />
                 </button>
                 <button 
                  title={u.role === 'admin' ? 'تخفيض لصلاحيات عضو' : 'ترقية لصلاحيات مدير'}
                  onClick={async () => {
                    if (u.uid === auth.currentUser?.uid) return alert('لا يمكنك تغيير صلاحياتك بنفسك');
                    const newRole = u.role === 'admin' ? 'user' : 'admin';
                    if (confirm(`هل تريد ${newRole === 'admin' ? 'ترقية' : 'تخفيض'} ${u.name}؟`)) {
                      await updateDoc(doc(db, 'users', u.uid!), { role: newRole });
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors ${u.role === 'admin' ? 'text-orange-500 hover:bg-orange-50' : 'text-blue-500 hover:bg-blue-50'}`}
                 >
                   <ShieldAlert size={18} />
                 </button>
                 <button 
                  onClick={() => handleDelete('users', u.uid!)} 
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                 >
                   <Trash2 size={18} />
                 </button>
              </div>
            </div>
          ))}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-card-dark rounded-xl p-5 shadow-sm space-y-5 border border-border-light dark:border-border-dark">
              <div className="pb-4 border-b border-border-light dark:border-border-dark">
                 <h3 className="text-sm font-black mb-1">الهوية البصرية</h3>
                 <p className="text-[10px] text-slate-500 font-bold">تحكم في اسم وشعار التطبيق الذي يظهر لجميع المستخدمين</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 mb-1.5 block">اسم التطبيق</label>
                <input 
                  type="text" 
                  value={formData.appName ?? appSettings.appName} 
                  onChange={(e) => setFormData({...formData, appName: e.target.value})}
                  className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold focus:border-primary outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 mb-1.5 block">رابط اللوجو (PNG شفاف مفضل)</label>
                <input 
                  type="text" 
                  value={formData.appLogo ?? appSettings.appLogo} 
                  onChange={(e) => setFormData({...formData, appLogo: e.target.value})}
                  className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-mono focus:border-primary outline-none transition-colors"
                />
                <div className="mt-4 p-6 bg-slate-50 dark:bg-surface-dark rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-border-dark">
                   <img src={formData.appLogo ?? appSettings.appLogo} className="h-20 object-contain drop-shadow-lg mb-2" />
                   <span className="text-[10px] text-slate-400 font-bold">معاينة الشعار</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border-light dark:border-border-dark">
                 <h3 className="text-sm font-black mb-1">تحديثات المنصة والوحدات</h3>
                 <p className="text-[10px] text-slate-500 font-bold mb-4">قم بتفعيل وإلغاء تفعيل الأقسام حسب الحاجة</p>
                 <div className="grid gap-3">
                    {['المتجر والتذاكر', 'منطقة الفان زون', 'البث المباشر للمباريات', 'توقعات المباريات'].map(mod => (
                      <div key={mod} className="flex justify-between items-center p-3 rounded-xl border border-border-light dark:border-border-dark bg-slate-50 dark:bg-surface-dark">
                        <span className="text-xs font-bold">{mod}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                 </div>
              </div>

              <button 
                onClick={handleAdd} 
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
              >
                {loading && <Loader2 className="animate-spin" size={18} />}
                حفظ كافة الإعدادات
              </button>
            </div>
          )}

          {activeTab === 'clubs' && (
            <div className="flex flex-col gap-3">
              {clubs.map((club) => (
                <div key={club.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={club.logo} alt="" className="w-10 h-10 rounded-lg object-contain bg-slate-50 dark:bg-surface-dark p-1" />
                    <span className="font-bold text-sm">{club.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        setFormData({ ...club });
                        setIsEditing(true);
                        setEditingId(club.id);
                        setShowModal(true);
                      }} 
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete('clubs', club.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {clubs.length === 0 && <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 dark:border-border-dark text-slate-400 font-bold text-sm">لا توجد أندية مضافة</div>}
            </div>
          )}

          {activeTab === 'polls' && (
            <div className="flex flex-col gap-3">
              {polls.map((poll) => (
                <div key={poll.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-sm leading-tight mb-1">{poll.question}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${poll.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {poll.active ? 'نشط' : 'مغلق'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">{poll.options?.length || 0} خيارات • {Object.values(poll.votes || {}).reduce((a, b) => a + Number(b), 0)} صوت</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setFormData({ ...poll });
                          setIsEditing(true);
                          setEditingId(poll.id);
                          setShowModal(true);
                        }} 
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete('polls', poll.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {polls.length === 0 && <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 dark:border-border-dark text-slate-400 font-bold text-sm">لا توجد استطلاعات رأي</div>}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="flex flex-col gap-3">
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 mb-2">
                <span className="text-[10px] font-black text-primary uppercase">تعليقات الدردشة المباشرة (Live Chat)</span>
              </div>
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs">{comment.userName}</span>
                      <span className="text-[10px] text-slate-400">{comment.createdAt?.seconds ? new Date(comment.createdAt.seconds * 1000).toLocaleString('ar-EG') : 'الآن'}</span>
                    </div>
                    <button onClick={() => handleDelete('live_comments', comment.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-surface-dark p-2 rounded-lg">{comment.text}</p>
                </div>
              ))}
              {comments.length === 0 && <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 text-slate-400 font-bold text-sm">لا توجد تعليقات</div>}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="flex flex-col gap-6">
              <div className="flex p-1 bg-slate-100 dark:bg-surface-dark rounded-2xl">
                {['stats', 'titles', 'timeline', 'stadiums'].map((sub) => (
                  <button 
                    key={sub}
                    onClick={() => setHistorySubTab(sub as any)}
                    className={`flex-1 py-1.5 text-[10px] font-black rounded-xl transition-all ${historySubTab === sub ? 'bg-white dark:bg-card-dark text-primary shadow-sm' : 'text-slate-500'}`}
                  >
                    {sub === 'stats' ? 'أرقام' : sub === 'titles' ? 'كؤوس' : sub === 'timeline' ? 'أحداث' : 'ملاعب'}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {historySubTab === 'stats' && clubStats.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-card-dark p-3 rounded-xl border border-border-light dark:border-border-dark flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-surface-dark flex items-center justify-center text-primary">
                        <Star size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-black">{item.label}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{item.value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setFormData({...item}); setIsEditing(true); setEditingId(item.id); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete('club_stats', item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}

                {historySubTab === 'titles' && clubTitles.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-card-dark p-3 rounded-xl border border-border-light dark:border-border-dark flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-surface-dark flex items-center justify-center text-primary">
                        <Trophy size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-black">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{item.count} بطل • {item.category === 'football' ? 'قدم' : 'سلة'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setFormData({...item}); setIsEditing(true); setEditingId(item.id); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete('club_titles', item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}

                {historySubTab === 'timeline' && historyEvents.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-card-dark p-3 rounded-xl border border-border-light dark:border-border-dark flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-surface-dark flex items-center justify-center text-primary flex-shrink-0">
                        <HistoryIcon size={14} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black truncate">{item.year}: {item.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold truncate">{item.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setFormData({...item}); setIsEditing(true); setEditingId(item.id); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete('club_timeline', item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}

                {historySubTab === 'stadiums' && stadiums.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-card-dark p-3 rounded-xl border border-border-light dark:border-border-dark flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="text-xs font-black">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{item.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setFormData({...item}); setIsEditing(true); setEditingId(item.id); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete('club_stadiums', item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'fan-comments' && (
            <div className="flex flex-col gap-3">
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 mb-2">
                <span className="text-[10px] font-black text-primary uppercase">تعليقات Fan Zone (المنشورات)</span>
              </div>
              {fanComments.map((comment) => (
                <div key={comment.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs">{comment.userName}</span>
                      <span className="text-[10px] text-slate-400">{comment.createdAt ? new Date(comment.createdAt).toLocaleString('ar-EG') : 'غير متوفر'}</span>
                    </div>
                    <button onClick={() => handleDelete('fan_comments', comment.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[8px] text-slate-400 font-black uppercase">التواجد في المنشور ID: {comment.postId?.slice(0, 8)}...</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-surface-dark p-2 rounded-lg">{comment.text}</p>
                  </div>
                </div>
              ))}
              {fanComments.length === 0 && <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 text-slate-400 font-bold text-sm">لا توجد تعليقات في Fan Zone</div>}
            </div>
          )}

          {activeTab === 'live' && (
             <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-4 flex flex-col gap-4">
               <div>
                  <label className="text-xs font-bold mb-1.5 block">حالة البث</label>
                  <select 
                    className="w-full p-2.5 rounded-lg border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" 
                    value={formData.isActive ?? (liveStream.isActive ? '1' : '0')} 
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === '1'})}
                  >
                     <option value="1">مباشر الآن (مفتوح)</option>
                     <option value="0">مغلق (يظهر مؤشر الانتظار)</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold mb-1.5 block">عنوان البث</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-lg border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" 
                    value={formData.title ?? liveStream.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-xs font-bold mb-1.5 block flex items-center justify-between">
                     رابط البث
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-lg border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm text-left dir-ltr" 
                    value={formData.url ?? liveStream.url} 
                    placeholder="https://..."
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                  />
               </div>
               <button onClick={handleAdd} className="w-full mt-2 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-sm">
                  تحديث البث
               </button>
             </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-card-dark w-full max-w-md rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">
                {isEditing ? 'تعديل' : 'إضافة'} {
                  activeTab === 'news' ? 'خبر' : 
                  activeTab === 'media' ? 'ميديا' : 
                  activeTab === 'matches' ? 'مباراة' : 
                  activeTab === 'clubs' ? 'نادي' : 
                  activeTab === 'history' ? (historySubTab === 'stats' ? 'رقم' : historySubTab === 'titles' ? 'بطولة' : historySubTab === 'timeline' ? 'حدث' : 'ملعب') :
                  'استطلاع'
                }
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                  setEditingId(null);
                }} 
                className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 no-scrollbar text-right">
                {activeTab === 'products' && (
                 <>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم المنتج</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">السعر</label>
                      <input type="number" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">النوع</label>
                      <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.category || 'tshirt'} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                        <option value="tshirt">تيشيرت</option>
                        <option value="mug">مج / كوب</option>
                        <option value="scarf">سكارف</option>
                        <option value="bracelet">حظاظة</option>
                        <option value="other">أخرى</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">الوصف</label>
                      <textarea className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold min-h-[100px]" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <UploadOrUrlField label="صورة المنتج" fieldName="imageUrl" currentUrl={formData.imageUrl} />
                 </>
               )}

               {activeTab === 'history' && (
                 <>
                   {historySubTab === 'stats' && (
                     <>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">العنوان (مثل: سنة تاريخ)</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.label || ''} onChange={(e) => setFormData({...formData, label: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">القيمة (الرقم)</label>
                          <input type="number" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.value || ''} onChange={(e) => setFormData({...formData, value: e.target.value})} />
                        </div>
                     </>
                   )}
                   {historySubTab === 'titles' && (
                     <>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم البطولة</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">العدد</label>
                          <input type="number" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.count || ''} onChange={(e) => setFormData({...formData, count: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">التصنيف</label>
                          <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.category || 'football'} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                            <option value="football">كرة قدم</option>
                            <option value="basketball">كرة سلة</option>
                          </select>
                        </div>
                     </>
                   )}
                   {historySubTab === 'timeline' && (
                     <>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">السنة</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.year || ''} onChange={(e) => setFormData({...formData, year: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">العنوان</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">الوصف</label>
                          <textarea className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm min-h-[100px]" value={formData.desc || ''} onChange={(e) => setFormData({...formData, desc: e.target.value})} />
                        </div>
                     </>
                   )}
                   {historySubTab === 'stadiums' && (
                     <>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم الملعب</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">النوع (مثل: أول ملعب)</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.type || ''} onChange={(e) => setFormData({...formData, type: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">الوصف</label>
                          <textarea className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm min-h-[100px]" value={formData.desc || ''} onChange={(e) => setFormData({...formData, desc: e.target.value})} />
                        </div>
                        <UploadOrUrlField label="صورة الملعب" fieldName="imageUrl" currentUrl={formData.imageUrl} />
                     </>
                   )}
                 </>
               )}

               {activeTab === 'news' && (
                 <>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">عنوان الخبر</label>
                     <input type="text" placeholder="مثلاً: الاتحاد يحقق فوزاً ثميناً" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">محتوى الخبر</label>
                     <textarea placeholder="اكتب تفاصيل الخبر هنا..." className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm min-h-[120px]" value={formData.content || ''} onChange={(e) => setFormData({...formData, content: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">التصنيف</label>
                      <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.category || 'أخبار النادي'} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                          {newsCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">مصدر الخبر</label>
                      <input type="text" placeholder="مثلاً: الموقع الرسمي" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.author || ''} onChange={(e) => setFormData({...formData, author: e.target.value})} />
                    </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">حالة النشر</label>
                     <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.status || 'published'} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                        <option value="published">منشور للعامة</option>
                        <option value="draft">مسودة (غير منشور)</option>
                     </select>
                   </div>
                    <UploadOrUrlField label="صورة الخبر" fieldName="image" currentUrl={formData.image} />
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">رابط RSS (لجلب الخبر تلقائياً)</label>
                     <input type="text" placeholder="https://..." className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.rssUrl || ''} onChange={(e) => setFormData({...formData, rssUrl: e.target.value})} />
                   </div>
                 </>
               )}

               {activeTab === 'users' && (
                 <>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم العضو</label>
                     <input type="text" placeholder="الاسم الجديد" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">البريد الإلكتروني (للعرض فقط)</label>
                     <input type="text" disabled className="w-full p-3 rounded-xl border border-border-light bg-slate-200 dark:bg-slate-800 dark:border-border-dark text-sm opacity-50 cursor-not-allowed" value={formData.email || ''} />
                   </div>
                 </>
               )}

               {activeTab === 'media' && (
                 <>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">العنوان</label>
                     <input type="text" placeholder="مثلاً: أهداف مباراة الأمس" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">النوع</label>
                      <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.type || 'video'} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                         <option value="video">فيديو</option>
                         <option value="photo">صورة</option>
                      </select>
                    </div>
                    {formData.type === 'video' && (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">المصدر</label>
                        <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.source || 'upload'} onChange={(e) => setFormData({...formData, source: e.target.value})}>
                          <option value="upload">رفع فيديو</option>
                          <option value="youtube">رابط يوتيوب</option>
                          <option value="embed">تضمين (Embed URL)</option>
                        </select>
                      </div>
                    )}
                   </div>

                   {formData.type === 'video' && formData.source === 'youtube' && (
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">رابط يوتيوب</label>
                      <input 
                        type="text" 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-mono text-left dir-ltr" 
                        value={formData.url || ''} 
                        onChange={(e) => {
                          const url = e.target.value;
                          let thumb = formData.thumbnailUrl;
                          if (url.includes('youtube.com/watch?v=')) {
                            const id = url.split('v=')[1]?.split('&')[0];
                            thumb = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
                          } else if (url.includes('youtu.be/')) {
                            const id = url.split('youtu.be/')[1]?.split('?')[0];
                            thumb = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
                          }
                          setFormData({...formData, url, thumbnailUrl: thumb});
                        }} 
                      />
                    </div>
                   )}

                   {formData.type === 'video' && formData.source === 'embed' && (
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">رابط التضمين (Embed URL)</label>
                      <input 
                        type="text" 
                        placeholder="https://..." 
                        className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-mono text-left dir-ltr" 
                        value={formData.url || ''} 
                        onChange={(e) => setFormData({...formData, url: e.target.value})} 
                      />
                      <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-tighter">Enter direct embed URL (src of iframe)</p>
                    </div>
                   )}

                   {formData.type === 'video' && formData.source === 'upload' && (
                    <UploadOrUrlField label="ميديا الفيديو" fieldName="url" currentUrl={formData.url} type="video" />
                   )}

                   {formData.type === 'photo' && (
                    <UploadOrUrlField label="ميديا الصورة" fieldName="url" currentUrl={formData.url} type="image" />
                   )}

                   {formData.type === 'video' && (
                     <>
                        <UploadOrUrlField label="صورة الغلاف (Thumbnail)" fieldName="thumbnailUrl" currentUrl={formData.thumbnailUrl} />
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">المدة (مثلاً 05:20)</label>
                          <input type="text" placeholder="00:00" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.duration || ''} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
                        </div>
                     </>
                   )}
                 </>
               )}
               
               {activeTab === 'matches' && (
                 <>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">الفريق المضيف</label>
                       <input type="text" placeholder="الفريق المضيف" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 text-sm font-bold" value={formData.homeTeam || ''} onChange={(e) => setFormData({...formData, homeTeam: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">الفريق الخصم</label>
                       <input type="text" placeholder="الفريق الخصم" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 text-sm font-bold" value={formData.awayTeam || ''} onChange={(e) => setFormData({...formData, awayTeam: e.target.value})} />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <UploadField label="لوجو صاحب الأرض" fieldName="homeLogo" currentUrl={formData.homeLogo} />
                     </div>
                     <div>
                       <UploadField label="لوجو الخصم" fieldName="awayLogo" currentUrl={formData.awayLogo} />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">أهدافنا</label>
                       <input 
                         type="text" 
                         placeholder="0" 
                         className="w-full p-3 rounded-xl border border-border-light bg-slate-50 text-sm font-bold" 
                         value={formData.homeScore ?? ''} 
                         onChange={(e) => setFormData({...formData, homeScore: e.target.value})} 
                       />
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">أهداف الخصم</label>
                       <input 
                         type="text" 
                         placeholder="0" 
                         className="w-full p-3 rounded-xl border border-border-light bg-slate-50 text-sm font-bold" 
                         value={formData.awayScore ?? ''} 
                         onChange={(e) => setFormData({...formData, awayScore: e.target.value})} 
                       />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">الحالة</label>
                       <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 text-sm font-bold" value={formData.status || 'upcoming'} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                          <option value="upcoming">قادمة</option>
                          <option value="live">مباشر</option>
                          <option value="finished">منتهية</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">الدقيقة الحالية</label>
                       <input 
                         type="number" 
                         placeholder="0" 
                         className="w-full p-3 rounded-xl border border-border-light bg-slate-50 text-sm font-bold" 
                         value={formData.timerBaseMinute || 0} 
                         onChange={(e) => setFormData({...formData, timerBaseMinute: e.target.value})} 
                       />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">البطولة</label>
                       <input type="text" placeholder="البطولة" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 text-sm" value={formData.competition || ''} onChange={(e) => setFormData({...formData, competition: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">الملعب</label>
                       <input type="text" placeholder="الملعب" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 text-sm" value={formData.stadium || ''} onChange={(e) => setFormData({...formData, stadium: e.target.value})} />
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">تاريخ ووقت المباراة</label>
                     <input type="datetime-local" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 text-sm" value={formData.date ? new Date(formData.date).toISOString().slice(0, 16) : ''} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                    <div className="flex items-center gap-2 mt-4 bg-primary/5 p-3 rounded-xl border border-primary/10">
                       <input 
                         type="checkbox" 
                         id="isMatchDay" 
                         className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary"
                         checked={formData.isMatchDay || false} 
                         onChange={(e) => setFormData({...formData, isMatchDay: e.target.checked})}
                       />
                       <label htmlFor="isMatchDay" className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter cursor-pointer">Set as Match Day</label>
                    </div>
                   </div>
                 </>
               )}

               {activeTab === 'clubs' && (
                  <>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم النادي</label>
                      <input type="text" placeholder="مثلاً: نادي الاتحاد" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                     <UploadField label="شعار النادي" fieldName="logo" currentUrl={formData.logo} />

                    </div>
                  </>
                )}

                 {activeTab === 'polls' && (
                   <>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">سؤال الاستطلاع</label>
                       <input type="text" placeholder="مثلاً: من هو أفضل لاعب هذا الشهر؟" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.question || ''} onChange={(e) => setFormData({...formData, question: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block uppercase">خيارات الاستطلاع</label>
                       <div className="space-y-2">
                         {(Array.isArray(formData.options) ? formData.options : ['', '']).map((option: string, idx: number) => (
                            <div key={idx} className="flex gap-2">
                              <div className="flex flex-col gap-1 flex-1">
                                <label className="text-[8px] font-bold text-slate-400 uppercase px-1">الخيار {idx + 1}</label>
                                <input 
                                  type="text" 
                                  placeholder={`الخيار ${idx + 1}`}
                                  className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" 
                                  value={option} 
                                  onChange={(e) => {
                                    const newOptions = [...(formData.options || ['', ''])];
                                    newOptions[idx] = e.target.value;
                                    setFormData({...formData, options: newOptions});
                                  }} 
                                />
                              </div>
                              <div className="w-20">
                                <label className="text-[8px] font-bold text-slate-400 uppercase px-1">الأصوات</label>
                                <input 
                                  type="number" 
                                  className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-black text-primary text-center" 
                                  value={formData.votes?.[idx] || 0} 
                                  onChange={(e) => {
                                    const newVotes = { ...(formData.votes || {}) };
                                    newVotes[idx] = Number(e.target.value);
                                    setFormData({...formData, votes: newVotes});
                                  }}
                                />
                              </div>
                              {((formData.options?.length || 0) > 2) && (
                                <button 
                                  onClick={() => {
                                    const newOptions = [...(formData.options || [])];
                                    newOptions.splice(idx, 1);
                                    setFormData({...formData, options: newOptions});
                                  }}
                                  className="px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                         ))}
                         <button 
                           onClick={() => {
                             const newOptions = Array.isArray(formData.options) ? [...formData.options] : ['', ''];
                             newOptions.push('');
                             setFormData({...formData, options: newOptions});
                           }}
                           className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-border-dark rounded-xl text-[10px] font-black text-slate-400 hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-1"
                         >
                           <Plus size={12} />
                           إضافة خيار
                         </button>
                       </div>
                     </div>
                     <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="checkbox" 
                          id="pollActive" 
                          checked={formData.active ?? true} 
                          onChange={(e) => setFormData({...formData, active: e.target.checked})}
                        />
                        <label htmlFor="pollActive" className="text-xs font-bold font-sans">تفعيل الاستطلاع ليظهر للمشجعين</label>
                     </div>
                   </>
                 )}

                 {activeTab === 'predictions' && (
                   <>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">المباراة</label>
                       <select 
                        className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold"
                        value={formData.matchId || ''}
                        onChange={(e) => setFormData({...formData, matchId: e.target.value})}
                       >
                         <option value="">اختر المباراة</option>
                         {matches.map(m => (
                           <option key={m.id} value={m.id}>{m.homeTeam} × {m.awayTeam} ({new Date(m.date).toLocaleDateString('ar-EG')})</option>
                         ))}
                       </select>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                       <div>
                         <label className="text-[10px] font-black text-slate-500 mb-1 block">أهداف الفريق 1</label>
                         <input type="number" placeholder="0" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.homeScore ?? ''} onChange={(e) => setFormData({...formData, homeScore: Number(e.target.value)})} />
                       </div>
                       <div>
                         <label className="text-[10px] font-black text-slate-500 mb-1 block">أهداف الفريق 2</label>
                         <input type="number" placeholder="0" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.awayScore ?? ''} onChange={(e) => setFormData({...formData, awayScore: Number(e.target.value)})} />
                       </div>
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم المتوقع</label>
                       <input type="text" placeholder="مثلاً: محمد علي" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.userName || ''} onChange={(e) => setFormData({...formData, userName: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">البريد الإلكتروني (اختياري)</label>
                       <input type="email" placeholder="email@example.com" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.userEmail || ''} onChange={(e) => setFormData({...formData, userEmail: e.target.value})} />
                     </div>
                   </>
                 )}
            </div>

            <button 
              onClick={handleAdd} 
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm mt-6 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {isEditing ? 'تعديل وحفظ' : 'إضافة وحفظ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
