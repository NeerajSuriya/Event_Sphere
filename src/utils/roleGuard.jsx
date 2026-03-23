import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { currentUser, userData } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Redirect non-logged in users to login, pass intended location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userData?.isBanned) {
    // Show banned UI for banned users
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-surface p-8 rounded-xl shadow-lg text-center border-t-4 border-danger">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Account Suspended</h1>
          <p className="text-gray-600">
            Your account has been restricted. You cannot access the application.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export function PublicRoute({ children }) {
  const { currentUser } = useAuth();

  if (currentUser) {
    // Redirect authenticated users trying to access login/signup
    return <Navigate to="/feed" replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const { currentUser, userData } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userData?.isBanned) {
    // Re-use logic or fallback
    return <Navigate to="/feed" replace />;
  }

  if (userData?.role !== 'admin') {
    // Basic user trying to access admin
    return <Navigate to="/feed" replace />;
  }

  return children;
}
