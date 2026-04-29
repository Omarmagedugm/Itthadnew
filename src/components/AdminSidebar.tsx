import React from 'react';
import { 
  LayoutDashboard, 
  Newspaper, 
  PlayCircle, 
  Trophy, 
  Users as UsersIcon, 
  Settings as SettingsIcon,
  MessageSquare,
  BarChart3,
  Radio,
  History as HistoryIcon,
  Rss,
  MessageCircle,
  Tags,
  ShoppingBag,
  ShoppingCart,
  Shield // <-- import Shield instead
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onClose?: () => void;
}

export default function AdminSidebar({ activeTab, setActiveTab, onClose }: AdminSidebarProps) {
  const tabs = [
    { title: 'عام', items: [
      { id: 'overview', icon: <LayoutDashboard size={18} />, label: 'نظرة عامة' },
      { id: 'settings', icon: <SettingsIcon size={18} />, label: 'إعدادات المنصة' },
    ]},
    { title: 'إدارة المحتوى', items: [
      { id: 'news', icon: <Newspaper size={18} />, label: 'الأخبار والمقالات' },
      { id: 'news-categories', icon: <Tags size={18} />, label: 'أقسام المحتوى' },
      { id: 'media', icon: <PlayCircle size={18} />, label: 'الاستوديو والمالتيميديا' },
      { id: 'matches', icon: <Trophy size={18} />, label: 'مركز المباريات' },
      { id: 'live', icon: <Radio size={18} />, label: 'تغطية البث المباشر' },
      { id: 'history', icon: <HistoryIcon size={18} />, label: 'تاريخ وإنجازات' },
    ]},
    { title: 'التجارة الإلكترونية', items: [
      { id: 'products', icon: <ShoppingBag size={18} />, label: 'المنتجات والمتجر' },
      { id: 'orders', icon: <ShoppingCart size={18} />, label: 'الطلبات' },
    ]},
    { title: 'إدارة المجتمع', items: [
      { id: 'fanzone', icon: <UsersIcon size={18} />, label: 'مراقب الفان زون' },
      { id: 'posts', icon: <MessageSquare size={18} />, label: 'منشورات الأعضاء' },
      { id: 'fan-comments', icon: <MessageCircle size={18} />, label: 'التعليقات والمناقشات' },
      { id: 'polls', icon: <BarChart3 size={18} />, label: 'التصويتات' },
      { id: 'predictions', icon: <Trophy size={18} />, label: 'توقعات الجماهير' },
    ]},
    { title: 'الأعضاء والصلاحيات', items: [
      { id: 'users', icon: <UsersIcon size={18} />, label: 'سجل الأعضاء' },
      { id: 'roles', icon: <Shield size={18} />, label: 'الأدوار والصلاحيات' },
    ]},
    { title: 'البيانات المرجعية', items: [
      { id: 'clubs', icon: <Shield size={18} />, label: 'قائمة الأندية' },
    ]}
  ];

  return (
    <div className="w-64 bg-white dark:bg-card-dark border-l border-border-light dark:border-border-dark flex flex-col h-full overflow-y-auto no-scrollbar py-6">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h2 className="font-black text-lg tracking-tight leading-none">إدارة المنصة</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Control</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 px-4">
        {tabs.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <p className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{group.title}</p>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    if (onClose) onClose();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                    activeTab === item.id 
                      ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-dark pressable'
                  }`}
                >
                  <span className={activeTab === item.id ? 'text-primary' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                  {activeTab === item.id && (
                    <div className="mr-auto w-1.5 h-1.5 rounded-full bg-primary shadow-glow"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto px-4 pt-8">
        <div className="bg-slate-50 dark:bg-surface-dark p-4 rounded-3xl border border-slate-100 dark:border-border-dark">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             </div>
             <p className="text-[10px] font-black text-slate-500 uppercase">حالة النظام: متصل</p>
          </div>
          <button className="w-full py-2.5 rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-[10px] font-black text-slate-500 hover:text-red-500 transition-colors">
            تسجيل الخروج من الإدارة
          </button>
        </div>
      </div>
    </div>
  );
}
