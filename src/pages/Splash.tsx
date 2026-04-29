import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';

export default function Splash() {
  const navigate = useNavigate();
  const { updateProfile, appSettings } = useAppStore();
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      // Small timeout for visibility
      setTimeout(() => {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              updateProfile(userDoc.data());
            }
            navigate('/');
          } else {
            navigate('/auth');
          }
        });
      }, 2000);
    };

    checkAuthAndLoad();
  }, [navigate, updateProfile]);

  return (
    <div className="fixed inset-0 z-[200] bg-primary flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-slate-900 opacity-90"></div>
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      <AnimatePresence>
        {showLogo && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center gap-6 z-10"
          >
            <div className="relative">
              <motion.div 
                animate={{ 
                  boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 40px rgba(255,255,255,0.4)", "0 0 0px rgba(255,255,255,0)"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 rounded-full overflow-hidden bg-white/10 backdrop-blur-md p-1 ring-4 ring-white/20"
              >
                <img src={appSettings.appLogo} alt="Logo" className="w-full h-full object-contain" />
              </motion.div>
            </div>
            
            <div className="text-center">
              <h1 className="text-4xl font-black text-white tracking-widest drop-shadow-2xl">{appSettings.appName}</h1>
              <p className="text-white/60 font-bold tracking-[0.2em] mt-2 uppercase text-[10px]">Official Fan App</p>
            </div>

            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: 100 }}
              className="h-1 bg-white/20 rounded-full mt-4 overflow-hidden"
            >
              <motion.div 
                animate={{ x: [-100, 100] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="h-full w-20 bg-white"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-10 text-white/30 text-[10px] font-black uppercase tracking-widest z-10">
        Version 1.2.0 • سيد البلد
      </div>
    </div>
  );
}
