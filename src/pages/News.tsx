import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Rss, Search, SlidersHorizontal, ChevronRight, ChevronLeft, Calendar, FileX } from 'lucide-react';
import { useState } from 'react';

export default function News() {
  const { news } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  
  const categories = ['الكل', 'كرة القدم', 'كرة السلة', 'الناشئين', 'النادي', 'أخبار'];

  const publishedNews = news.filter(n => n.status !== 'draft');

  const filteredNews = selectedCategory === 'الكل' 
    ? publishedNews 
    : publishedNews.filter(n => n.category === selectedCategory || (selectedCategory === 'أخبار' && n.type === 'rss'));

  const featured = filteredNews[0];
  const otherNews = filteredNews.slice(1);

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
      transition: { type: "spring", stiffness: 260, damping: 20 }
    }
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col pb-24 px-0 bg-background-light dark:bg-background-dark min-h-screen">
      <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-border-light/40 dark:border-border-dark/40 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-2xl glass-card text-slate-600 dark:text-slate-300 hover:text-primary transition-all duration-300">
              <ChevronLeft size={24} />
            </Link>
            <div className="flex flex-col">
               <h1 className="text-xl font-black tracking-tight text-primary-dark dark:text-white uppercase leading-none">مركز الأخبار</h1>
               <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Latest Updates</span>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl glass-card text-slate-500 dark:text-slate-400 hover:text-primary transition-all duration-300"
          >
            <Search size={20} strokeWidth={2.5} />
          </motion.button>
        </div>
      </header>

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-x-hidden p-4 flex flex-col gap-8"
      >
        {/* Categories Carousel */}
        <motion.section variants={itemVariants}>
          <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x -mx-4 px-4 pb-2">
            {categories.map((cat, i) => (
              <motion.button 
                key={i} 
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-6 py-2.5 rounded-2xl font-black text-xs transition-all duration-300 snap-center border ${
                  selectedCategory === cat 
                    ? 'bg-primary text-white shadow-premium shadow-primary/30 border-primary' 
                    : 'bg-white dark:bg-surface-dark text-slate-500 dark:text-slate-400 border-border-light dark:border-border-dark hover:border-primary/50'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </motion.section>

        <div className="flex flex-col gap-8">
          {/* Featured News Hero */}
          <AnimatePresence mode="wait">
            {featured && (
              <motion.section 
                key={featured.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                variants={itemVariants} 
                className="w-full"
              >
                <Link to={`/news/${featured.id}`} className="group relative block w-full overflow-hidden rounded-[40px] bg-white dark:bg-surface-dark shadow-premium hover:shadow-2xl transition-all duration-500 border border-border-light dark:border-border-dark cinematic-glow">
                  <div className="aspect-[16/10] w-full relative overflow-hidden">
                    <img src={featured.image} alt={featured.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                    
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                      <div className="px-3 py-1 bg-accent rounded-xl text-[9px] font-black text-white shadow-glow tracking-tighter">
                        خبر مميز
                      </div>
                      {featured.type === 'rss' && (
                        <div className="px-3 py-1 bg-orange-500 rounded-xl text-[9px] font-black text-white flex items-center gap-2 shadow-premium">
                          <Rss size={10} strokeWidth={3} /> RSS
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute bottom-6 left-6 right-6 z-20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[9px] font-black text-white uppercase tracking-widest">
                          <Calendar size={12} />
                          {formatDistanceToNow(new Date(featured.date), { locale: ar, addSuffix: true })}
                        </div>
                      </div>
                      <h2 className="text-xl font-black text-white leading-tight drop-shadow-2xl group-hover:text-accent transition-colors duration-300">
                        {featured.title}
                      </h2>
                    </div>
                  </div>
                </Link>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Side List - Trending Feed */}
          <motion.section variants={itemVariants}>
             <div className="glass-card p-6 rounded-[32px] shadow-premium">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-black flex items-center gap-2 text-slate-800 dark:text-white uppercase tracking-tight">
                    <span className="w-1.5 h-4 bg-primary rounded-full"></span> 
                    الأكثر قراءة الآن
                  </h3>
                  <SlidersHorizontal size={16} className="text-slate-300" />
                </div>
                <div className="flex flex-col gap-6">
                  {filteredNews.slice(1, 4).map((item, i) => (
                    <Link to={`/news/${item.id}`} key={item.id} className="group flex gap-4 items-center border-b border-border-light/40 dark:border-border-dark/40 pb-6 last:border-0 last:pb-0 pressable relative">
                      <div className="text-3xl font-black text-slate-100 dark:text-slate-800 italic group-hover:text-primary transition-colors duration-500">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                           <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed line-clamp-2 group-hover:text-primary transition-colors">
                            {item.title}
                           </h4>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                           <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                            {formatDistanceToNow(new Date(item.date), { locale: ar, addSuffix: true })}
                           </span>
                           {item.type === 'rss' && (
                             <div className="flex items-center gap-1 text-[10px] text-orange-400 font-black">
                               <Rss size={10} strokeWidth={3} />
                               NEWS
                             </div>
                           )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
             </div>
          </motion.section>

          {/* All News Grid */}
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="flex flex-col px-1">
              <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none uppercase">البث الإخباري</h2>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Journalism Feed</span>
            </div>
            
            <div className="flex flex-col gap-6">
              {otherNews.map((item) => (
                <Link to={`/news/${item.id}`} key={item.id} className="group flex gap-4 bg-white dark:bg-surface-dark rounded-[28px] overflow-hidden border border-border-light/40 dark:border-border-dark/40 shadow-premium hover:shadow-2xl transition-all duration-300 p-2.5">
                  <div className="w-[110px] h-[110px] overflow-hidden relative rounded-2xl flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    {item.type === 'rss' && (
                       <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-lg flex items-center gap-1 shadow-sm text-white">
                          <Rss size={8} className="text-orange-400" />
                          <span className="text-[8px] font-black tracking-tighter">FEED</span>
                       </div>
                    )}
                  </div>
                  <div className="py-2 pl-2 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                          {item.category || 'نادي الاتحاد'}
                        </span>
                        <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDistanceToNow(new Date(item.date), { locale: ar, addSuffix: true })}
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 mt-2">
                      <span>عرض الخبر</span>
                      <ChevronRight size={10} strokeWidth={3} className="rotate-180" />
                    </div>
                  </div>
                </Link>
              ))}
              
              {otherNews.length === 0 && (
                <div className="w-full py-20 flex flex-col items-center justify-center glass-card rounded-[40px] border-dashed border-2 border-slate-200 dark:border-border-dark text-slate-400">
                  <FileX size={36} className="mb-4 opacity-20" />
                  <span className="font-bold text-sm">لا توجد أخبار في هذا القسم</span>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </motion.main>
    </div>
  );
}

