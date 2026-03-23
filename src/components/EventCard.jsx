import { Link } from 'react-router-dom';

export default function EventCard({ event }) {
  // Determine badge colors based on category
  const getCategoryColor = (category) => {
    switch(category?.toLowerCase()) {
      case 'cultural': return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500' };
      case 'technical': return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' };
      case 'sports': return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-500' };
      case 'workshop': return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-500' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-400' };
    }
  };

  const style = getCategoryColor(event.category);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full border-t-4 ${style.border}`}>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${style.bg} ${style.text}`}>
            {event.category || 'Other'}
          </span>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span>📅</span> {event.date}
          </span>
        </div>
        
        <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">{event.title}</h3>
        
        <div className="space-y-3 mb-6 flex-1 mt-2">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <span className="w-6 flex justify-center mr-2 opacity-80">📍</span>
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <span className="w-6 flex justify-center mr-2 opacity-80">⏱️</span>
            <span className="truncate">{event.time}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-50 dark:border-gray-700 mt-4">
            <span className="w-6 flex justify-center mr-2 opacity-70 text-xs">👤</span>
            <span className="truncate font-medium">{event.organizerName || 'Organizer'}</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 pb-6 mt-auto">
        <Link 
          to={`/events/${event.id}`}
          className="block w-full text-center border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-3 rounded-lg transition-colors select-none"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
