import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  image: string;
  date: string;
  type: 'rss' | 'manual';
  category?: string;
  author?: string;
  rssUrl?: string;
  rssSource?: string;
  status?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'video' | 'photo';
  source?: 'upload' | 'youtube';
  url: string;
  thumbnailUrl: string;
  date: string;
  duration?: string;
  views?: string;
}

export interface MatchItem {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: string;
  awayScore: string;
  date: string;
  status: 'live' | 'upcoming' | 'finished';
  competition: string;
  stadium?: string;
  isMatchDay?: boolean;
  isTimerRunning?: boolean;
  timerStartTime?: string | null;
  timerBaseMinute?: number;
}

export interface ClubItem {
  id: string;
  name: string;
  logo: string;
}

export interface PollItem {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  voters?: string[];
  voterChoices?: Record<string, number>;
  active: boolean;
  createdAt: string;
}

export interface PredictionItem {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  homeScore: number;
  awayScore: number;
  createdAt: string;
}

export interface FanPostItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  image?: string;
  location?: string;
  date?: string;
  poll?: {
    options: string[];
    votes: Record<number, number>;
    voters?: string[];
    voterChoices?: Record<string, number>;
  };
  likes: number;
  likedBy?: string[];
  commentsCount?: number;
  createdAt: string;
  isPinned?: boolean;
  isLocked?: boolean;
  comments?: number;
}

export interface LiveStream {
  isActive: boolean;
  url: string;
  title: string;
  viewers: number;
}

export interface ClubTitle {
  id: string;
  name: string;
  count: number;
  icon: string;
  category: 'football' | 'basketball';
}

export interface ClubStat {
  id: string;
  label: string;
  value: number;
  icon: string;
}

export interface HistoryEvent {
  id: string;
  year: string;
  title: string;
  desc: string;
}

export interface StadiumItem {
  id: string;
  name: string;
  type: string;
  desc: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'tshirt' | 'mug' | 'scarf' | 'bracelet' | 'other';
  imageUrl: string;
  stock: number;
}

