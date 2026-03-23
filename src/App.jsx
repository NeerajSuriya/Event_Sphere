import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import EventFeed from './pages/EventFeed';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import { ProtectedRoute, PublicRoute, AdminRoute } from './utils/roleGuard';

function App() {
  return (
    <div className="min-h-screen flex flex-col font-body bg-gray-50 dark:bg-gray-900 dark:text-white transition-colors duration-300">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 flex flex-col animate-fade-in-up">
        <Routes>
          {/* Unprotected Public Routes */}
          <Route path="/" element={<Landing />} />
          
          {/* Authentication Route (Only for logged out users) */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          {/* Protected Main Routes (Requires Login) */}
          <Route path="/feed" element={
            <ProtectedRoute>
              <EventFeed />
            </ProtectedRoute>
          } />
          <Route path="/events/:id" element={
            <ProtectedRoute>
              <EventDetail />
            </ProtectedRoute>
          } />
          <Route path="/create-event" element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />

          {/* Administrative Routes (Admin Only) */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          {/* 404 Catch All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </div>
  );
}

export default App;
