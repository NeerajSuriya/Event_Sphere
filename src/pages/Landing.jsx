import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Landing() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const eventsRef = collection(db, 'events');
        // Fetch only approved events
        const q = query(eventsRef, where('status', '==', 'approved'));
        const snapshot = await getDocs(q);
        
        let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort in client to avoid requiring a Firebase composite index setup 
        events.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        events = events.slice(0, 3);
        
        setFeaturedEvents(events);
      } catch (error) {
        console.error("Error fetching featured events:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-700 to-indigo-900 text-white py-24 lg:py-32">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight mb-6 animate-fade-in-up">
            Discover. Register. <span className="text-blue-300">Participate.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-blue-100 mb-10 leading-relaxed font-body">
            The ultimate platform to find and join the best campus events, workshops, and sports tournaments seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/feed" className="bg-white text-primary hover:bg-gray-50 font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all w-full sm:w-auto text-center transform hover:-translate-y-1">
              Explore Events
            </Link>
            <Link to="/login" className="bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 font-medium px-8 py-4 rounded-full transition-all w-full sm:w-auto text-center">
              Create an Event
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-gray-500 dark:text-gray-300 max-w-2xl mx-auto text-lg">Get involved in campus life in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-blue-50 dark:bg-gray-800 text-base rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm shadow-blue-100 dark:shadow-none group-hover:-translate-y-2 transition-transform">
                🔍
              </div>
              <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white mb-3">1. Browse Events</h3>
              <p className="text-gray-500 dark:text-gray-300 leading-relaxed">Discover what's happening around campus. Filter by category, date, or organizer.</p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-blue-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm shadow-blue-100 dark:shadow-none group-hover:-translate-y-2 transition-transform">
                📝
              </div>
              <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white mb-3">2. Register Online</h3>
              <p className="text-gray-500 dark:text-gray-300 leading-relaxed">Sign up for events with one click. Simple, fast, and completely hassle-free.</p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-blue-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm shadow-blue-100 dark:shadow-none group-hover:-translate-y-2 transition-transform">
                ✅
              </div>
              <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white mb-3">3. Get Confirmed</h3>
              <p className="text-gray-500 dark:text-gray-300 leading-relaxed">Receive instant email confirmations and tickets right to your inbox.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 flex-1 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Featured Events</h2>
              <p className="text-gray-500 dark:text-gray-300 text-lg">Don't miss out on these upcoming highlights on campus.</p>
            </div>
            <Link to="/feed" className="hidden md:flex items-center text-primary font-bold hover:text-blue-800 transition-colors">
              View all events <span className="ml-1 text-xl leading-none">→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl h-80 animate-pulse border border-gray-100 dark:border-gray-700 shadow-sm"></div>
              ))}
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-16 text-center transition-colors">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                🔍
              </div>
              <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white mb-3">No events found</h3>
              <p className="text-gray-500 dark:text-gray-300 max-w-sm mx-auto">Check back later when organizers publish new events on campus!</p>
            </div>
          )}
          
          <div className="mt-10 text-center md:hidden">
            <Link to="/feed" className="inline-flex items-center font-bold text-primary border-2 border-primary px-8 py-3 rounded-full hover:bg-primary hover:text-white transition-colors">
              View all events
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl mt-[-2px]">🔥</span>
              <span className="font-heading font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight">EventSphere</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center md:text-left">
              The ultimate college campus event management platform.
            </p>
          </div>
          
          <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">
            © {new Date().getFullYear()} University Name. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
