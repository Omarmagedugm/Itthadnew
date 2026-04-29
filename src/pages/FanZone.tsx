import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { 
  Trophy, 
  MessageCircle, 
  PieChart, 
  Target,
  Users,
  ChevronRight,
  TrendingUp,
  BarChart2,
  Lock,
  Clock,
  Camera,
  Image as ImageIcon,
  X,
  MessageSquare,
  Menu,
  Bell,
  Search,
  MapPin,
  Share2,
  Bookmark,
  Heart,
  MoreVertical,
  ShieldCheck,
  Radio,
  Zap,
  Trash2,
  Edit2,
  Check,
  MessageSquareOff
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType, uploadImage } from '../lib/firebase';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Sidebar from '../components/Sidebar';
import { 
  doc, 
  updateDoc, 
  increment, 
  addDoc, 
  collection, 
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';

export default function FanZone() {
  const { polls, matches, clubs, profile, fanPosts, predictions, users } = useAppStore();
  const [activeTab, setActiveTab] = useState<'all' | 'matchday' | 'polls' | 'chat' | 'predictions'>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<{ matchId: string; home: number; away: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', image: '', location: '', poll: null as { options: string[] } | null });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [postComments, setPostComments] = useState<any[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [tick, setTick] = useState(0);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempLocation, setTempLocation] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddPoll = () => {
    setNewPost(prev => ({
      ...prev,
      poll: prev.poll ? null : { options: ['', ''] }
    }));
  };

  const handleAddLocation = () => {
    setTempLocation(newPost.location || '');
    setShowLocationModal(true);
  };

  useEffect(() => {
    if (activeCommentPost) {
      const q = query(
        collection(db, 'fan_posts', activeCommentPost, 'comments'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        setPostComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => console.error('Error fetching comments:', error));
      return unsub;
    } else {
      setPostComments([]);
    }
  }, [activeCommentPost]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const url = await uploadImage(file, 'fan_posts');
      if (!url) throw new Error('لم يتم استلام رابط الصورة');
      setNewPost(prev => ({ ...prev, image: url }));
      console.log('Image uploaded successfully:', url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`فشل في رفع الصورة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setUploadingImage(false);
      e.target.value = ''; // Reset input to allow same file selection
    }
  };
  const calculateCurrentMinute = (match: any) => {
    if (!match.isTimerRunning || !match.timerStartTime) return Number(match.timerBaseMinute || 0);
    const start = new Date(match.timerStartTime).getTime();
    if (isNaN(start)) return Number(match.timerBaseMinute || 0);
    const elapsed = Math.max(0, Math.floor((new Date().getTime() - start) / 60000));
    return Number(match.timerBaseMinute || 0) + elapsed;
  };

  const [chatMessage, setChatMessage] = useState('');
  const [chatRooms, setChatRooms] = useState<any[]>([]);

  const sortedMatches = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const nextMatch = matches.find(m => m.isMatchDay) || 
                    matches.find(m => m.status === 'live') || 
                    matches.find(m => m.status === 'upcoming') || 
                    sortedMatches[0];

  const matchPredictions = predictions.filter(p => p.matchId === nextMatch?.id);
  const totalPreds = matchPredictions.length;
  const homeWins = matchPredictions.filter(p => Number(p.homeScore) > Number(p.awayScore)).length;
  const draws = matchPredictions.filter(p => Number(p.homeScore) === Number(p.awayScore)).length;
  const awayWins = matchPredictions.filter(p => Number(p.homeScore) < Number(p.awayScore)).length;

  const homePct = totalPreds > 0 ? (homeWins / totalPreds) * 100 : 33.3;
  const drawPct = totalPreds > 0 ? (draws / totalPreds) * 100 : 33.3;
  const awayPct = totalPreds > 0 ? (awayWins / totalPreds) * 100 : 33.4;

  // Load chat messages
  useEffect(() => {
    if (activeTab === 'chat') {
      const q = query(collection(db, 'live_comments'), orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(q, (snapshot) => {
        setChatRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse());
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'live_comments'));
    }
  }, [activeTab]);

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!auth.currentUser) return;
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    
    const userId = auth.currentUser.uid;
    const previousChoice = poll.voterChoices?.[userId];
    
    // If already voted for this option, do nothing
    if (previousChoice === optionIndex) return;

    try {
      const pollRef = doc(db, 'polls', pollId);
      const updates: any = {
        [`votes.${optionIndex}`]: increment(1),
        [`voterChoices.${userId}`]: optionIndex,
        voters: arrayUnion(userId)
      };

      // If changing choice, decrement the old one
      if (previousChoice !== undefined) {
        updates[`votes.${previousChoice}`] = increment(-1);
      }

      await updateDoc(pollRef, updates);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleVotePost = async (postId: string, optionIndex: number) => {
    if (!auth.currentUser) return;
    const post = fanPosts.find(p => p.id === postId);
    if (!post || !post.poll) return;
    
    const userId = auth.currentUser.uid;
    const previousChoice = (post.poll as any).voterChoices?.[userId];
    
    if (previousChoice === optionIndex) return;

    try {
      const postRef = doc(db, 'fan_posts', postId);
      const updates: any = {
        [`poll.votes.${optionIndex}`]: increment(1),
        [`poll.voterChoices.${userId}`]: optionIndex,
        [`poll.voters`]: arrayUnion(userId)
      };

      if (previousChoice !== undefined) {
        updates[`poll.votes.${previousChoice}`] = increment(-1);
      }

      await updateDoc(postRef, updates);
    } catch (error) {
      console.error('Error voting on post poll:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المنشور؟')) return;
    try {
      await deleteDoc(doc(db, 'fan_posts', postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('فشل في حذف المنشور');
    }
  };

  const handleSaveEditPost = async (postId: string) => {
    if (!editingContent.trim()) return;
    try {
      await updateDoc(doc(db, 'fan_posts', postId), {
        content: editingContent
      });
      setEditingPostId(null);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('فشل في تعديل المنشور');
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
    try {
      await deleteDoc(doc(db, 'fan_posts', postId, 'comments', commentId));
      await updateDoc(doc(db, 'fan_posts', postId), {
        commentsCount: increment(-1)
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleSaveEditComment = async (postId: string, commentId: string) => {
    if (!editingCommentText.trim()) return;
    try {
      await updateDoc(doc(db, 'fan_posts', postId, 'comments', commentId), {
        text: editingCommentText.trim(),
        updatedAt: serverTimestamp()
      });
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('فشل في تعديل التعليق');
    }
  };

  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!auth.currentUser) return;
    const comment = postComments.find(c => c.id === commentId);
    if (!comment) return;

    const userId = auth.currentUser.uid;
    const likedBy = comment.likedBy || [];
    const isLiked = likedBy.includes(userId);

    try {
      const commentRef = doc(db, 'fan_posts', postId, 'comments', commentId);
      if (isLiked) {
        await updateDoc(commentRef, {
          likes: increment(-1),
          likedBy: likedBy.filter((id: string) => id !== userId)
        });
      } else {
        await updateDoc(commentRef, {
          likes: increment(1),
          likedBy: arrayUnion(userId)
        });
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!auth.currentUser || !commentText.trim()) return;
    try {
      const postRef = doc(db, 'fan_posts', postId);
      const commentsRef = collection(db, 'fan_posts', postId, 'comments');
      
      await addDoc(commentsRef, {
        userId: auth.currentUser.uid,
        userName: profile.name || 'مشجع إتحادي',
        userAvatar: profile.avatar || '',
        text: commentText.trim(),
        createdAt: serverTimestamp()
      });

      await updateDoc(postRef, {
        commentsCount: increment(1)
      });
      
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteChatMessage = async (msgId: string) => {
    if (!confirm('هل تريد حذف هذه الرسالة؟')) return;
    try {
      await deleteDoc(doc(db, 'live_comments', msgId));
    } catch (error) {
      console.error('Error deleting chat message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!auth.currentUser || !chatMessage.trim()) return;
    try {
      await addDoc(collection(db, 'live_comments'), {
        text: chatMessage,
        userName: profile.name || 'مشجع إتحادي',
        userAvatar: profile.avatar || '',
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setChatMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleShare = async (post: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'منشور مشجع إتحادي',
          text: post.content,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyToClipboard(window.location.href);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('تم نسخ الرابط!');
  };

  const handleBookmark = (postId: string) => {
    alert('تم حفظ المنشور في المفضلة!');
  };

  const handleCreatePost = async () => {
    if (!auth.currentUser || (!newPost.content.trim() && !newPost.image && !newPost.poll)) return;
    
    if (newPost.poll) {
      const validOptions = newPost.poll.options.filter(o => o.trim());
      if (validOptions.length < 2) {
        alert('يرجى إضافة خيارين على الأقل للاستطلاع');
        return;
      }
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'fan_posts'), {
        userId: auth.currentUser.uid,
        userName: profile.name || 'مشجع إتحادي',
        userAvatar: profile.avatar || '',
        content: newPost.content,
        image: newPost.image || null,
        location: newPost.location || null,
        poll: newPost.poll ? {
          options: newPost.poll.options.filter(o => o.trim()),
          votes: Object.fromEntries(newPost.poll.options.filter(o => o.trim()).map((_, i) => [i, 0])),
          voters: []
        } : null,
        likes: 0,
        likedBy: [],
        commentsCount: 0,
        createdAt: serverTimestamp()
      });
      setNewPost({ content: '', image: '', location: '', poll: null });
      alert('تم النشر بنجاح!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('فشل في النشر، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!auth.currentUser) return;
    const post = fanPosts.find(p => p.id === postId);
    if (!post) return;
    
    const userId = auth.currentUser.uid;
    const likedBy = (post as any).likedBy || [];
    
    if (likedBy.includes(userId)) {
      // Unlike
      try {
        const postRef = doc(db, 'fan_posts', postId);
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: likedBy.filter((id: string) => id !== userId)
        });
      } catch (error) {
        console.error('Error unliking post:', error);
      }
      return;
    }

    try {
      const postRef = doc(db, 'fan_posts', postId);
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const activeUserIds = new Set([
     ...chatRooms.map(m => m.userId),
     ...fanPosts.map(p => p.userId)
  ]);
  const activeCount = activeUserIds.size;

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatRooms]);

  const handlePredict = async () => {
    if (!auth.currentUser || !selectedPrediction) return;

    const hasPredicted = predictions.some(p => p.matchId === selectedPrediction.matchId && p.userId === auth.currentUser?.uid);
    if (hasPredicted) {
      alert('لقد قمت بالتوقع لهذه المباراة مسبقاً');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'predictions'), {
        matchId: selectedPrediction.matchId,
        userId: auth.currentUser.uid,
        userName: profile.name || 'مشجع',
        homeScore: selectedPrediction.home,
        awayScore: selectedPrediction.away,
        createdAt: serverTimestamp()
      });
      alert('تم تسجيل توقعك بنجاح!');
      setSelectedPrediction(null);
    } catch (error) {
      console.error('Error predicting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 pb-24 flex flex-col bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-border-light/40 dark:border-border-dark/40 px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl glass-card p-0.5 overflow-hidden ring-1 ring-primary/20">
            <img src={profile.avatar} className="w-full h-full object-cover rounded-2xl" alt="profile" />
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="relative w-10 h-10 flex items-center justify-center glass-card rounded-2xl text-slate-500 dark:text-slate-400 hover:text-primary transition-all shadow-premium"
          >
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark shadow-glow"></span>
          </motion.button>
        </div>
        
        <div className="flex flex-col items-center">
           <h1 className="text-xl font-black tracking-tight text-primary-dark dark:text-white uppercase leading-none">منطقة الجماهير</h1>
           <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Fan Zone Hub</span>
        </div>
        
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMenuOpen(true)} 
          className="w-10 h-10 flex items-center justify-center glass-card rounded-2xl text-slate-500 dark:text-slate-400 hover:text-primary transition-all shadow-premium"
        >
          <Menu size={24} />
        </motion.button>
      </header>

      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} profile={profile} />

      <main className="p-4 space-y-8">
        {/* Post Creation Box Upgrade */}
        {auth.currentUser && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[40px] p-6 shadow-premium border border-primary/10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-all"></div>
            
            <div className="flex gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl overflow-hidden glass-card ring-1 ring-primary/20 shrink-0">
                <img src={profile.avatar} className="w-full h-full object-cover" alt="user" />
              </div>
              <div className="flex-1">
                <textarea 
                  placeholder="بماذا تفكر يا مشجع الاتحاد؟" 
                  className="w-full bg-transparent text-base font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none min-h-[80px] resize-none"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                />
                
                {newPost.poll && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 space-y-3 bg-slate-50/50 dark:bg-surface-dark/50 p-4 rounded-[28px] border border-border-light dark:border-border-dark"
                  >
                    <div className="flex justify-between items-center mb-1 px-1">
                       <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Poll Options</span>
                       <button onClick={() => setNewPost(prev => ({ ...prev, poll: null }))} className="text-red-400 hover:text-red-500 transition-colors"><X size={14}/></button>
                    </div>
                    {newPost.poll.options.map((opt, idx) => (
                      <input 
                        key={idx}
                        type="text"
                        placeholder={`Option ${idx + 1}...`}
                        className="w-full bg-white dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:border-primary/50 outline-none transition-all"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(newPost.poll?.options || [])];
                          newOpts[idx] = e.target.value;
                          setNewPost(prev => ({ ...prev, poll: { options: newOpts } }));
                        }}
                      />
                    ))}
                    {newPost.poll.options.length < 4 && (
                      <button 
                        onClick={() => setNewPost(prev => ({ ...prev, poll: { options: [...(prev.poll?.options || []), ''] } }))}
                        className="w-full py-2 border-2 border-dashed border-border-light dark:border-border-dark rounded-xl text-[10px] font-black text-primary hover:bg-primary/5 transition-all text-center"
                      >
                        + Add Option
                      </button>
                    )}
                  </motion.div>
                )}

                {newPost.location && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 flex items-center justify-between bg-primary/5 dark:bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 w-fit"
                  >
                    <span className="text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-tighter">
                      <MapPin size={12} /> {newPost.location}
                    </span>
                    <button onClick={() => setNewPost(prev => ({ ...prev, location: '' }))} className="mr-2 text-primary/50 hover:text-primary"><X size={12}/></button>
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-light/40 dark:border-border-dark/40 relative z-10">
              <div className="flex items-center gap-4">
                <label className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-primary/10 text-slate-400 hover:text-primary transition-all cursor-pointer">
                  <ImageIcon size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
                <button onClick={handleAddPoll} className={`flex h-10 w-10 items-center justify-center rounded-xl hover:bg-primary/10 transition-all ${newPost.poll ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-primary'}`}>
                  <BarChart2 size={20} />
                </button>
                <button onClick={handleAddLocation} className={`flex h-10 w-10 items-center justify-center rounded-xl hover:bg-primary/10 transition-all ${newPost.location ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-primary'}`}>
                  <MapPin size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {newPost.image && (
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden glass-card ring-1 ring-primary/20 group">
                    <img src={newPost.image} className="w-full h-full object-cover" alt="preview" />
                    <button 
                      onClick={() => setNewPost({ ...newPost, image: '' })}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreatePost}
                  disabled={isSubmitting || (!newPost.content.trim() && !newPost.image && !newPost.poll) || uploadingImage}
                  className="bg-primary text-white px-8 h-10 rounded-xl text-[11px] font-black shadow-premium shadow-primary/20 disabled:opacity-50 transition-all flex items-center gap-2 uppercase tracking-widest"
                >
                  {isSubmitting ? 'جاري...' : 'نشر'}
                  <ChevronRight size={14} className="rotate-180" strokeWidth={3} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Improved Tabs Navigation */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 snap-x">
          {[
            { id: 'all', label: 'الساحة', icon: Users },
            { id: 'chat', label: 'الدردشة', icon: MessageCircle },
            { id: 'predictions', label: 'توقعات', icon: Target },
            { id: 'matchday', label: 'المباراة', icon: Trophy },
            { id: 'polls', label: 'استطلاع', icon: BarChart2 },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-6 py-2.5 rounded-2xl text-[11px] font-black transition-all duration-300 snap-center border flex items-center gap-2 uppercase tracking-tighter ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-premium shadow-primary/30 border-primary' 
                  : 'bg-white dark:bg-surface-dark text-slate-500 dark:text-slate-400 border-border-light dark:border-border-dark hover:border-primary/50'
              }`}
            >
              <tab.icon size={14} strokeWidth={3} />
              {tab.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'all' && (
            <motion.div
              key="all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Featured Official Poll Upgrade */}
              {polls.filter(p => p.active).slice(0, 1).map((poll) => {
                const totalVotes = Object.values(poll.votes || {}).reduce((a, b) => a + Number(b), 0);
                return (
                  <motion.div 
                    key={poll.id} 
                    layout
                    className="stadium-gradient rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden cinematic-glow border border-white/5"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-white/10 backdrop-blur-md text-[9px] font-black rounded-xl uppercase tracking-widest ring-1 ring-white/20">
                          Official Poll
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-black text-white/50">
                           <Clock size={10} /> {format(new Date(), 'HH:mm')}
                        </div>
                      </div>
                      <button className="text-white/40 hover:text-white transition-colors">
                        <MoreVertical size={20} />
                      </button>
                    </div>

                    <h3 className="text-2xl font-black mb-8 leading-[1.3] relative z-10 drop-shadow-lg">{poll.question}</h3>
                    
                    <div className="space-y-3 mb-8 relative z-10">
                      {poll.options.map((opt, idx) => {
                        const votes = poll.votes?.[idx] || 0;
                        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                        const hasVoted = poll.voters?.includes(auth.currentUser?.uid || '') || poll.voterChoices?.[auth.currentUser?.uid || ''] !== undefined;
                        const userChoice = poll.voterChoices?.[auth.currentUser?.uid || ''];
                        const isSelected = userChoice === idx;

                        return (
                          <motion.button 
                            key={idx}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleVote(poll.id, idx)}
                            className={`w-full relative h-[60px] rounded-2xl overflow-hidden transition-all flex items-center justify-between px-6 font-black text-xs group ${
                              isSelected ? 'ring-2 ring-accent' : 'hover:ring-2 hover:ring-accent/50'
                            } bg-white/5 border border-white/10 shadow-premium`}
                          >
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1.5, ease: 'circOut' }}
                              className="absolute inset-y-0 right-0 bg-primary/30" 
                            />
                            <span className="relative z-10 flex items-center gap-3">
                               <span className="text-[10px] opacity-40 font-bold tabular-nums">0{idx + 1}</span>
                               <span className="group-hover:text-accent transition-colors">{opt}</span>
                            </span>
                            <span className="relative z-10 text-[10px] font-black opacity-60 tabular-nums">%{percentage}</span>
                          </motion.button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-black text-white/50 border-t border-white/5 pt-6 bg-transparent relative z-10 uppercase tracking-widest">
                      <span>{totalVotes.toLocaleString()} VOTES</span>
                      <span className="opacity-20 text-xs">/</span>
                      <span className="flex items-center gap-1 uppercase">LIVE FEED <Radio size={10} className="text-red-500 animate-pulse" /></span>
                    </div>
                  </motion.div>
                );
              })}

              {/* Feed Posts Premium Upgrade */}
              <div className="flex flex-col gap-8">
              {fanPosts.map((post) => (
                <motion.div 
                  key={post.id} 
                  layout
                  className="glass-card rounded-[40px] p-6 shadow-premium border border-border-light/40 dark:border-border-dark/40 overflow-hidden relative group"
                >
                  <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden glass-card ring-1 ring-primary/10 p-0.5">
                        <img 
                          src={post.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`} 
                          className="w-full h-full object-cover rounded-2xl bg-slate-100" 
                          alt={post.userName}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-[14px] font-black text-slate-800 dark:text-white uppercase tracking-tight">{post.userName}</h4>
                          <div className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded-lg border border-primary/10 uppercase tracking-tighter">Active Fan</div>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                           {format(new Date(post.date || Date.now()), 'HH:mm', { locale: ar })}
                           {post.location && (
                             <span className="flex items-center gap-1 text-primary">
                               <MapPin size={10} /> {post.location}
                             </span>
                           )}
                        </div>
                      </div>
                    </div>
                    {(post.userId === auth.currentUser?.uid || profile.role === 'admin') && (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditingContent(post.content);
                          }}
                          className="h-8 w-8 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center text-blue-500 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="h-8 w-8 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                    <button className="h-8 w-8 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-dark flex items-center justify-center text-slate-400 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="mb-6 relative z-10">
                    {editingPostId === post.id ? (
                      <div className="space-y-3">
                        <textarea 
                          className="w-full bg-slate-50 dark:bg-surface-dark border border-primary/20 rounded-2xl p-4 text-[14px] font-bold text-slate-800 dark:text-white focus:outline-none min-h-[100px]"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSaveEditPost(post.id)}
                            className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingPostId(null)}
                            className="bg-slate-200 dark:bg-slate-800 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[14px] text-slate-800 dark:text-slate-200 font-bold leading-relaxed mb-4">
                        {post.content}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                       {['الاتحاد', 'سكندري', 'العميد'].map(tag => (
                         <span key={tag} className="text-[10px] font-black text-primary px-2.5 py-1 bg-primary/5 rounded-lg flex items-center gap-1 transition-all hover:bg-primary/10 cursor-pointer">
                           #{tag}
                         </span>
                       ))}
                    </div>

                    {post.poll && (
                      <div className="mt-6 space-y-3">
                        {post.poll.options.map((option, idx) => {
                          const votesMap = post.poll?.votes || {};
                          const votes = Number(votesMap[idx] || 0);
                          const totalVotes = Object.values(votesMap).reduce((a, b) => a + Number(b), 0);
                          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                          const hasVoted = post.poll?.voters?.includes(auth.currentUser?.uid || '') || post.poll?.voterChoices?.[auth.currentUser?.uid || ''] !== undefined;
                          const userChoice = post.poll?.voterChoices?.[auth.currentUser?.uid || ''];
                          const isSelected = userChoice === idx;
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => handleVotePost(post.id, idx)}
                              className={`w-full relative h-[52px] rounded-2xl overflow-hidden glass-card border flex items-center justify-between px-5 group transition-all ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border-light dark:border-border-dark hover:border-primary/40 active:scale-95'}`}
                            >
                              <div 
                                className={`absolute inset-y-0 right-0 ${hasVoted ? 'bg-primary/20' : 'bg-primary/10'} transition-all duration-700`} 
                                style={{ width: `${percentage}%` }}
                              />
                              <span className="relative z-10 text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tighter">{option}</span>
                              <span className="relative z-10 text-[10px] font-black text-slate-400 tabular-nums">%{percentage}</span>
                            </button>
                          );
                        })}
                        <div className="flex items-center justify-between px-1 mt-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest tabular-nums">
                            {Object.values(post.poll?.votes || {}).reduce((a, b) => a + Number(b), 0)} TOTAL VOTES
                           </span>
                           {post.poll?.voters?.includes(auth.currentUser?.uid || '') && (
                             <span className="text-[9px] font-black text-primary flex items-center gap-1 uppercase tracking-widest"><ShieldCheck size={12}/> Verified Vote</span>
                           )}
                        </div>
                      </div>
                    )}
                  </div>

                  {post.image && (
                    <div className="relative w-full aspect-[16/10] rounded-[36px] overflow-hidden mb-6 border border-border-light dark:border-border-dark shadow-premium group/img">
                      <img src={post.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110" alt="post attachment" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-4 items-center border-t border-border-light/40 dark:border-border-dark/40 pt-6 relative z-10">
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center justify-center gap-2 h-10 rounded-2xl glass-card transition-all ${post.likedBy?.includes(auth.currentUser?.uid) ? 'bg-red-500/10 text-red-500' : 'text-slate-500'}`}
                      >
                        <Heart size={18} fill={post.likedBy?.includes(auth.currentUser?.uid) ? 'currentColor' : 'none'} className="transition-transform group-active:scale-125" />
                        <span className="text-[11px] font-black tabular-nums">{post.likes || 0}</span>
                      </motion.button>
                      
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                        className={`flex items-center justify-center gap-2 h-10 rounded-2xl glass-card transition-all ${activeCommentPost === post.id ? 'bg-primary/10 text-primary' : 'text-slate-500'}`}
                      >
                        <MessageSquare size={18} />
                        <span className="text-[11px] font-black tabular-nums">{post.commentsCount || 0}</span>
                      </motion.button>

                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleShare(post)}
                        className="flex items-center justify-center h-10 rounded-2xl glass-card text-slate-500 hover:text-primary transition-all"
                      >
                        <Share2 size={18} />
                      </motion.button>

                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleBookmark(post.id)}
                        className="flex items-center justify-center h-10 rounded-2xl glass-card text-slate-500 hover:text-primary transition-all"
                      >
                        <Bookmark size={18} />
                      </motion.button>
                  </div>

                  {activeCommentPost === post.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-6 pt-6 border-t border-border-light/40 dark:border-border-dark/40"
                    >
                      <div className="flex gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl overflow-hidden glass-card ring-1 ring-primary/20 shrink-0">
                          <img src={profile.avatar} className="w-full h-full object-cover" alt="me" />
                        </div>
                        <div className="flex-1 flex gap-2 relative">
                          <input 
                            type="text" 
                            placeholder="أكتب تعليقك..." 
                            className="w-full bg-slate-50 dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl px-5 h-11 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          />
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentText.trim()}
                            className="bg-primary text-white h-11 px-6 text-[10px] font-black rounded-2xl disabled:opacity-50 shadow-premium shadow-primary/20 uppercase tracking-widest"
                          >
                            Send
                          </motion.button>
                        </div>
                      </div>

                      <div className="space-y-4 max-h-80 overflow-y-auto no-scrollbar pb-2">
                        {postComments.map((comment) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={comment.id} 
                            className="flex gap-4 group/comment"
                          >
                            <img src={comment.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`} className="w-9 h-9 rounded-[14px] bg-slate-100 shrink-0 border border-border-light dark:border-border-dark shadow-sm" alt="avatar" />
                            <div className="flex-1 bg-slate-50 dark:bg-surface-dark p-4 rounded-[24px] border border-border-light dark:border-border-dark shadow-sm group-hover/comment:border-primary/20 transition-colors">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="text-[11px] font-black text-primary uppercase tracking-tighter">{comment.userName}</h5>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleLikeComment(post.id, comment.id)}
                                    className={`flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-lg transition-all ${comment.likedBy?.includes(auth.currentUser?.uid) ? 'bg-red-500/10 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                                  >
                                    <Heart size={10} fill={comment.likedBy?.includes(auth.currentUser?.uid) ? 'currentColor' : 'none'} />
                                    {comment.likes || 0}
                                  </button>
                                  {(comment.userId === auth.currentUser?.uid || profile.role === 'admin') && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => {
                                          setEditingCommentId(comment.id);
                                          setEditingCommentText(comment.text);
                                        }}
                                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-500 rounded-md"
                                      >
                                        <Edit2 size={10} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteComment(post.id, comment.id)}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded-md"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  )}
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tabular-nums">
                                    {comment.createdAt ? format(new Date(comment.createdAt.seconds * 1000), 'HH:mm', { locale: ar }) : 'الآن'}
                                  </span>
                                </div>
                              </div>
                              {editingCommentId === comment.id ? (
                                <div className="space-y-2">
                                  <input 
                                    className="w-full bg-white dark:bg-card-dark border border-primary/20 rounded-xl px-3 py-1.5 text-[12px] font-bold text-slate-800 dark:text-white focus:outline-none"
                                    value={editingCommentText}
                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEditComment(post.id, comment.id)}
                                  />
                                  <div className="flex gap-1">
                                    <button onClick={() => handleSaveEditComment(post.id, comment.id)} className="text-[8px] font-black uppercase text-primary px-2 py-1 bg-primary/10 rounded-md">Save</button>
                                    <button onClick={() => setEditingCommentId(null)} className="text-[8px] font-black uppercase text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{comment.text}</p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                        {postComments.length === 0 && (
                          <div className="py-8 text-center opacity-30">
                            <MessageSquareOff size={32} className="mb-2" />
                            <p className="text-[10px] font-black uppercase">No comments yet</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col h-[65vh] glass-card rounded-[40px] border border-primary/20 overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 border-b border-border-light/40 dark:border-border-dark/40 flex items-center justify-between bg-white/5 dark:bg-surface-dark/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-accent rounded-full shadow-glow animate-pulse" />
                  <div className="flex flex-col">
                    <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase leading-none">الدردشة الفورية</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Fan Room</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-background-dark rounded-full shadow-inner ring-1 ring-border-light dark:ring-border-dark">
                  <Users size={12} className="text-primary" />
                  <span className="text-[10px] font-black tabular-nums text-slate-600 dark:text-slate-300 uppercase">
                    {Math.max(activeCount, users.length > 0 ? Math.floor(users.length / 2) : 12)} Online
                  </span>
                </div>
              </div>

              <div 
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar stadium-gradient/10"
              >
                {chatRooms.length > 0 ? chatRooms.map((msg, i) => {
                  const isOwn = msg.userId === auth.currentUser?.uid;
                  return (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <img src={msg.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`} className="w-10 h-10 rounded-[14px] bg-slate-100 shadow-sm border border-border-light dark:border-border-dark shrink-0" alt="avatar" />
                      <div className={`max-w-[80%] ${isOwn ? 'items-end text-left' : 'items-start text-right'} flex flex-col gap-1.5`}>
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{msg.userName}</span>
                          {(isOwn || profile.role === 'admin') && (
                            <button 
                              onClick={() => handleDeleteChatMessage(msg.id)}
                              className="text-red-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                        <div className={`px-5 py-3 rounded-2xl text-[12px] font-bold leading-relaxed shadow-premium ${isOwn ? 'bg-primary text-white rounded-tl-[4px]' : 'glass-card text-slate-800 dark:text-white rounded-tr-[4px]'}`}>
                          {msg.text}
                        </div>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-20 gap-4">
                    <MessageCircle size={64} strokeWidth={1} />
                    <p className="text-sm font-black uppercase tracking-widest">No messages yet. Shine first!</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white/40 dark:bg-background-dark/40 backdrop-blur-xl border-t border-border-light dark:border-border-dark">
                <div className="flex gap-2 bg-white dark:bg-surface-dark rounded-[24px] p-2 border border-border-light dark:border-border-dark focus-within:border-primary/50 transition-all shadow-premium">
                  <input 
                    type="text" 
                    placeholder="أرسل رسالة..." 
                    className="flex-1 bg-transparent px-5 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim()}
                    className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white disabled:opacity-50 transition-all shadow-premium shadow-primary/30"
                  >
                    <ChevronRight className="rotate-180" size={20} strokeWidth={3} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'predictions' && (
            <motion.div
              key="predictions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              <div className="flex flex-col px-1">
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none uppercase">توقعات الجمهور</h2>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Fan Predictions Wall</span>
              </div>

              {/* Prediction Input Form (if applicable) */}
              {nextMatch && matches.some(m => m.id === nextMatch.id && m.status === 'upcoming') && !predictions.some(p => p.matchId === nextMatch.id && p.userId === auth.currentUser?.uid) && (
                <div className="glass-card rounded-[40px] p-8 border border-primary/20 shadow-premium relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
                  <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="flex items-center justify-center gap-8 w-full">
                       <div className="flex flex-col items-center gap-2">
                         <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                           <img src={nextMatch.homeLogo} className="w-8 h-8 object-contain" alt="home" />
                         </div>
                         <span className="text-[10px] font-black uppercase text-center">{nextMatch.homeTeam}</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <input 
                           type="number"
                           className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-dark border-2 border-primary/10 transition-all focus:border-primary text-center text-xl font-black outline-none"
                           placeholder="0"
                           value={selectedPrediction?.home ?? ''}
                           onChange={(e) => setSelectedPrediction({ matchId: nextMatch.id, home: parseInt(e.target.value) || 0, away: selectedPrediction?.away || 0 })}
                         />
                         <span className="text-slate-300 font-black">VS</span>
                         <input 
                           type="number"
                           className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-dark border-2 border-primary/10 transition-all focus:border-primary text-center text-xl font-black outline-none"
                           placeholder="0"
                           value={selectedPrediction?.away ?? ''}
                           onChange={(e) => setSelectedPrediction({ matchId: nextMatch.id, home: selectedPrediction?.home || 0, away: parseInt(e.target.value) || 0 })}
                         />
                       </div>
                       <div className="flex flex-col items-center gap-2">
                         <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                           <img src={nextMatch.awayLogo} className="w-8 h-8 object-contain" alt="away" />
                         </div>
                         <span className="text-[10px] font-black uppercase text-center">{nextMatch.awayTeam}</span>
                       </div>
                    </div>
                    <button 
                      onClick={handlePredict}
                      disabled={isSubmitting}
                      className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-premium flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'جاري الحفظ...' : 'تثبيت التوقع'}
                      <Target size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Predictions List */}
              <div className="flex flex-col gap-4">
                 {predictions.length > 0 ? (
                   [...predictions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((pred) => {
                     const match = matches.find(m => m.id === pred.matchId);
                     const isFinished = match?.status === 'finished';
                     const isCorrect = isFinished && Number(match.homeScore) === Number(pred.homeScore) && Number(match.awayScore) === Number(pred.awayScore);
                     
                     return (
                       <div key={pred.id} className={`p-5 rounded-[32px] glass-card border transition-all ${isCorrect ? 'border-green-500/50 bg-green-50/20 dark:bg-green-900/10' : 'border-border-light dark:border-border-dark'}`}>
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex flex-col">
                             <div className="flex items-center gap-2">
                               <span className={`text-xs font-black uppercase ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>{pred.userName}</span>
                               {isFinished && (
                                  <div className={`text-[8px] font-black px-2 py-0.5 rounded flex items-center gap-1 ${isCorrect ? 'bg-green-500 text-white shadow-glow' : 'bg-red-100 text-red-600'}`}>
                                    {isCorrect ? (
                                      <>
                                        <Trophy size={10} />
                                        توقع صحيح
                                      </>
                                    ) : (
                                      <>
                                        <X size={10} />
                                        توقع خاطئ
                                      </>
                                    )}
                                  </div>
                               )}
                             </div>
                             <span className="text-[9px] font-bold text-slate-400 uppercase">
                               {pred.createdAt && (typeof pred.createdAt === 'string' ? format(new Date(pred.createdAt), 'dd MMM HH:mm', { locale: ar }) : 'الآن')}
                             </span>
                           </div>
                           {match && (
                             <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-surface-dark rounded-xl text-[9px] font-black text-slate-500">
                               <img src={match.homeLogo} className="w-4 h-4 object-contain" alt="" />
                               <span>VS</span>
                               <img src={match.awayLogo} className="w-4 h-4 object-contain" alt="" />
                             </div>
                           )}
                         </div>

                         <div className="bg-slate-50 dark:bg-surface-dark/50 p-4 rounded-[24px] flex items-center justify-center gap-6 shadow-inner ring-1 ring-black/5">
                            <div className="flex flex-col items-center gap-1">
                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{match?.homeTeam || 'HOME'}</span>
                               <span className={`text-2xl font-black tabular-nums ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>{pred.homeScore}</span>
                            </div>
                            <div className="text-lg font-black text-slate-200">-</div>
                            <div className="flex flex-col items-center gap-1">
                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{match?.awayTeam || 'AWAY'}</span>
                               <span className={`text-2xl font-black tabular-nums ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>{pred.awayScore}</span>
                            </div>
                         </div>
                       </div>
                     );
                   })
                 ) : (
                   <div className="py-20 text-center glass-card rounded-[40px] border-dashed border-2 border-slate-200 dark:border-border-dark text-slate-400">
                      <Target size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="font-black text-sm">لا توجد توقعات حالياً</p>
                   </div>
                 )}
              </div>
            </motion.div>
          )}

          {activeTab === 'polls' && (
            <motion.div
              key="polls"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-accent/10 rounded-[28px] flex items-center justify-center text-accent shadow-premium mb-4">
                  <PieChart size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase leading-none">الاستطلاعات الجماهيرية</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Voice of the fans</span>
              </div>

              {polls.length > 0 ? polls.map((poll) => {
                const totalVotes = Object.values(poll.votes || {}).reduce((a, b) => a + Number(b), 0);
                const hasVoted = poll.voters?.includes(auth.currentUser?.uid || '') || poll.voterChoices?.[auth.currentUser?.uid || ''] !== undefined;
                const userChoice = poll.voterChoices?.[auth.currentUser?.uid || ''];
                return (
                  <motion.div 
                    key={poll.id} 
                    layout
                    className="glass-card rounded-[32px] p-6 border border-primary/10 shadow-premium"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Users size={18} />
                      </div>
                      <h3 className="font-black text-sm text-slate-800 dark:text-white leading-tight">{poll.question}</h3>
                    </div>

                    <div className="space-y-3">
                      {poll.options.map((option, idx) => {
                        const votes = poll.votes?.[idx] || 0;
                        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                        const isSelected = userChoice === idx;

                        return (
                          <button
                            key={idx}
                            onClick={() => handleVote(poll.id, idx)}
                            className={`w-full text-right relative group overflow-hidden rounded-2xl border bg-white dark:bg-background-dark p-4 transition-all ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border-light dark:border-border-dark active:scale-[0.98] hover:border-primary/30 shadow-sm'}`}
                          >
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="absolute inset-y-0 right-0 bg-primary/10" 
                            />
                            <div className="relative flex justify-between items-center z-10">
                              <span className={`font-bold text-xs ${hasVoted && votes === Math.max(...Object.values(poll.votes || {})) ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
                                {option}
                              </span>
                              {hasVoted && (
                                <span className="text-[10px] font-black text-primary tabular-nums">%{percentage}</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-border-light/40 dark:border-border-dark/40 flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <span>{totalVotes} Voice Recorded</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> Active</span>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="p-16 glass-card rounded-[40px] border border-dashed border-border-light dark:border-border-dark text-center opacity-40">
                  <PieChart size={64} strokeWidth={1} className="mx-auto mb-4" />
                  <p className="font-black">لا توجد استطلاعات حالياً</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'matchday' && (
            <motion.div
              key="matchday"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="glass-card rounded-[40px] p-8 border border-primary/20 shadow-premium">
                <div className="flex flex-col items-center mb-8">
                  <div className="flex items-center gap-2 px-3 py-1 bg-accent/20 text-accent rounded-full mb-4">
                    <Zap size={14} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Match Day Live</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase leading-none">مباريات اليوم</h2>
                </div>

                {nextMatch ? (
                  <div className="stadium-gradient rounded-[32px] p-6 text-white mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full"></div>
                    <div className="flex items-center justify-between gap-4 relative z-10">
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md border border-white/20">
                          <img src={nextMatch.homeLogo} className="w-10 h-10 object-contain" alt="home" />
                        </div>
                        <span className="text-xs font-black text-center">{nextMatch.homeTeam}</span>
                      </div>

                      <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="text-3xl font-black tracking-tighter tabular-nums drop-shadow-lg">
                          {nextMatch.status === 'upcoming' ? '-- : --' : `${nextMatch.homeScore} - ${nextMatch.awayScore}`}
                        </div>
                        {nextMatch.status === 'live' && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-red-500 rounded-full shadow-glow">
                             <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                             <span className="text-[10px] font-black tabular-nums">LIVE {calculateCurrentMinute(nextMatch)}'</span>
                          </div>
                        )}
                        {nextMatch.status === 'upcoming' && (
                           <span className="text-[8px] font-black tracking-widest opacity-60 uppercase">{format(new Date(nextMatch.date), 'dd MMM HH:mm', { locale: ar })}</span>
                        )}
                      </div>

                      <div className="flex flex-col items-center flex-1">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md border border-white/20">
                          <img src={nextMatch.awayLogo} className="w-10 h-10 object-contain" alt="away" />
                        </div>
                        <span className="text-xs font-black text-center">{nextMatch.awayTeam}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 border-2 border-dashed border-border-light dark:border-border-dark rounded-[32px] text-center opacity-40 mb-8">
                     <PieChart size={48} className="mx-auto mb-4" />
                     <p className="font-black text-sm">لا توجد مباريات نشطة اليوم</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => setActiveTab('chat')} className="p-6 glass-card rounded-[32px] border border-primary/20 flex flex-col items-center gap-3 hover:bg-primary/5 transition-all shadow-premium group">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                        <MessageCircle size={28} />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white tracking-widest block">Live Chat</span>
                        <span className="text-[8px] font-bold text-slate-400 mt-1 block">دردش مع الجمهور</span>
                      </div>
                   </button>
                   <button onClick={() => setActiveTab('all')} className="p-6 glass-card rounded-[32px] border border-accent/20 flex flex-col items-center gap-3 hover:bg-accent/5 transition-all shadow-premium group">
                      <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform shadow-inner">
                        <Camera size={28} />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white tracking-widest block">Share Moments</span>
                        <span className="text-[8px] font-bold text-slate-400 mt-1 block">شارك صورك</span>
                      </div>
                   </button>
                </div>
              </div>

              {nextMatch && (
                <div className="glass-card rounded-[40px] p-8 border border-border-light/40 dark:border-border-dark/40 shadow-premium">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-600">
                        <Target size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase leading-none">توقعات الجمهور</h3>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Crowd Sentiment</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-1 h-2 rounded-full bg-slate-100 dark:bg-surface-dark overflow-hidden mb-4">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${homePct}%` }}
                        className="h-full bg-primary" 
                      />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${drawPct}%` }}
                        className="h-full bg-slate-400" 
                      />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${awayPct}%` }}
                        className="h-full bg-accent" 
                      />
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                      <div className="flex items-center gap-1.5 text-primary">
                        <div className="w-2 h-2 bg-primary rounded-full" /> فوز {nextMatch.homeTeam} ({Math.round(homePct)}%)
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <div className="w-2 h-2 bg-slate-400 rounded-full" /> تعادل ({Math.round(drawPct)}%)
                      </div>
                      <div className="flex items-center gap-1.5 text-accent">
                        <div className="w-2 h-2 bg-accent rounded-full" /> فوز {nextMatch.awayTeam} ({Math.round(awayPct)}%)
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLocationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl overflow-hidden shadow-2xl border border-primary/20"
            >
              <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <MapPin size={18} className="text-primary" />
                  إضافة موقع
                </h3>
                <button onClick={() => setShowLocationModal(false)} className="text-slate-400 hover:text-red-500">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  autoFocus
                  placeholder="مثال: استاد الإسكندرية، مقر الشاطبي..."
                  className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-xl p-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-primary/50 transition-colors"
                  value={tempLocation}
                  onChange={e => setTempLocation(e.target.value)}
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setNewPost(prev => ({ ...prev, location: tempLocation.trim() }));
                      setShowLocationModal(false);
                    }}
                    className="flex-1 bg-primary text-white rounded-xl py-3 font-black text-xs hover:bg-primary-dark transition-colors"
                  >
                    تأكيد
                  </button>
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl py-3 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
