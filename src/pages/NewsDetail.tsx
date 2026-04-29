import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'motion/react';
import { Share2, Bookmark, Heart, ArrowRight, Rss, Edit2, Calendar, User } from 'lucide-react';

export default function NewsDetail() {
  const { id } = useParams();
  const { news, profile } = useAppStore();
  const navigate = useNavigate();
  
  const article = news.find(n => n.id === id);

  if (!article) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background-light dark:bg-background-dark min-h-screen">
        <h1 className="text-2xl font-black mb-4">الخبر غير موجود</h1>
        <Link to="/news" className="bg-primary text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2">
          <ArrowRight size={20} />
          العودة للأخبار
        </Link>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="relative flex-1 flex flex-col bg-background-light dark:bg-background-dark min-h-screen pb-24 overflow-x-hidden">
      {/* Article Header Background */}
      <div className="absolute top-0 left-0 right-0 h-[45vh] overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark via-transparent to-transparent z-10"></div>
         <div 
           className="w-full h-full bg-cover bg-center scale-105"
           style={{ backgroundImage: `url('${article.image}')` }}
         />
      </div>

      {/* Floating Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 backdrop-blur-md bg-transparent">
        <Link to="/news" className="p-2.5 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-xl text-white shadow-lg pressable border border-white/20">
          <ArrowRight size={22} />
        </Link>
        <div className="flex gap-2">
           {profile?.role === 'admin' && (
             <button 
               onClick={() => navigate('/admin', { state: { editCategory: 'news', editId: article.id } })}
               className="p-2.5 rounded-full bg-primary text-white shadow-lg pressable border border-primary/20"
             >
               <Edit2 size={18} />
             </button>
           )}
           <button className="p-2.5 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-xl text-white shadow-lg pressable border border-white/20">
             <Share2 size={18} />
           </button>
           <button className="p-2.5 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-xl text-white shadow-lg pressable border border-white/20">
             <Bookmark size={18} />
           </button>
        </div>
      </header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 px-5 pt-[25vh]"
      >
        <motion.div variants={itemVariants} className="bg-white dark:bg-card-dark rounded-3xl p-6 shadow-xl border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-wider text-primary">
            <span className="px-2 py-0.5 border border-primary/30 rounded">{article.category || 'أخبار النادي'}</span>
            <span className="text-slate-400 font-bold">•</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDistanceToNow(new Date(article.date), { locale: ar, addSuffix: true })}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-snug mb-6">{article.title}</h1>

          <div className="flex items-center justify-between py-4 border-y border-border-light dark:border-border-dark mb-6">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                   <User size={16} />
                </div>
                <div>
                   <p className="text-xs font-black text-slate-800 dark:text-white">{article.author}</p>
                   <p className="text-[10px] text-slate-500 font-bold">محرر رياضي</p>
                </div>
             </div>
             <div className="flex items-center gap-3 text-slate-400">
                <div className="flex items-center gap-1">
                   <Heart size={14} />
                   <span className="text-[10px] font-bold">124</span>
                </div>
             </div>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed text-justify whitespace-pre-wrap">
              {article.content || 'لا يوجد محتوى متاح لهذا الخبر في الوقت الحالي.'}
            </p>
            {article.type === 'rss' && (
               <div className="mt-8 p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                  <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400">
                     <Rss size={18} />
                     <span className="text-sm font-black">مصدر خارجي</span>
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-4">هذا الخبر تم جلبه عبر خدمة RSS، لمزيد من التفاصيل يمكنك زيارة المصدر الأصلي.</p>
                  <a 
                    href={article.rssUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-orange-700 transition-colors"
                  >
                    عرض المصدر الأصلي
                  </a>
               </div>
            )}
          </div>
        </motion.div>

        {/* Similar News or interactions could go here */}
      </motion.main>
    </div>
  );
}
