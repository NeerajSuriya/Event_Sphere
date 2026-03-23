import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-body animate-fade-in-up">
      <div className="text-8xl mb-6 drop-shadow-sm">🏜️</div>
      <h1 className="text-5xl md:text-6xl font-heading font-extrabold text-gray-900 mb-4 tracking-tight drop-shadow-sm">404</h1>
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Page not found</h2>
      <p className="text-gray-500 mb-8 text-center max-w-sm">The page you're trying to access doesn't exist, has been moved, or is currently unavailable.</p>
      <Link to="/" className="bg-primary hover:bg-blue-800 text-white font-bold py-3.5 px-8 rounded-full shadow-md transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
        ← Go Home
      </Link>
    </div>
  );
}
