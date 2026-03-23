import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { currentUser, userData, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to={currentUser ? '/feed' : '/'} className="flex items-center gap-2">
              <span className="text-2xl mt-[-2px]">🔥</span>
              <span className="font-heading font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">EventSphere</span>
            </Link>
          </div>

          {/* Center: Search (Desktop) */}
          <div className="hidden md:flex flex-1 items-center justify-center px-8">
            <div className="w-full max-w-lg relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base">
                🔍
              </div>
              <input 
                type="text" 
                placeholder="Search events, organizers..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 border-transparent rounded-full focus:bg-white dark:focus:bg-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none font-body"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-4">
             <button 
               onClick={toggleTheme}
               className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center"
             >
               {isDark ? '☀️' : '🌙'}
             </button>
             {currentUser ? (
               <>
                 <NotificationBell />
                 <div className="relative">
                   <button 
                     onClick={() => setIsProfileOpen(!isProfileOpen)}
                     className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-indigo-500 text-white hover:opacity-90 transition-opacity focus:outline-none shadow-sm"
                   >
                     <span className="font-heading font-bold text-sm">
                       {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                     </span>
                   </button>

                   {/* Dropdown menu */}
                   {isProfileOpen && (
                     <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-50 dark:border-gray-700">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userData?.name || 'User'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{currentUser.email}</p>
                        </div>
                        {userData?.role === 'admin' ? (
                          <Link onClick={() => setIsProfileOpen(false)} to="/admin" className=" flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"><span className="mr-2">📊</span> Admin Dashboard</Link>
                        ) : (
                          <Link onClick={() => setIsProfileOpen(false)} to="/dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"><span className="mr-2">📊</span> My Dashboard</Link>
                        )}
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                        <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors">
                          <span className="mr-2">🚪</span> Sign out
                        </button>
                     </div>
                   )}
                 </div>
               </>
             ) : (
               <div className="flex items-center gap-3">
                 <Link to="/login" className="text-gray-600 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white text-sm px-3 py-2 transition-colors">Log in</Link>
                 <Link to="/login" className="bg-primary text-white font-medium hover:bg-blue-800 text-sm px-5 py-2 rounded-full transition-colors shadow-sm shadow-primary/30">Sign up</Link>
               </div>
             )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-3">
             <button 
               onClick={toggleTheme}
               className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center"
             >
               {isDark ? '☀️' : '🌙'}
             </button>
             {currentUser && <NotificationBell />}
             <button 
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors text-xl font-bold"
             >
               {isMobileMenuOpen ? '✕' : '☰'}
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-4 pt-3 pb-4 space-y-1 shadow-inner">
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base">
                  🔍
                </div>
                <input 
                  type="text" 
                  placeholder="Search events..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 border-transparent rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                />
              </div>
            </div>
            {currentUser ? (
              <>
                <div className="flex items-center px-2 py-3 border-b border-gray-100 dark:border-gray-700 mb-2">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-heading font-bold">
                       {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-900 dark:text-white">{userData?.name || 'User'}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-300">{currentUser.email}</p>
                  </div>
                </div>
                
                {userData?.role === 'admin' ? (
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/admin" className="flex items-center px-3 py-2.5 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"><span className="mr-3">📊</span> Admin Dashboard</Link>
                ) : (
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/dashboard" className="flex items-center px-3 py-2.5 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"><span className="mr-3">📊</span> My Dashboard</Link>
                )}
                <button onClick={handleLogout} className="flex items-center w-full text-left px-3 py-2.5 rounded-md text-base font-medium text-danger dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1">
                  <span className="mr-3">🚪</span> Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 mt-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                 <Link onClick={() => setIsMobileMenuOpen(false)} to="/login" className="flex justify-center flex-1 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-medium text-sm px-4 py-3 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">Log in</Link>
                 <Link onClick={() => setIsMobileMenuOpen(false)} to="/login" className="flex justify-center flex-1 bg-primary hover:bg-blue-800 text-white font-medium text-sm px-4 py-3 rounded-xl shadow-sm transition-colors">Create Account</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
