import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Menu, LayoutDashboard, Flag, Info, ShieldCheck, Mail, Edit2, Bell, Search, Settings, Radio, Calendar, MessagesSquare, ChevronLeft, PlayCircle, Image as ImageIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Home() {
  const { news, media, matches, liveStream, profile, appSettings } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const navigate = useNavigate();

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
  
  const publishedNews = news.filter(n => n.status !== 'draft');
  const recentNews = publishedNews.slice(0, 5);
  const recentMedia = media.slice(0, 4);
  const liveMatch = matches.find(m => m.status === 'live');
  const heroMatch = liveMatch || matches.find(m => m.status === 'upcoming') || matches[0];
  const upcomingMatches = matches.filter(m => m.status === 'upcoming').slice(0, 3);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
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
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-border-light/40 dark:border-border-dark/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl glass-card text-slate-600 dark:text-slate-300 hover:text-primary transition-all duration-300"
          >
            <Menu size={20} strokeWidth={2.5} />
          </motion.button>

          <div className="flex flex-col items-center">
            <h1 className="text-sm font-black tracking-tight text-primary-dark dark:text-white uppercase">قناة الاتحاد السكندري</h1>
            <div className="flex items-center gap-1">
              <div className="h-1 w-1 bg-accent rounded-full animate-pulse"></div>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Official Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl glass-card text-slate-500 dark:text-slate-400 hover:text-primary transition-all duration-300"
            >
              <Bell size={20} strokeWidth={2.5} />
              <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full ring-2 ring-white dark:ring-surface-dark"></span>
            </motion.button>
          </div>
        </div>
      </header>

      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} profile={profile} />

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-x-hidden px-4 flex flex-col gap-8 py-6"
      >
        {/* Main Match Card - Immersive Upgrade */}
        {heroMatch && (
          <motion.section variants={itemVariants} className="relative group">
            {profile.role === 'admin' && (
               <button 
                 onClick={() => navigate('/admin', { state: { editCategory: 'matches', editId: heroMatch.id } })}
                 className="absolute -top-2 -left-2 z-50 p-2.5 bg-accent text-white rounded-2xl shadow-premium shadow-accent/20 pressable"
               >
                 <Edit2 size={16} />
               </button>
            )}
            
            <div className="relative overflow-hidden rounded-[40px] stadium-gradient shadow-2xl cinematic-glow">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
              
              <div className="relative p-6">
                <div className="mb-6 flex items-center justify-between">
                  {heroMatch.status === 'live' ? (
                    <div className="flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-[10px] font-black text-white shadow-glow">
                      <div className="relative h-2 w-2">
                        <div className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></div>
                        <div className="relative rounded-full h-2 w-2 bg-white"></div>
                      </div>
                      بث مباشر
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-md px-3 py-1 text-[10px] font-black text-white ring-1 ring-white/10 uppercase tracking-tighter">
                      {heroMatch.status === 'finished' ? 'انتهت المباراة' : 'المباراة القادمة'}
                    </div>
                  )}
                  
                  <div className="flex flex-col items-end">
                    <div className="text-[10px] font-black text-white px-2 py-1 bg-accent/20 rounded-lg backdrop-blur-md border border-white/10 tracking-tighter">
                      {heroMatch.competition}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 items-center gap-2 py-4">
                  <div className="flex flex-col items-center gap-4 group/team">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur-xl shadow-premium animate-float group-hover/team:scale-110 transition-transform duration-500">
                      <img alt={heroMatch.homeTeam} className="w-full h-full object-contain filter drop-shadow-2xl" src={heroMatch.homeLogo} />
                    </div>
                    <span className="text-center text-[10px] font-black text-white uppercase tracking-wider">{heroMatch.homeTeam}</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="text-5xl font-black text-white tracking-widest tabular-nums filter drop-shadow-[0_5px_15px_rgba(46,204,113,0.3)]">
                      {heroMatch.status === 'upcoming' ? (
                        <div className="text-2xl opacity-60">VS</div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span>{heroMatch.homeScore}</span>
                          <span className="text-accent">:</span>
                          <span>{heroMatch.awayScore}</span>
                        </div>
                      )}
                    </div>
                    {heroMatch.status === 'live' && (
                       <div className="mt-4 flex flex-col items-center">
                         <div className="px-3 py-1 bg-red-600 rounded-full text-[10px] font-black text-white animate-pulse shadow-glow">
                           الدقيقة {calculateCurrentMinute(heroMatch)}
                         </div>
                       </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 group/team">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur-xl shadow-premium animate-float [animation-delay:0.5s] group-hover/team:scale-110 transition-transform duration-500">
                      <img alt={heroMatch.awayTeam} className="w-full h-full object-contain filter drop-shadow-2xl" src={heroMatch.awayLogo} />
                    </div>
                    <span className="text-center text-[10px] font-black text-white uppercase tracking-wider">{heroMatch.awayTeam}</span>
                  </div>
                </div>
                
                <div className="mt-8 relative z-[60]">
                  <Link 
                    to={heroMatch.status === 'live' || liveStream.isActive ? "/live" : "/matches"} 
                    className="w-full h-14 rounded-2xl bg-white text-primary-dark hover:bg-primary-light hover:text-white transition-all duration-300 font-black text-sm flex items-center justify-center gap-3 shadow-premium group/btn relative z-[70] cursor-pointer"
                  >
                    {heroMatch.status === 'live' || liveStream.isActive ? <Radio size={24} className="group-hover/btn:translate-x-1 transition-transform" /> : <Calendar size={24} className="group-hover/btn:translate-x-1 transition-transform" />}
                    {heroMatch.status === 'live' || liveStream.isActive ? 'دخول البث المباشر' : 'تفاصيل المباراة'}
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Fan Zone CTA - Connected Upgrade */}
        <motion.section variants={itemVariants}>
          <Link to="/fan-zone" className="block relative overflow-hidden rounded-[40px] bg-slate-900 shadow-2xl group cinematic-glow border border-white/5">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-110 transition-transform duration-1000"></div>
             <div className="absolute inset-0 stadium-gradient mix-blend-multiply opacity-60"></div>
             <div className="absolute inset-0 bg-gradient-to-l from-slate-900/90 via-slate-900/40 to-transparent"></div>
             
             <div className="relative p-7 flex flex-col items-start gap-2">
                <div className="flex items-center gap-2 rounded-full bg-primary/20 backdrop-blur-md px-3 py-1 border border-primary/30">
                   <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse shadow-glow"></div>
                   <span className="text-[9px] font-black text-accent uppercase tracking-widest">Fan Community Hub</span>
                </div>
                <h3 className="text-2xl font-black text-white leading-tight">منطقة المشجعين</h3>
                <p className="text-[10px] text-slate-300 font-bold max-w-[200px] leading-relaxed mt-1">ساهم في النقاشات، توقع نتائج المباريات، وكن المشجع المثالي لزعيم الثغر.</p>
                <div className="mt-6 h-11 px-6 bg-white text-primary-dark rounded-2xl text-[11px] font-black shadow-2xl flex items-center justify-center gap-2 group/cta hover:bg-primary-light hover:text-white transition-all">
                  دخول Fan Zone
                  <MessagesSquare size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
             </div>
          </Link>
        </motion.section>

        {/* Live Broadcast Banner (if active) */}
        {liveStream.isActive && (
          <motion.section variants={itemVariants} className="relative z-[60]">
            <Link to="/live" className="flex items-center justify-between p-4 rounded-[32px] bg-accent/10 border border-accent/20 cinematic-glow pressable relative z-[70] cursor-pointer">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center text-white shadow-glow animate-pulse">
                     <Radio size={24} />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm font-black text-slate-800 dark:text-white">بث مباشر متاح الآن</span>
                     <span className="text-[10px] font-bold text-accent">اضغط للمتابعة الفورية</span>
                  </div>
               </div>
               <div className="h-10 w-10 rounded-xl bg-white dark:bg-surface-dark flex items-center justify-center text-slate-400">
                  <ChevronLeft size={24} />
               </div>
            </Link>
          </motion.section>
        )}

        {/* Home Sections - Latest News Carousel */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">آخر الأخبار</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Latest Club Updates</span>
            </div>
            <Link to="/news" className="h-8 px-4 rounded-xl glass-card flex items-center justify-center text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all">
              عرض الكل
            </Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-4 -mx-4 px-4">
            {recentNews.map((item) => (
              <motion.div 
                key={item.id}
                className="flex-shrink-0 w-[280px] snap-center group"
                whileTap={{ scale: 0.98 }}
              >
                <Link to={`/news/${item.id}`} className="block relative overflow-hidden rounded-[32px] bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-premium hover:shadow-2xl transition-all duration-500">
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4 h-7 px-3 bg-primary/90 backdrop-blur-md rounded-lg flex items-center justify-center text-[8px] font-black text-white uppercase tracking-widest ring-1 ring-white/20">
                      {item.type === 'rss' ? 'News Feed' : 'Official'}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-relaxed min-h-[40px] group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400">
                        <Calendar size={12} />
                        {formatDistanceToNow(new Date(item.date), { locale: ar, addSuffix: true })}
                      </div>
                      <div className="text-[10px] font-black text-primary-light">اقرأ المزيد</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            {recentNews.length === 0 && (
              <div className="w-full h-40 flex items-center justify-center glass-card rounded-[32px] border-dashed border-2 border-slate-200 dark:border-border-dark text-slate-400 font-bold text-sm">
                لا يوجد أخبار حالياً
              </div>
            )}
          </div>
        </motion.section>

        {/* Media Highlight - Grid Upgrade */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">ميديا الاتحاد</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Exclusive Multimedia</span>
            </div>
            <Link to="/media" className="h-8 px-4 rounded-xl glass-card flex items-center justify-center text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all">
              عرض المزيد
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {recentMedia.map((item, idx) => (
              <motion.div 
                key={item.id} 
                whileHover={{ y: -4 }} 
                whileTap={{ scale: 0.96 }}
                className={idx === 0 ? 'col-span-2' : ''}
              >
                <Link to="/media" className={`relative flex ${idx === 0 ? 'aspect-[16/9]' : 'aspect-square'} overflow-hidden rounded-[32px] shadow-premium group cinematic-glow`}>
                  <img src={item.thumbnailUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                  
                  <div className="absolute top-4 right-4 h-9 w-9 rounded-2xl glass-card flex items-center justify-center text-white ring-1 ring-white/10 group-hover:bg-primary transition-colors">
                    {item.type === 'video' ? <PlayCircle size={18} /> : <ImageIcon size={18} />}
                  </div>
                  
                  <div className="absolute bottom-5 left-5 right-5">
                    {item.type === 'video' && item.duration && (
                      <span className="inline-block mb-2 text-[8px] bg-accent px-1.5 py-0.5 rounded-lg text-white font-black tracking-tighter shadow-glow">
                        {item.duration}
                      </span>
                    )}
                    <p className={`font-black text-white leading-tight ${idx === 0 ? 'text-lg' : 'text-xs'} line-clamp-2 drop-shadow-xl`}>
                      {item.title}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Upcoming Matches Sidebar - List Refined */}
        {upcomingMatches.length > 0 && (
          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex flex-col px-1">
              <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">مباريات مرتقبة</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Upcoming Fixtures</span>
            </div>
            
            <div className="flex flex-col gap-4">
              {upcomingMatches.map((match) => (
                <Link key={match.id} to="/matches" className="flex items-center justify-between glass-card p-4 rounded-[28px] shadow-premium hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center -space-x-3 rtl:space-x-reverse">
                      <div className="h-12 w-12 rounded-2xl bg-white dark:bg-background-dark p-2 shadow-premium ring-1 ring-border-light dark:ring-border-dark flex items-center justify-center z-10">
                        <img src={match.homeLogo} alt="Home" className="h-full w-full object-contain" />
                      </div>
                      <div className="h-12 w-12 rounded-2xl bg-white dark:bg-background-dark p-2 shadow-premium ring-1 ring-border-light dark:ring-border-dark flex items-center justify-center z-0 scale-90 opacity-80">
                        <img src={match.awayLogo} alt="Away" className="h-full w-full object-contain" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-xs font-black text-slate-800 dark:text-white">{match.homeTeam} × {match.awayTeam}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                         <span className="text-[9px] font-black text-primary-light bg-primary/5 px-2 py-0.5 rounded-lg">{match.competition}</span>
                         <span className="text-[9px] font-bold text-slate-400">{format(new Date(match.date), 'EEEE, p', { locale: ar })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-background-dark text-slate-300 group-hover:text-primary transition-colors">
                     <ChevronLeft size={18} />
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </motion.main>
    </div>
  );
}

