import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import RegistrationModal from '../components/RegistrationModal';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Registration state
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function fetchEventAndRegistration() {
      try {
        // Fetch specific event
        const eventDoc = await getDoc(doc(db, 'events', id));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
        } else {
          setEvent(null);
        }
        
        // Fetch Registration Status immediately if logged in
        if (currentUser && eventDoc.exists()) {
          const regQuery = query(
            collection(db, 'registrations'), 
            where('eventId', '==', id),
            where('userId', '==', currentUser.uid)
          );
          const regSnap = await getDocs(regQuery);
          if (!regSnap.empty) {
            setIsRegistered(true);
          }
        }
      } catch (err) {
        console.error("Error fetching event details:", err);
      } finally {
        setLoading(false);
        setCheckingRegistration(false);
      }
    }
    fetchEventAndRegistration();
  }, [id, currentUser]);

  const handleRegistrationSuccess = () => {
    setIsModalOpen(false);
    setIsRegistered(true);
    // Refresh local capacity visual
    setEvent(prev => ({...prev, registrationCount: (prev.registrationCount || 0) + 1}));
    
    // Show success toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const getGradient = (category) => {
    switch(category?.toLowerCase()) {
      case 'cultural': return 'from-purple-600 via-purple-500 to-pink-500';
      case 'technical': return 'from-blue-700 via-blue-600 to-indigo-700';
      case 'sports': return 'from-orange-600 via-orange-500 to-red-500';
      case 'workshop': return 'from-emerald-600 via-teal-500 to-teal-400';
      default: return 'from-blue-800 via-indigo-800 to-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Skeleton Top Banner */}
        <div className="w-full h-80 bg-gray-200 animate-pulse"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-20 z-10">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-6 bg-white p-8 rounded-2xl shadow-sm h-96 animate-pulse"></div>
             <div className="w-full h-[400px] bg-white shadow-xl rounded-2xl animate-pulse"></div>
           </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-7xl mb-6 bg-white p-6 rounded-full shadow-sm text-gray-400">🔍</div>
        <h2 className="text-3xl font-heading font-extrabold text-gray-900 mb-3 tracking-tight">Event not found</h2>
        <p className="text-gray-500 text-lg mb-8 max-w-sm text-center">The event you are looking for does not exist or has been removed.</p>
        <Link to="/feed" className="bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-3.5 px-8 rounded-full transition-colors shadow-sm">
          ← Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative font-body">
      
      {/* Absolute Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-success text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up border border-green-400">
          <span className="text-2xl">🎉</span>
          <p className="font-bold text-sm tracking-wide">You're registered! Check your email for confirmation.</p>
        </div>
      )}

      {/* Hero Banner Section */}
      <section className={`relative pt-10 pb-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br ${getGradient(event.category)} shadow-inner`}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative max-w-6xl mx-auto">
          <Link to="/feed" className="inline-flex items-center text-white/80 hover:text-white font-medium mb-10 transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm backdrop-blur-md">
            ← Back to Events
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold tracking-widest uppercase shadow-sm border border-white/30">
              {event.category || 'Other'}
            </span>
            {event.status === 'pending' && (
              <span className="px-3 py-1 bg-amber-400 text-amber-900 rounded-full text-xs font-bold border border-amber-300 flex items-center gap-1 shadow-sm">
                ⏱️ Pending Approval
              </span>
            )}
            {event.status === 'rejected' && (
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold border border-red-400 flex items-center gap-1 shadow-sm">
                ❌ Rejected
              </span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-heading font-extrabold text-white leading-tight drop-shadow-md">
            {event.title}
          </h1>
        </div>
      </section>

      {/* Layout Columns */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="opacity-80">📝</span> About this Event
              </h2>
              <div className="prose prose-blue max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed text-[15px] sm:text-base">
                {event.description}
              </div>
            </div>
            
            {event.attendeeNote && (
              <div className="bg-blue-50 border-l-4 border-primary p-6 rounded-r-2xl shadow-sm">
                <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <span>ℹ️</span> Note for Attendees
                </h3>
                <p className="text-blue-800 text-sm leading-relaxed">{event.attendeeNote}</p>
              </div>
            )}
            
            {event.brochureLink && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-heading font-bold text-gray-900 mb-1">Event Brochure</h3>
                  <p className="text-gray-500 text-sm">Download or view the official document for full details.</p>
                </div>
                <a 
                  href={event.brochureLink.startsWith('http') ? event.brochureLink : `https://${event.brochureLink}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-50 text-primary border border-blue-200 hover:bg-blue-100 px-6 py-3 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto justify-center flex-shrink-0"
                >
                  <span className="text-lg">📄</span> View Brochure
                </a>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Event Details Card */}
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 p-7">
                <h3 className="text-xl font-heading font-extrabold text-gray-900 mb-6 border-b border-gray-100 pb-4 tracking-tight">Details</h3>
                
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">📅</div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Date</p>
                      <p className="font-bold text-gray-800">{event.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">⏰</div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Time</p>
                      <p className="font-bold text-gray-800">{event.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">📍</div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Venue</p>
                      <p className="font-bold text-gray-800">{event.venue}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
                      {event.organizerName ? event.organizerName.charAt(0).toUpperCase() : 'O'}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Organizer</p>
                      <p className="font-bold text-gray-800">{event.organizerName}</p>
                    </div>
                  </div>
                  
                  {event.capacity && (
                    <div className="flex items-start gap-4 pt-2">
                       <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">👥</div>
                       <div className="w-full">
                         <div className="flex justify-between items-end mb-2">
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Capacity</p>
                           <span className="text-xs font-bold text-gray-700">{event.registrationCount || 0} / {event.capacity}</span>
                         </div>
                         <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-primary rounded-full transition-all duration-500"
                             style={{ width: `${Math.min(100, ((event.registrationCount || 0) / parseInt(event.capacity)) * 100)}%` }}
                           ></div>
                         </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Registration Action Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                {checkingRegistration ? (
                  <div className="h-14 bg-gray-100 animate-pulse rounded-xl w-full"></div>
                ) : !currentUser ? (
                  <button 
                    onClick={() => navigate('/login', { state: { from: location } })}
                    className="w-full bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-bold py-4 rounded-xl transition-all shadow-sm"
                  >
                    Login to Register
                  </button>
                ) : isRegistered ? (
                  <div className="flex flex-col gap-3">
                    <button 
                      disabled
                      className="w-full bg-success opacity-90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-default"
                    >
                      <span className="text-xl">✓</span> You're Registered
                    </button>
                    {event.registrationFormURL && (
                      <a href={event.registrationFormURL.startsWith('http') ? event.registrationFormURL : `https://${event.registrationFormURL}`} target="_blank" rel="noopener noreferrer" className="text-center text-sm font-bold text-primary hover:text-blue-800 mt-2 hover:underline">
                         View Registration Form ↗
                      </a>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    // Disable if capacity full
                    disabled={event.capacity && (event.registrationCount || 0) >= parseInt(event.capacity)}
                    className="w-full bg-primary text-white hover:bg-blue-800 font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {event.capacity && (event.registrationCount || 0) >= parseInt(event.capacity) ? "Event Full" : "Register for this Event"}
                  </button>
                )}
              </div>
              
            </div>
          </div>
        </div>
      </section>

      <RegistrationModal 
        event={event} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