export interface StoreOrder {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface UserProfile {
  uid?: string;
  name: string;
  location: string;
  joinDate: string;
  avatar: string;
  isVerified?: boolean;
  role?: 'user' | 'admin' | 'superadmin' | 'moderator' | 'editor' | 'verified';
  email?: string;
  stats: {
    predictions: number;
    comments: number;
    favorites: number;
  };
}

interface AppState {
  news: NewsItem[];
  media: MediaItem[];
  matches: MatchItem[];
  clubs: ClubItem[];
  polls: PollItem[];
  predictions: PredictionItem[];
  fanPosts: FanPostItem[];
  users: UserProfile[];
  appSettings: {
    appName: string;
    appLogo: string;
  };
  liveStream: LiveStream;
  theme: 'dark' | 'light';
  profile: UserProfile;
  clubTitles: ClubTitle[];
  clubStats: ClubStat[];
  historyEvents: HistoryEvent[];
  stadiums: StadiumItem[];
  newsCategories: string[];
  products: Product[];
  orders: StoreOrder[];
  setNews: (news: NewsItem[]) => void;
  addNews: (item: NewsItem) => void;
  deleteNews: (id: string) => void;
  updateNews: (id: string, item: Partial<NewsItem>) => void;
  setMedia: (media: MediaItem[]) => void;
  addMedia: (item: MediaItem) => void;
  deleteMedia: (id: string) => void;
  updateMedia: (id: string, item: Partial<MediaItem>) => void;
  setMatches: (matches: MatchItem[]) => void;
  addMatch: (item: MatchItem) => void;
  deleteMatch: (id: string) => void;
  updateMatch: (id: string, item: Partial<MatchItem>) => void;
  setClubs: (clubs: ClubItem[]) => void;
  setPolls: (polls: PollItem[]) => void;
  setPredictions: (predictions: PredictionItem[]) => void;
  setFanPosts: (posts: FanPostItem[]) => void;
  setUsers: (users: UserProfile[]) => void;
  updateUser: (uid: string, item: Partial<UserProfile>) => void;
  deleteUser: (uid: string) => void;
  setSettings: (settings: { appName: string; appLogo: string }) => void;
  updateLiveStream: (stream: Partial<LiveStream>) => void;
  toggleTheme: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setClubTitles: (titles: ClubTitle[]) => void;
  setClubStats: (stats: ClubStat[]) => void;
  setHistoryEvents: (events: HistoryEvent[]) => void;
  setStadiums: (stadiums: StadiumItem[]) => void;
  setNewsCategories: (categories: string[]) => void;
  setProducts: (products: Product[]) => void;
  setOrders: (orders: StoreOrder[]) => void;
}

const defaultNews: NewsItem[] = [
  {
    id: uuidv4(),
    title: 'الإسكندرية تستعد لكرنفال رياضي كبير بمناسبة مئوية النادي',
    content: 'بدأت اللجنة المنظمة لاحتفالات مئوية نادي الاتحاد السكندري في وضع اللمسات الأخيرة للبرنامج الحافل الذي يتضمن مباريات ودية عالمية وعروض فنية وجماهيرية تليق بتاريخ سيد البلد.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop',
    date: new Date(Date.now() - 1 * 3600000).toISOString(),
    type: 'manual',
  },
  {
    id: uuidv4(),
    title: 'الاتحاد يستعد لمواجهة الزمالك بتدريبات مكثفة',
    content: 'أجرى الفريق الأول لكرة القدم بنادي الاتحاد السكندري تدريباته اليوم تحت قيادة الجهاز الفني، استعداداً للمباراة المرتقبة أمام الزمالك في الجولة القادمة من الدوري المصري الممتاز.',
    image: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=1000&auto=format&fit=crop',
    date: new Date(Date.now() - 2 * 3600000).toISOString(),
    type: 'manual',
  }
];

const defaultMedia: MediaItem[] = [
  {
    id: uuidv4(),
    title: 'أجمل أهداف فريق الاتحاد هذا الموسم',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1510563399035-7140409890a5?q=80&w=1000&auto=format&fit=crop',
    date: new Date(Date.now() - 24 * 3600000).toISOString(),
    duration: '04:20',
    views: '150K',
  },
  {
    id: uuidv4(),
    title: 'صور مران الفريق الصباحي اليوم',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1000&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1000&auto=format&fit=crop',
    date: new Date().toISOString(),
  }
];

const defaultMatches: MatchItem[] = [
  {
    id: uuidv4(),
    homeTeam: 'الاتحاد',
    awayTeam: 'الأهلي',
    homeLogo: 'https://upload.wikimedia.org/wikipedia/ar/thumb/0/0e/Al_Ittihad_Alexandria_Club_Logo.svg/1024px-Al_Ittihad_Alexandria_Club_Logo.svg.png',
    awayLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Al_Ahly_SC_logo.svg/1200px-Al_Ahly_SC_logo.svg.png',
    homeScore: '1',
    awayScore: '1',
    date: new Date().toISOString(),
    status: 'live',
    competition: 'الدوري المصري الممتاز',
  },
  {
    id: uuidv4(),
    homeTeam: 'الزمالك',
    awayTeam: 'الاتحاد',
    homeLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Zamalek_SC_logo.svg/1200px-Zamalek_SC_logo.svg.png',
    awayLogo: 'https://upload.wikimedia.org/wikipedia/ar/thumb/0/0e/Al_Ittihad_Alexandria_Club_Logo.svg/1024px-Al_Ittihad_Alexandria_Club_Logo.svg.png',
    homeScore: '-',
    awayScore: '-',
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'upcoming',
    competition: 'الدوري المصري الممتاز',
  }
];

const defaultLiveStream: LiveStream = {
  isActive: true,
  url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  title: 'مباراة الاتحاد والأهلي - بث مباشر',
  viewers: 1240,
};

const defaultProfile: UserProfile = {
  name: 'أحمد حسان',
  location: 'الإسكندرية، مصر',
  joinDate: '٢٠١٨',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuART5YPR2Zh5GE1f6BgzZdo0gAuNI_r2zmSy81b5UM5fkx6tGUYhRhD2X8SshJ2To-JtmeHfvz64RaHM5Q_JlGW6orP67LkUtb6Dg2ithzxUWvVtpNDGMY24OaVFykdic4IqqF07jdklAFRW0qC-IER686Ha_E82_vvri6sLjGjtL67DlmZhKtVLW3jiZvXgMeIO-w6iJZAM4tMF1okvQ_w8dpZGrI2581QgolFPkuYZYOKORPG8FCrXMvnUbg4u3IdMA-mhE0RhYo',
  isVerified: true,
  stats: {
    predictions: 42,
    comments: 156,
    favorites: 12
  }
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      news: defaultNews,
      media: defaultMedia,
      matches: defaultMatches,
      clubs: [],
      polls: [],
      predictions: [],
      fanPosts: [],
      users: [],
      appSettings: {
        appName: 'إتحاد فان',
        appLogo: 'https://upload.wikimedia.org/wikipedia/ar/thumb/0/0e/Al_Ittihad_Alexandria_Club_Logo.svg/512px-Al_Ittihad_Alexandria_Club_Logo.svg.png'
      },
      liveStream: defaultLiveStream,
      theme: 'dark',
      profile: defaultProfile,
      clubTitles: [],
      clubStats: [],
      historyEvents: [],
      stadiums: [],
      newsCategories: ['أخبار الفريق', 'كرة سلة', 'ألعاب أخرى', 'تقارير', 'انتقالات'],
      products: [],
      orders: [],
      setNews: (news) => set({ news }),
      addNews: (item) => set((state) => ({ news: [item, ...state.news] })),
      deleteNews: (id) => set((state) => ({ news: state.news.filter(n => n.id !== id) })),
      updateNews: (id, updatedItem) => set((state) => ({
        news: state.news.map(n => n.id === id ? { ...n, ...updatedItem } : n)
      })),
      setMedia: (media) => set({ media }),
      addMedia: (item) => set((state) => ({ media: [item, ...state.media] })),
      deleteMedia: (id) => set((state) => ({ media: state.media.filter(m => m.id !== id) })),
      updateMedia: (id, updatedItem) => set((state) => ({
        media: state.media.map(m => m.id === id ? { ...m, ...updatedItem } : m)
      })),
      setMatches: (matches) => set({ matches }),
      addMatch: (item) => set((state) => ({ matches: [item, ...state.matches] })),
      deleteMatch: (id) => set((state) => ({ matches: state.matches.filter(m => m.id !== id) })),
      updateMatch: (id, updatedItem) => set((state) => ({
        matches: state.matches.map(m => m.id === id ? { ...m, ...updatedItem } : m)
      })),
      setClubs: (clubs) => set({ clubs }),
      setPolls: (polls) => set({ polls }),
      setPredictions: (predictions) => set({ predictions }),
      setFanPosts: (posts) => set({ fanPosts: posts }),
      setUsers: (users) => set({ users }),
      updateUser: (uid, updatedItem) => set((state) => ({
        users: state.users.map(u => u.uid === uid ? { ...u, ...updatedItem } : u)
      })),
      deleteUser: (uid) => set((state) => ({
        users: state.users.filter(u => u.uid !== uid)
      })),
      setSettings: (settings) => set({ appSettings: settings }),
      updateLiveStream: (stream) => set((state) => ({ liveStream: { ...state.liveStream, ...stream } })),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      updateProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } as UserProfile })),
      setClubTitles: (clubTitles) => set({ clubTitles }),
      setClubStats: (clubStats) => set({ clubStats }),
      setHistoryEvents: (historyEvents) => set({ historyEvents }),
      setStadiums: (stadiums) => set({ stadiums }),
      setNewsCategories: (newsCategories) => set({ newsCategories }),
      setProducts: (products) => set({ products }),
      setOrders: (orders) => set({ orders }),
    }),
    {
      name: 'ittihad-app-storage',
    }
  )
);
