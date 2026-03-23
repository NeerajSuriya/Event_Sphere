import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, getDoc, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';

// Helper for formatting time ago
function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - date.toDate()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return "just now";
}

export default function UserDashboard() {
  const { currentUser, userData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'events');
  const [toast, setToast] = useState(location.state?.flashMessage || null);
  
  const [myEvents, setMyEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRegs, setLoadingRegs] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  // Handle toast timeout
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Tab 1: Fetch Events
  useEffect(() => {
    if (activeTab === 'events' && currentUser) {
      setLoadingEvents(true);
      const fetchEvents = async () => {
        try {
          const q = query(collection(db, 'events'), where('organizerId', '==', currentUser.uid));
          const snap = await getDocs(q);
          const evts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          evts.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
          setMyEvents(evts);
        } catch (e) {
          console.error("Events fetch err:", e);
        } finally {
          setLoadingEvents(false);
        }
      };
      fetchEvents();
    }
  }, [activeTab, currentUser]);

  // Tab 2: Fetch Registrations
  useEffect(() => {
    if (activeTab === 'registrations' && currentUser) {
      setLoadingRegs(true);
      const fetchRegs = async () => {
        try {
          const q = query(collection(db, 'registrations'), where('userId', '==', currentUser.uid));
          const snap = await getDocs(q);
          const regsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // Populate event dates and venues natively without redundant fields
          const populatedRegs = await Promise.all(regsData.map(async reg => {
            const evDoc = await getDoc(doc(db, 'events', reg.eventId));
            if (evDoc.exists()) {
               return { ...reg, eventDate: evDoc.data().date, eventVenue: evDoc.data().venue };
            }
            return { ...reg, eventDate: 'TBD', eventVenue: 'TBD' };
          }));
          
          populatedRegs.sort((a, b) => b.registeredAt?.toMillis() - a.registeredAt?.toMillis());
          setMyRegistrations(populatedRegs);
        } catch(e) {
          console.error("Reg fetch err:", e);
        } finally {
          setLoadingRegs(false);
        }
      };
      fetchRegs();
    }
  }, [activeTab, currentUser]);

  // Tab 3: Fetch Notifications
  useEffect(() => {
    if (activeTab === 'notifications' && currentUser) {
      setLoadingNotifs(true);
      const fetchNotifs = async () => {
        try {
          const q = query(collection(db, 'notifications'), where('userId', 'in', [currentUser.uid, 'all']));
          const snap = await getDocs(q);
          const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          notifs.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
          setNotifications(notifs);
        } catch (e) {
          console.error("Notifs fetch err:", e);
        } finally {
          setLoadingNotifs(false);
        }
      };
      fetchNotifs();
    }
  }, [activeTab, currentUser]);

  // Actions
  const handleDeleteEvent = async (id) => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'events', id));
        setMyEvents(prev => prev.filter(e => e.id !== id));
      } catch(e) {
        console.error("Delete failed", e);
        alert("Failed to delete event.");
      }
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead && notif.userId !== 'all') { // Skip mutating broadcast announcements via user doc natively
      try {
        await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
        setNotifications(prev => prev.map(n => n.id === notif.id ? {...n, isRead: true} : n));
      } catch (e) {}
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const markAllRead = async () => {
    try {
      const batch = writeBatch(db);
      let count = 0;
      notifications.forEach(n => {
        if (!n.isRead && n.userId !== 'all') {
          batch.update(doc(db, 'notifications', n.id), { isRead: true });
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
        setNotifications(prev => prev.map(n => n.userId !== 'all' && !n.isRead ? {...n, isRead: true} : n));
      }
    } catch(e) {
      console.error("Mark all read failed", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-body transition-colors duration-300">
      
      {/* Dynamic Toast from Router State */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-success text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-green-500 w-[90%] max-w-lg mb-8 animate-fade-in-down">
          <span className="text-3xl">🎉</span>
          <p className="font-bold text-sm sm:text-base leading-tight">{toast}</p>
        </div>
      )}

      {/* Header Profile Pane */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 pt-10 pb-2 px-4 sm:px-6 lg:px-8 shadow-sm transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex items-center gap-5 mb-8">
           <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center text-3xl font-heading font-bold shadow-md">
             {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
           </div>
           <div>
             <h1 className="text-3xl font-heading font-extrabold text-gray-900 dark:text-white">
               My Dashboard
             </h1>
             <p className="text-gray-500 dark:text-gray-400 font-medium">{userData?.name}</p>
           </div>
        </div>

        {/* Tab Navigation System */}
        <div className="max-w-6xl mx-auto flex gap-8">
          <button 
            onClick={() => setActiveTab('events')} 
            className={`pb-4 text-sm sm:text-base font-bold transition-all relative ${activeTab === 'events' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            My Events
            {activeTab === 'events' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('registrations')} 
            className={`pb-4 text-sm sm:text-base font-bold transition-all relative ${activeTab === 'registrations' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            My Registrations
            {activeTab === 'registrations' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('notifications')} 
            className={`pb-4 text-sm sm:text-base font-bold transition-all relative ${activeTab === 'notifications' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Notifications
            {activeTab === 'notifications' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full"></div>}
          </button>
        </div>
      </div>

      {/* Dynamic Pane Display */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* ================================== TAB 1: MY EVENTS ================================== */}
        {activeTab === 'events' && (
          <div className="space-y-5 animate-fade-in-up">
            
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">Your Events</h2>
              <Link to="/create-event" className="flex items-center gap-2 bg-primary hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg shadow-sm transition-colors text-sm font-bold">
                <span className="text-lg leading-none">+</span> Create New Event
              </Link>
            </div>

            {loadingEvents ? (
              [...Array(3)].map((_, i) => <div key={i} className="w-full h-32 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse"></div>)
            ) : myEvents.length > 0 ? (
              myEvents.map(event => (
                <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex flex-col md:flex-row gap-5 items-start justify-between transition-shadow hover:shadow-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider border border-gray-200">
                         {event.category || 'Other'}
                       </span>
                       {event.status === 'pending' && <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[11px] font-bold tracking-widest flex items-center gap-1 border border-amber-200"><span>⏳</span> PENDING</span>}
                       {event.status === 'approved' && <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-[11px] font-bold tracking-widest flex items-center gap-1 border border-green-200"><span>✅</span> APPROVED</span>}
                       {event.status === 'rejected' && <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-[11px] font-bold tracking-widest flex items-center gap-1 border border-red-200"><span>❌</span> REJECTED</span>}
                    </div>
                    <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-1">{event.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 mb-3">
                      <span>📅</span> {event.date} <span className="text-gray-300 dark:text-gray-600">•</span> <span>📍</span> {event.venue}
                    </p>
                    
                    {event.status === 'rejected' && event.rejectionReason && (
                      <div className="bg-red-50 text-danger border border-red-200 p-3 rounded-lg text-sm font-medium flex items-start gap-2">
                        <span className="text-base mt-[-1px]">ℹ️</span>
                        <div><strong className="block text-xs uppercase tracking-wider mb-0.5">Rejection Reason:</strong>{event.rejectionReason}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <button 
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="flex-1 md:flex-none border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm text-sm"
                    >
                      View details
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(event.id)}
                      className="flex-1 md:flex-none border-2 border-red-100 text-danger hover:bg-red-50 hover:border-red-200 font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center flex flex-col items-center transition-colors">
                <div className="text-6xl mb-4 opacity-50">📅</div>
                <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">No events created yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">Share your passion and build something epic. Your events will appear here once submitted.</p>
                <Link to="/create-event" className="bg-primary hover:bg-blue-800 text-white font-bold py-3.5 px-8 rounded-full shadow-md transition-colors">
                  Create Your First Event
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ================================== TAB 2: MY REGISTRATIONS ================================== */}
        {activeTab === 'registrations' && (
          <div className="space-y-4 animate-fade-in-up">
            {loadingRegs ? (
              [...Array(3)].map((_, i) => <div key={i} className="w-full h-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse"></div>)
            ) : myRegistrations.length > 0 ? (
              myRegistrations.map(reg => (
                <div key={reg.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:shadow-md">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-success border border-green-200 shadow-sm flex-shrink-0">
                      <span className="text-xl leading-none font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white line-clamp-1 mb-0.5">{reg.eventName}</h3>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>📅</span> {reg.eventDate} <span className="text-gray-300 dark:text-gray-600">•</span> <span>📍</span> {reg.eventVenue}
                      </p>
                    </div>
                  </div>
                  <Link 
                    to={`/events/${reg.eventId}`}
                    className="w-full sm:w-auto text-center border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm shadow-sm flex-shrink-0"
                  >
                    View Event
                  </Link>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center flex flex-col items-center transition-colors">
                <div className="text-6xl mb-4 opacity-50">🎫</div>
                <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">Your schedule is clear</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">You haven't registered for any events yet. Find exciting opportunities happening around campus.</p>
                <Link to="/feed" className="bg-primary hover:bg-blue-800 text-white font-bold py-3.5 px-8 rounded-full shadow-md transition-colors">
                  Browse Events
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ================================== TAB 3: NOTIFICATIONS ================================== */}
        {activeTab === 'notifications' && (
          <div className="animate-fade-in-up bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm tracking-wider uppercase">Recent Activity</h3>
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-xs font-bold text-primary hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 transition-colors">
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {loadingNotifs ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="p-5 flex gap-4 animate-pulse">
                    <div className="w-3 h-3 bg-gray-200 rounded-full mt-2"></div>
                    <div className="flex-1 space-y-2">
                       <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                       <div className="w-1/4 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))
              ) : notifications.length > 0 ? (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${!notif.isRead && notif.userId !== 'all' ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}
                  >
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${!notif.isRead && notif.userId !== 'all' ? 'bg-primary ring-4 ring-primary/20' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <div className="flex-1">
                      <p className={`text-base ${!notif.isRead && notif.userId !== 'all' ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider space-mt-1 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {notif.link && (
                      <div className="text-gray-400 group-hover:text-primary transition-colors text-xl">
                        →
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl mb-4 text-gray-400">🔔</div>
                  <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white mb-1">No notifications yet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">You'll see updates regarding your events here.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
