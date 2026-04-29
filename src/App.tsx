import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from './store';
import { useFirestoreSync } from './hooks/useFirestore';
import Splash from './pages/Splash';
import Auth from './pages/Auth';
import Home from './pages/Home';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Media from './pages/Media';
import Live from './pages/Live';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import FanZone from './pages/FanZone';
import History from './pages/History';
import Store from './pages/Store';
import BottomNav from './components/BottomNav';

export default function App() {
  const { theme } = useAppStore();
  useFirestoreSync();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display antialiased overflow-x-hidden transition-colors duration-200">
        <Routes>
          <Route path="/splash" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<FanZone />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/media" element={<Media />} />
          <Route path="/live" element={<Live />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/fan-zone" element={<FanZone />} />
          <Route path="/history" element={<History />} />
          <Route path="/store" element={<Store />} />
        </Routes>
        <AppNav />
      </div>
    </BrowserRouter>
  );
}

function AppNav() {
  const location = useLocation();
  const hideNavPaths = ['/splash', '/auth'];
  const isSplashOrAuth = hideNavPaths.includes(location.pathname);
  if (isSplashOrAuth) return null;
  return <BottomNav />;
}
