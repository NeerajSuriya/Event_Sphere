import { useState } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { sendRegistrationConfirmedEmail } from '../services/emailService';

export default function RegistrationModal({ event, isOpen, onClose, onSuccess }) {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use uncontrolled or derived state for initial values
  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      setError("Please fill in all fields.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Save to Firestore registrations collection
      await addDoc(collection(db, 'registrations'), {
        userId: currentUser.uid,
        userEmail: email,
        userName: name,
        eventId: event.id,
        eventName: event.title,
        registeredAt: serverTimestamp()
      });
      
      // 2. Increment event registrationCount by 1
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        registrationCount: increment(1)
      });
      
      // 3. Call sendRegistrationConfirmedEmail
      try {
        await sendRegistrationConfirmedEmail(email, name, event);
      } catch (emErr) {
        console.error("Failed to send confirmation email", emErr);
        // Do not crash the process if EmailJS fails initially
      }
      
      // 4. Open registrationFormURL in new tab automatically if it exists
      if (event.registrationFormURL) {
        const url = event.registrationFormURL.startsWith('http') ? event.registrationFormURL : `https://${event.registrationFormURL}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      
      // 5. & 6. Close modal and trigger success toast handler
      onSuccess();
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to complete registration. Please try again.");
    } finally {
      if(isOpen) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blur Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      ></div>
      
      {/* Centered White Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up transition-colors">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-between items-center transition-colors">
          <h3 className="font-heading font-bold text-gray-900 dark:text-white line-clamp-1 pr-4 tracking-tight">Register for {event.title}</h3>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none">
            ✕
          </button>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 text-danger text-sm p-3 rounded-lg border border-red-100 font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all text-gray-900 dark:text-white"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all text-gray-500 dark:text-gray-400"
                disabled={true} // Email should generally be locked to their account
                required
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">A confirmation will be sent to your email.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-lg hover:bg-blue-800 transition-colors flex justify-center items-center shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Confirm Registration"}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="text-gray-500 dark:text-gray-400 font-medium text-sm hover:text-gray-700 dark:hover:text-gray-200 hover:underline py-2 transition-colors mt-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
