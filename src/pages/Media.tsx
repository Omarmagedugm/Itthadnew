import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { ar } from 'date-fns/locale';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Play, Image as ImageIcon, Video, Radio, Clock, Eye, X, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';

export default function Media() {
  const { media } = useAppStore();
  const [activeTab, setActiveTab] = useState<'all' | 'photo' | 'video'>('all');
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const photos = media.filter(m => m.type === 'photo');
  const videos = media.filter(m => m.type === 'video');

  const getEmbedUrl = (url: string, source?: string) => {
    if (source === 'embed') return url;
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    } else if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    } else if (url.includes('youtube.com/embed/')) {
      return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
    }
    return null;
  };

  const isYoutube = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };
  
  const displayMedia = activeTab === 'all' ? media : activeTab === 'photo' ? photos : videos;
  const featuredMedia = displayMedia.length > 0 ? displayMedia[0] : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0, 
      transition: { type: "spring", stiffness: 260, damping: 20 }
    }
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col pb-24 px-0 bg-background-light dark:bg-background-dark min-h-screen">
      <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-border-light/40 dark:border-border-dark/40 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-2xl glass-card text-slate-600 dark:text-slate-300 hover:text-primary transition-all duration-300">
              <ChevronLeft size={24} />
            </Link>
            <div className="flex flex-col">
               <h1 className="text-xl font-black tracking-tight text-primary-dark dark:text-white uppercase leading-none">مركز الميديا</h1>
               <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Official Gallery</span>
            </div>
          </div>
        </div>

        {/* Premium Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-surface-dark rounded-2xl">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'photo', label: 'الصور' },
            { id: 'video', label: 'الفيديو' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-primary text-primary-dark dark:text-white shadow-premium' 
                  : 'text-slate-500 hover:text-primary-dark dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <Link to="/live" className="flex-1 py-2.5 rounded-xl text-xs font-black text-red-500 flex items-center justify-center gap-1 hover:bg-red-500/10 transition-all">
             <Radio size={12} className="animate-pulse" />
             مباشر
          </Link>
        </div>
      </header>

      <motion.main 
        key={activeTab}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-x-hidden p-4 flex flex-col gap-8"
      >
        {/* Featured Media Hero */}
        {featuredMedia && (
          <motion.section variants={itemVariants}>
            <div 
              onClick={() => featuredMedia.type === 'video' && setSelectedVideo(featuredMedia)}
              className="relative w-full aspect-[16/10] rounded-[40px] overflow-hidden group shadow-2xl cinematic-glow border border-white/5 cursor-pointer"
            >
              <img src={featuredMedia.thumbnailUrl} alt={featuredMedia.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="px-3 py-1 bg-primary/90 backdrop-blur-md rounded-xl text-[9px] font-black text-white ring-1 ring-white/20 uppercase tracking-widest">
                  {featuredMedia.type === 'video' ? 'فيديو مميز' : 'ألبوم مميز'}
                </div>
                {featuredMedia.type === 'video' && featuredMedia.duration && (
                  <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-xl text-[9px] font-black text-white flex items-center gap-1">
                    <Clock size={10} /> {featuredMedia.duration}
                  </div>
                )}
              </div>
              
              {featuredMedia.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/40 group-hover:border-primary/50">
                    <Play size={32} fill="white" className="ml-1" />
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-xl font-black text-white leading-tight mb-3 drop-shadow-2xl group-hover:text-accent transition-colors">
                  {featuredMedia.title}
                </h3>
                <div className="flex items-center gap-4 text-white/60 text-[9px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={10} />
                        {format(new Date(featuredMedia.date), 'dd MMMM yyyy', { locale: ar })}
                    </div>
                    {featuredMedia.views && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full">
                            <Eye size={10} />
                            {featuredMedia.views} VIEWS
                        </div>
                    )}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Media Grid Upgrade */}
        <div className="flex flex-col gap-8">
          {/* Photo Gallery Tiles */}
          {(activeTab === 'all' || activeTab === 'photo') && photos.length > 0 && (
            <motion.section variants={itemVariants} className="space-y-6">
              <div className="flex flex-col px-1">
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none uppercase">أحدث الصور</h2>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Stunning captures</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {photos.filter(p => p.id !== featuredMedia?.id).map((item) => (
                  <motion.div 
                    key={item.id} 
                    whileTap={{ scale: 0.95 }}
                    className="group relative aspect-[4/5] rounded-[32px] overflow-hidden shadow-premium border border-border-light/40 dark:border-border-dark/40 cursor-pointer"
                  >
                    <img src={item.thumbnailUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90"></div>
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center">
                      <ImageIcon size={14} className="text-white" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-[10px] font-black text-white line-clamp-2 leading-tight uppercase tracking-tighter">
                        {item.title}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Videos Feed Upgrade */}
          {(activeTab === 'all' || activeTab === 'video') && videos.length > 0 && (
            <motion.section variants={itemVariants} className="space-y-6">
              <div className="flex flex-col px-1">
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none uppercase">مكتبة الفيديو</h2>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Exclusive Highlights</span>
              </div>
              <div className="flex flex-col gap-6">
                {videos.filter(v => v.id !== featuredMedia?.id).map((item) => (
                  <motion.div 
                    key={item.id} 
                    whileTap={{ scale: 0.98 }} 
                    onClick={() => setSelectedVideo(item)}
                    className="group flex gap-4 bg-white dark:bg-surface-dark rounded-[28px] overflow-hidden border border-border-light/40 dark:border-border-dark/40 shadow-premium hover:shadow-2xl transition-all duration-300 p-2.5 cursor-pointer"
                  >
                    <div className="w-[120px] aspect-video overflow-hidden relative rounded-2xl flex-shrink-0 bg-slate-900">
                      <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-10 h-10 bg-white/30 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform">
                           <Play size={16} fill="white" className="ml-1" />
                         </div>
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-[8px] font-black text-white rounded-lg">
                        {item.duration || '0:00'}
                      </div>
                    </div>
                    <div className="py-2 pl-2 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400">
                              <Eye size={10} />
                              {item.views || '0'} VIEWS
                           </div>
                           <div className="text-[9px] font-bold text-slate-400">
                             {format(new Date(item.date), 'dd MMM', { locale: ar })}
                           </div>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 mt-2">
                        <span>تشغيل الآن</span>
                        <ChevronRight size={10} strokeWidth={3} className="rotate-180" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Empty State Upgrade */}
          {displayMedia.length === 0 && (
             <div className="w-full py-20 flex flex-col items-center justify-center glass-card rounded-[40px] border-dashed border-2 border-slate-200 dark:border-border-dark text-slate-400">
                <Video size={48} className="opacity-20 mb-4" />
                <p className="font-black text-sm">لا يوجد محتوى في هذا القسم</p>
             </div>
          )}
        </div>
      </motion.main>

      {/* Video Player Modal Upgrade */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
          >
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/10">
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-6 right-6 z-50 w-12 h-12 bg-black/40 hover:bg-red-500 backdrop-blur-xl text-white rounded-2xl flex items-center justify-center transition-all border border-white/10"
              >
                <X size={24} />
              </button>

              {isYoutube(selectedVideo.url) || selectedVideo.source === 'embed' ? (
                <iframe 
                  src={getEmbedUrl(selectedVideo.url, selectedVideo.source) || ''} 
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              ) : (
                <video 
                  src={selectedVideo.url} 
                  className="w-full h-full" 
                  controls 
                  autoPlay
                ></video>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                     <span className="px-3 py-1 bg-primary rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-glow">Exclusive Media</span>
                  </div>
                  <h2 className="text-white font-black text-2xl drop-shadow-2xl">{selectedVideo.title}</h2>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

