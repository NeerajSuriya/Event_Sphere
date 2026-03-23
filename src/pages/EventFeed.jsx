import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';

export default function EventFeed() {
  const { userData } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDate, setSelectedDate] = useState('All'); // Upcoming, This Week, This Month

  const categories = ['All', 'Cultural', 'Technical', 'Sports', 'Workshop', 'Other'];
  const dateFilters = ['All', 'Upcoming', 'This Week', 'This Month'];

  useEffect(() => {
    async function fetchEvents() {
      try {
        const eventsRef = collection(db, 'events');
        // Fetch only approved status to honor requirements
        const q = query(eventsRef, where('status', '==', 'approved'));
        const snapshot = await getDocs(q);
        
        let fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Custom sort by date ascending natively in JS to prevent Firebase composite index requirements
        fetchedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching feed events:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Filter events logically
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // 1. Category check
      if (selectedCategory !== 'All' && event.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      
      // 2. Search check (title or organizer)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = event.title?.toLowerCase().includes(searchLower);
        const orgMatch = event.organizerName?.toLowerCase().includes(searchLower);
        if (!titleMatch && !orgMatch) return false;
      }
      
      // 3. Date check (Mocking strict relative checks for simplicity + stability)
      if (selectedDate !== 'All' && event.date) {
        const eventDate = new Date(event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate === 'Upcoming' && eventDate < today) return false;
        
        if (selectedDate === 'This Week') {
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          if (eventDate < today || eventDate > nextWeek) return false;
        }
        
        if (selectedDate === 'This Month') {
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
          if (eventDate < today || eventDate > nextMonth) return false;
        }
      }
      
      return true;
    });
  }, [events, searchTerm, selectedCategory, selectedDate]);

  // Greeting resolution
  const hour = new Date().getHours();
  let greetingObj = "Good evening";
  if (hour < 12) greetingObj = "Good morning";
  else if (hour < 18) greetingObj = "Good afternoon";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Header Area */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 pt-8 pb-6 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-heading font-extrabold text-gray-900 dark:text-white mb-2">
            {greetingObj}, <span className="text-primary">{userData?.name?.split(' ')[0] || 'User'}</span> 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Find your next big campus experience.</p>
          
          {/* Filtering Bar */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Search */}
            <div className="md:col-span-5 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                🔍
              </div>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events or organizers..." 
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 border-transparent rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body outline-none"
              />
            </div>
            
            {/* Category Filter */}
            <div className="md:col-span-4 flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium shadow-sm transition-colors"
              >
                {categories.map(cat => <option key={cat} value={cat}>📁 {cat}</option>)}
              </select>
            </div>
            
            {/* Date Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium shadow-sm transition-colors"
              >
                {dateFilters.map(df => <option key={df} value={df}>🕒 {df}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feed Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 6 Skeleton Cards */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl h-[400px] animate-pulse border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col p-6">
                <div className="flex justify-between mb-4">
                  <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-md mb-3"></div>
                <div className="w-2/3 h-8 bg-gray-200 dark:bg-gray-700 rounded-md mb-8"></div>
                <div className="space-y-3 mb-6 flex-1 mt-2">
                  <div className="w-[80%] h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-[60%] h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-[70%] h-4 bg-gray-200 dark:bg-gray-700 rounded mt-5"></div>
                </div>
                <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mt-auto"></div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-16 text-center max-w-2xl mx-auto mt-8 transition-colors">
            <div className="w-24 h-24 bg-blue-50 dark:bg-gray-700 text-blue-300 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
              🔍
            </div>
            <h3 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-3">No events found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg">We couldn't find any events matching your filters. Try adjusting your search or check back later!</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSelectedDate('All'); }}
              className="mt-8 px-6 py-3 bg-white border-2 border-primary text-primary hover:bg-primary font-bold hover:text-white rounded-full transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Floating Create Event Button (always visible since route is protected) */}
      <Link
        to="/create-event"
        title="Create Event"
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-blue-800 transition-all hover:scale-105 z-50 group"
      >
        <span className="text-4xl font-light mb-1">+</span>
        <span className="absolute right-full mr-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md font-bold">
          Create Event
        </span>
      </Link>
    </div>
  );
}
