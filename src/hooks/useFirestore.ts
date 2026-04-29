import { useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, limit, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAppStore } from '../store';

export function useFirestoreSync() {
  const { 
    setNews, setMedia, setMatches, setClubs, setPolls, setPredictions, setFanPosts,
    setUsers, setSettings, updateLiveStream, updateProfile, profile 
  } = useAppStore();

  useEffect(() => {
    // Sync News
    const newsQuery = query(collection(db, 'news'), orderBy('date', 'desc'));
    const unsubNews = onSnapshot(newsQuery, (snapshot) => {
      const news = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setNews(news);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'news'));

    // Sync Matches
    const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'desc'));
    const unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setMatches(matches);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'matches'));

    // Sync Clubs
    const unsubClubs = onSnapshot(collection(db, 'clubs'), (snapshot) => {
      const clubs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setClubs(clubs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'clubs'));

    // Sync Polls
    const unsubPolls = onSnapshot(collection(db, 'polls'), (snapshot) => {
      const polls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setPolls(polls);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'polls'));

    // Sync Predictions
    const unsubPredictions = onSnapshot(collection(db, 'predictions'), (snapshot) => {
      const predictions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setPredictions(predictions);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'predictions'));

    // Sync Fan Posts
    const fanPostsQuery = query(collection(db, 'fan_posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubFanPosts = onSnapshot(fanPostsQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setFanPosts(posts);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'fan_posts'));

    // Sync Media
    const mediaQuery = query(collection(db, 'media'), orderBy('date', 'desc'));
    const unsubMedia = onSnapshot(mediaQuery, (snapshot) => {
      const mediaItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setMedia(mediaItems);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'media'));

    // Sync Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as any);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/global'));

    // Sync Live Stream
    const unsubLive = onSnapshot(doc(db, 'settings', 'liveStream'), (docSnap) => {
      if (docSnap.exists()) {
        updateLiveStream(docSnap.data() as any);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/liveStream'));

    // Sync Current User Profile
    let unsubProfile = () => {};
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Update last active
      updateDoc(doc(db, 'users', currentUser.uid), { lastActive: new Date().toISOString() })
        .catch(err => console.error('Failed to update activity:', err));

      unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as any;
          updateProfile(userData);
          
          // Auto-upgrade bootstrap admin
          if ((currentUser.email?.toLowerCase() === 'copyrightofficialco@gmail.com' || currentUser.email?.toLowerCase() === 'omarmagedugm@gmail.com') && userData.role !== 'admin') {
            updateDoc(doc(db, 'users', currentUser.uid), { role: 'admin' })
              .catch(err => console.error('Failed to auto-upgrade admin:', err));
          }
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`));
    }

    // Sync Users (Only if admin)
    let unsubUsers = () => {};
    if (profile.role === 'admin' && auth.currentUser) {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as any;
        setUsers(users);
      }, (error) => {
        if (error.code !== 'permission-denied') {
          handleFirestoreError(error, OperationType.LIST, 'users');
        }
      });
    }

    return () => {
      unsubNews();
      unsubMatches();
      unsubClubs();
      unsubPolls();
      unsubPredictions();
      unsubFanPosts();
      unsubMedia();
      unsubSettings();
      unsubLive();
      unsubProfile();
      unsubUsers();
    };
  }, [auth.currentUser?.uid, setNews, setMedia, setMatches, setClubs, setPolls, setPredictions, setFanPosts, setUsers, setSettings, updateLiveStream, updateProfile, profile.role]);
}
