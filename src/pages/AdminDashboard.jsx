import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { sendEventApprovedEmail, sendEventRejectedEmail, sendAnnouncementEmail } from '../services/emailService';

// Format helper
const formatDate = (ts) => {
  if (!ts) return '';
  return new Date(ts.toMillis()).toLocaleDateString();
};

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview'); // overview, events, users, announcements
  
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Rejection logic modal
  const [rejectModal, setRejectModal] = useState({ isOpen: false, event: null, reason: '' });

  // Compute stat aggregates
  const stats = {
    totalEvents: events.length,
    pendingEvents: events.filter(e => e.status === 'pending').length,
    activeEvents: events.filter(e => e.status === 'approved').length,
    totalUsers: users.length
  };

  const pendingEventsList = events.filter(e => e.status === 'pending').slice(0, 5);
  const approvedEventsList = events.filter(e => e.status === 'approved');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel loading for massive perf block
      const [evSnap, usrSnap, notifSnap] = await Promise.all([
        getDocs(collection(db, 'events')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'notifications'))
      ]);
      
      const evs = evSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const usrs = usrSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const notifs = notifSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(n => n.userId === 'all');
      
      evs.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      notifs.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      usrs.sort((a, b) => a.name?.localeCompare(b.name));
      
      setEvents(evs);
      setUsers(usrs);
      setAnnouncements(notifs);
    } catch(e) {
      console.error("Admin fetch failure:", e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  // ----- EVENT ACTIONS -----
  const handleApprove = async (event) => {
    if (!window.confirm(`Approve ${event.title}?`)) return;
    try {
      await updateDoc(doc(db, 'events', event.id), { status: 'approved' });
      await sendEventApprovedEmail(event.organizerEmail, event.organizerName, event);
      await addDoc(collection(db, 'notifications'), {
        userId: event.organizerId,
        message: `Your event ${event.title} has been approved! 🎉`,
        link: `/events/${event.id}`,
        isRead: false,
        createdAt: serverTimestamp()
      });
      showToast("Event approved and organizer notified");
      fetchData();
    } catch(e) {
      console.error(e);
      alert("Failed to approve event.");
    }
  };

  const submitReject = async () => {
    const { event, reason } = rejectModal;
    if (!reason.trim()) return alert("Rejection reason is required.");
    try {
      await updateDoc(doc(db, 'events', event.id), { status: 'rejected', rejectionReason: reason });
      await sendEventRejectedEmail(event.organizerEmail, event, reason);
      await addDoc(collection(db, 'notifications'), {
        userId: event.organizerId,
        message: `Your event ${event.title} was not approved. Reason: ${reason}`,
        link: "/dashboard",
        isRead: false,
        createdAt: serverTimestamp()
      });
      showToast("Event rejected and organizer notified");
      setRejectModal({ isOpen: false, event: null, reason: '' });
      fetchData();
    } catch(e) {
      console.error(e);
      alert("Failed to reject event.");
    }
  };

  const handleDeleteEvent = async (id) => {
    if(window.confirm("WARNING: Are you sure you want to permanently delete this event?")) {
      await deleteDoc(doc(db, 'events', id));
      showToast("Event fully deleted via Admin override.");
      fetchData();
    }
  };

  // ----- USER ACTIONS -----
  const handlePromote = async (user) => {
    if (user.id === currentUser.uid) return alert("You cannot modify your own role here.");
    if(window.confirm(`Promote ${user.name} to Admin?`)) {
      await updateDoc(doc(db, 'users', user.id), { role: 'admin' });
      showToast(`${user.name} promoted to Admin ranks`);
      fetchData();
    }
  };

  const handleToggleBan = async (user) => {
    if (user.id === currentUser.uid) return alert("You cannot ban yourself.");
    const newStatus = !user.isBanned;
    if(window.confirm(`${newStatus ? 'Ban' : 'Unban'} ${user.name}?`)) {
      await updateDoc(doc(db, 'users', user.id), { isBanned: newStatus });
      showToast(`User has been ${newStatus ? 'Banned' : 'Unbanned'}`);
      fetchData();
    }
  };

  // ----- ANNOUNCEMENT ACTION -----
  const [selectedAnnounce, setSelectedAnnounce] = useState('');
  const handleAnnounce = async () => {
    if(!selectedAnnounce) return alert("Select an approved event to announce.");
    const evt = events.find(e => e.id === selectedAnnounce);
    if(!evt) return;
    
    if(!window.confirm(`Broadcasting ${evt.title} to all ${users.length} users. Continue?`)) return;
    
    try {
      // 1-2. Fetch all users logically via existing state and fire mocks
      users.forEach(u => u.email && sendAnnouncementEmail(u.email, evt));
      
      // 3. System broadcast notification
      await addDoc(collection(db, 'notifications'), {
        userId: 'all',
        message: `📢 Campus Announcement: Don't miss ${evt.title}!`,
        link: `/events/${evt.id}`,
        isRead: false,
        createdAt: serverTimestamp()
      });
      
      showToast("Announcement sent to all students! 📢");
      setSelectedAnnounce('');
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Failed to broadcast.");
    }
  };

  // ----- SKELETON LOADERS -----
  const TableSkeleton = () => (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
      <div className="h-12 bg-gray-50 border-b border-gray-200"></div>
      {[...Array(5)].map((_, i) => (
         <div key={i} className={`h-16 border-b border-gray-100 flex items-center px-6 animate-pulse ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
           <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
           <div className="w-1/4 h-4 bg-gray-200 rounded ml-4"></div>
           <div className="w-20 h-6 bg-gray-200 rounded-full ml-auto"></div>
         </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 font-body relative transition-colors duration-300">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-gray-900/90 backdrop-blur-sm text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 border border-gray-700 w-auto whitespace-nowrap animate-fade-in-down">
          <span className="text-xl">✅</span>
          <p className="font-bold text-sm">{toast}</p>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-heading font-extrabold text-xl mb-2 text-gray-900 dark:text-white">Reject Event</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Please provide a reason to organizer <b>{rejectModal.event?.organizerName}</b> why this event is being rejected.</p>
            <textarea 
               value={rejectModal.reason}
               onChange={(e) => setRejectModal(prev => ({...prev, reason: e.target.value}))}
               className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-400 outline-none resize-y mb-6 text-gray-900 dark:text-white"
               rows="3"
               placeholder="Missing valid brochure link, date conflicts..."
            ></textarea>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setRejectModal({isOpen: false, event: null, reason: ''})}
                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
               >Cancel</button>
              <button 
                onClick={submitReject}
                className="px-5 py-2.5 bg-danger text-white font-bold hover:bg-red-700 rounded-xl transition-colors"
               >Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Sidebar Navigation */}
      <div className="w-full md:w-64 bg-gray-900 md:h-screen md:sticky md:top-0 md:flex flex-col z-40 shadow-xl flex-shrink-0">
        <div className="p-6 md:p-8 flex-shrink-0">
           <Link to="/feed" className="text-white text-xl font-heading font-extrabold block hover:text-blue-400 transition-colors">EventSphere Admin</Link>
           <p className="text-gray-400 text-xs tracking-widest font-bold uppercase mt-2 opacity-70">Control Center</p>
        </div>
        
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1 px-4 md:px-0 md:flex-1 scrollbar-hide pb-4 md:pb-0">
          {[
            { id: 'overview', icon: '📊', label: 'Overview' },
            { id: 'events', icon: '📅', label: 'All Events' },
            { id: 'users', icon: '👥', label: 'Users' },
            { id: 'announcements', icon: '📢', label: 'Announcements' }
          ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-3 px-6 py-3.5 md:py-4 transition-all uppercase tracking-wide text-sm font-bold whitespace-nowrap md:border-l-4 ${activeTab === tab.id ? 'bg-gray-800 text-white border-primary' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border-transparent'}`}
             >
               <span className="text-xl md:text-lg opacity-80">{tab.icon}</span> 
               <span>{tab.label}</span>
             </button>
          ))}
        </nav>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 lg:p-10 min-w-0">
        
        {/* ======================= OVERVIEW TAB ======================= */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in-up space-y-8">
            <h2 className="text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">System Overview</h2>
            
            {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div><div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div></div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat Cards */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Total Events</p>
                    <p className="text-4xl font-heading font-extrabold text-gray-900 dark:text-white">{stats.totalEvents}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-primary rounded-xl flex items-center justify-center text-2xl">📅</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Pending Approval</p>
                    <p className="text-4xl font-heading font-extrabold text-amber-500">{stats.pendingEvents}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-xl flex items-center justify-center text-2xl">⏳</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Active Events</p>
                    <p className="text-4xl font-heading font-extrabold text-success">{stats.activeEvents}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 text-success rounded-xl flex items-center justify-center text-2xl">✅</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Total Users</p>
                    <p className="text-4xl font-heading font-extrabold text-indigo-600 dark:text-indigo-400">{stats.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center text-2xl">👥</div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
               <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                 <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide">Recent Pending Events</h3>
                 <button onClick={() => setActiveTab('events')} className="text-sm font-bold text-primary hover:underline">View All</button>
               </div>
               {loading ? <TableSkeleton /> : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider">
                         <th className="px-6 py-4 font-bold">Event Name</th>
                         <th className="px-6 py-4 font-bold">Organizer</th>
                         <th className="px-6 py-4 font-bold">Date</th>
                         <th className="px-6 py-4 font-bold text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm">
                       {pendingEventsList.length === 0 ? (
                          <tr><td colSpan="4" className="text-center py-8 text-gray-500">No pending events requiring attention.</td></tr>
                       ) : pendingEventsList.map((evt, idx) => (
                          <tr key={evt.id} className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/30 dark:bg-gray-800/50'}`}>
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{evt.title}</td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{evt.organizerName}</td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{evt.date}</td>
                            <td className="px-6 py-4 flex gap-2 justify-end">
                              <Link to={`/events/${evt.id}`} className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg text-xs font-bold transition-all shadow-sm">View</Link>
                              <button onClick={() => handleApprove(evt)} className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-all shadow-sm">Approve</button>
                              <button onClick={() => handleRejectClick(evt)} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition-all shadow-sm">Reject</button>
                            </td>
                          </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* ======================= EVENTS TAB ======================= */}
        {activeTab === 'events' && (
          <div className="animate-fade-in-up space-y-6">
            <h2 className="text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">All Events Management</h2>
            {loading ? <TableSkeleton /> : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
                 <div className="overflow-x-auto max-h-[70vh]">
                   <table className="w-full text-left border-collapse relative">
                     <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                       <tr>
                         <th className="px-6 py-4 font-bold">Event Name</th>
                         <th className="px-6 py-4 font-bold">Organizer</th>
                         <th className="px-6 py-4 font-bold">Date</th>
                         <th className="px-6 py-4 font-bold">Category</th>
                         <th className="px-6 py-4 font-bold">Status</th>
                         <th className="px-6 py-4 font-bold text-right sticky right-0 bg-gray-50 dark:bg-gray-900 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)]">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm">
                        {events.length === 0 ? (
                          <tr><td colSpan="6" className="text-center py-10 text-gray-500">No events found in the database.</td></tr>
                        ) : events.map((evt, idx) => (
                          <tr key={evt.id} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-gray-700 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/30 dark:bg-gray-800/50'}`}>
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">{evt.title.substring(0, 30)}{evt.title.length > 30 ? '...' : ''}</td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{evt.organizerName}</td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{evt.date}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-[10px] uppercase font-bold tracking-widest">{evt.category || 'Other'}</span>
                            </td>
                            <td className="px-6 py-4">
                               {evt.status === 'pending' && <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">⏳ Pending</span>}
                               {evt.status === 'approved' && <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-md text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">✅ Approved</span>}
                               {evt.status === 'rejected' && <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-md text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">❌ Rejected</span>}
                            </td>
                            <td className="px-6 py-4 flex gap-2 justify-end sticky right-0 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)] bg-inherit">
                               <Link to={`/events/${evt.id}`} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors" title="View"><span className="text-lg">👁</span></Link>
                               {evt.status !== 'approved' && <button onClick={() => handleApprove(evt)} className="p-1.5 text-green-500 hover:bg-green-100 rounded-lg transition-colors" title="Approve"><span className="text-lg">✅</span></button>}
                               {evt.status !== 'rejected' && <button onClick={() => handleRejectClick(evt)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Reject"><span className="text-lg">❌</span></button>}
                               <button onClick={() => handleDeleteEvent(evt.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><span className="text-lg">🗑</span></button>
                            </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= USERS TAB ======================= */}
        {activeTab === 'users' && (
          <div className="animate-fade-in-up space-y-6">
            <h2 className="text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">System Users</h2>
            {loading ? <TableSkeleton /> : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
                 <div className="overflow-x-auto max-h-[70vh]">
                   <table className="w-full text-left border-collapse relative">
                     <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                       <tr>
                         <th className="px-6 py-4 font-bold">Name</th>
                         <th className="px-6 py-4 font-bold">Email</th>
                         <th className="px-6 py-4 font-bold">Role</th>
                         <th className="px-6 py-4 font-bold">Status</th>
                         <th className="px-6 py-4 font-bold text-right sticky right-0 bg-gray-50 dark:bg-gray-900 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)]">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm">
                        {users.map((usr, idx) => (
                          <tr key={usr.id} className={`border-b border-gray-100 dark:border-gray-700 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/30 dark:bg-gray-800/50'} hover:bg-blue-50/50 dark:hover:bg-gray-700`}>
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                               {usr.name} {usr.id === currentUser.uid && <span className="ml-2 text-[10px] bg-blue-100 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>}
                            </td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{usr.email}</td>
                            <td className="px-6 py-4">
                               <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest ${usr.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                                 {usr.role || 'user'}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               {usr.isBanned ? (
                                 <span className="text-danger flex items-center gap-1 font-bold text-xs"><span className="w-2 h-2 rounded-full bg-danger inline-block"></span> BANNED</span>
                               ) : (
                                 <span className="text-success flex items-center gap-1 font-bold text-xs"><span className="w-2 h-2 rounded-full bg-success inline-block"></span> ACTIVE</span>
                               )}
                            </td>
                            <td className="px-6 py-4 flex gap-3 justify-end sticky right-0 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)] bg-inherit">
                               {usr.role !== 'admin' && (
                                 <button onClick={() => handlePromote(usr)} className="text-xs font-bold text-primary hover:text-blue-800 hover:underline">Promote to Admin</button>
                               )}
                               <button 
                                 onClick={() => handleToggleBan(usr)} 
                                 disabled={usr.id === currentUser.uid || usr.role === 'admin'}
                                 className={`text-xs font-bold ${usr.isBanned ? 'text-green-600 hover:text-green-800' : 'text-danger hover:text-red-800'} ${usr.id === currentUser.uid || usr.role === 'admin' ? 'opacity-30 cursor-not-allowed' : 'hover:underline'}`}
                               >
                                 {usr.isBanned ? 'Unban User' : 'Ban User'}
                               </button>
                            </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= ANNOUNCEMENTS TAB ======================= */}
        {activeTab === 'announcements' && (
          <div className="animate-fade-in-up space-y-6">
            <h2 className="text-3xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">Campus Announcements</h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors">
               <h3 className="font-bold text-gray-900 dark:text-white mb-2">Broadcast Event Announcement</h3>
               <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Select a globally approved event to send an official platform-wide notification and email blast to all {users.length} registered students.</p>
               
               <div className="flex flex-col sm:flex-row gap-4 mb-8">
                 <select 
                   value={selectedAnnounce} 
                   onChange={(e) => setSelectedAnnounce(e.target.value)}
                   className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                 >
                   <option value="">-- Select an approved event --</option>
                   {approvedEventsList.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                 </select>
                 <button 
                   onClick={handleAnnounce}
                   disabled={!selectedAnnounce}
                   className="bg-primary hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
                 >
                   <span>📢</span> Announce to All Students
                 </button>
               </div>
               
               <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm tracking-widest uppercase border-b border-gray-100 dark:border-gray-700 pb-2 mb-4">Broadcast History</h4>
               <div className="space-y-3">
                 {loading ? <div className="h-16 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-xl w-full"></div> : announcements.length === 0 ? (
                   <p className="text-gray-400 text-sm italic">No system announcements have been dispatched yet.</p>
                 ) : announcements.map(n => (
                   <div key={n.id} className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-4 rounded-xl flex justify-between items-center hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all">
                     <div className="flex items-center gap-3">
                       <span className="text-2xl opacity-60">📢</span>
                       <div>
                         <p className="font-bold text-gray-800 dark:text-gray-200">{n.message}</p>
                         <p className="text-xs font-bold text-gray-400 mt-0.5 tracking-wider uppercase">{formatDate(n.createdAt)}</p>
                       </div>
                     </div>
                     <Link to={n.link} className="text-xs font-bold text-primary hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">View Event Focus</Link>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
