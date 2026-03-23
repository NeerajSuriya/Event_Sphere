import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendWelcomeEmail } from '../services/emailService';

export default function Login() {
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/feed';

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
    if (errors[e.target.name]) {
      setErrors({...errors, [e.target.name]: null});
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (activeTab === 'signup') {
      if (!formData.name) newErrors.name = "Full name is required";
      if (!formData.confirmPassword) newErrors.confirmPassword = "Confirm password is required";
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      if (activeTab === 'login') {
        await login(formData.email, formData.password);
        navigate(from, { replace: true });
      } else {
        const user = await signup(formData.email, formData.password, formData.name);
        try {
          // Attempt to send welcome email, don't block auth if it fails
          await sendWelcomeEmail({ name: formData.name, email: formData.email });
        } catch (emErr) {
          console.error("Welcome email failed", emErr);
        }
        navigate('/feed', { replace: true });
      }
    } catch (error) {
      console.error("Auth error:", error);
      setErrors({ form: error.message || "Failed to authenticate" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrors({});
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Google auth error:", error);
      setErrors({ form: "Failed to sign in with Google" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const spinner = (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mt-[-4rem] transition-colors">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'login' ? 'border-primary text-primary bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            onClick={() => { setActiveTab('login'); setErrors({}); }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'signup' ? 'border-primary text-primary bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            onClick={() => { setActiveTab('signup'); setErrors({}); }}
          >
            Sign Up
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
              {activeTab === 'login' ? 'Welcome Back!' : 'Create an Account'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {activeTab === 'login' ? 'Sign in to access your dashboard and register for events.' : 'Join EventSphere to discover and host campus events.'}
            </p>
          </div>

          {errors.form && (
            <div className="bg-red-50 text-danger p-3 rounded-lg text-sm mb-6 font-medium text-center border border-red-100">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {activeTab === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">👤</span>
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 border ${errors.name ? 'border-danger' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white`}
                    placeholder="John Doe"
                    disabled={loading}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-danger font-medium">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">✉️</span>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${errors.email ? 'border-danger' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white`}
                  placeholder="you@university.edu"
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-danger font-medium">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔒</span>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-2.5 border ${errors.password ? 'border-danger' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none text-sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-danger font-medium">{errors.password}</p>}
            </div>

            {activeTab === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <span className="text-gray-400">🔒</span>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 border ${errors.confirmPassword ? 'border-danger' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-sm bg-white dark:bg-gray-700 dark:text-white`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-danger font-medium">{errors.confirmPassword}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md hover:shadow-lg text-sm font-bold text-white bg-primary hover:bg-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {loading ? spinner : activeTab === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {googleLoading ? spinner : (
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                )}
                Google
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-sm">
            {activeTab === 'login' ? (
               <p className="text-gray-600 dark:text-gray-400">
                 Don&apos;t have an account?{' '}
                 <button onClick={() => { setActiveTab('signup'); setErrors({}); }} className="font-bold text-primary hover:text-blue-800 transition-colors">Sign up</button>
               </p>
            ) : (
               <p className="text-gray-600 dark:text-gray-400">
                 Already have an account?{' '}
                 <button onClick={() => { setActiveTab('login'); setErrors({}); }} className="font-bold text-primary hover:text-blue-800 transition-colors">Log in</button>
               </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
