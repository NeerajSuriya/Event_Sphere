import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    // Listen to live notifications for this user or global announcements
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [currentUser.uid, 'all'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach(doc => {
        const notif = doc.data();
        if (!notif.isRead && notif.userId !== 'all') { // Skip counting 'all' for unread badge logic natively, or store differently
          count++;
        }
      });
      setUnreadCount(count);
    }, (err) => {
      console.error("Bell fetch error:", err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <Link 
      to="/dashboard" 
      state={{ activeTab: 'notifications' }} 
      className="relative p-2 text-gray-500 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/40"
    >
      <span className="text-xl">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 inline-flex items-center justify-center h-[18px] w-[18px] rounded-full bg-danger text-white text-[10px] font-bold border-2 border-white shadow-sm">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
