import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateEvent() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    venue: '',
    capacity: '',
    registrationFormURL: '',
    attendeeNote: '',
    brochureLink: ''
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
    if (errors[e.target.name]) {
      setErrors({...errors, [e.target.name]: null});
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Event Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.category) newErrors.category = "Category is required";
    
    if (!formData.date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Ignore time for pure date compare
      if (selectedDate < today) {
        newErrors.date = "Date must be in the future";
      }
    }
    
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.venue.trim()) newErrors.venue = "Venue is required";
    
    if (formData.capacity && isNaN(parseInt(formData.capacity))) {
        newErrors.capacity = "Capacity must be a number";
    }

    if (formData.registrationFormURL && !/^https?:\/\/.+/.test(formData.registrationFormURL)) {
      newErrors.registrationFormURL = "Please enter a valid URL (http:// or https://)";
    }
    
    if (formData.brochureLink && !/^https?:\/\/.+/.test(formData.brochureLink)) {
      newErrors.brochureLink = "Please enter a valid URL (http:// or https://)";
    }

    setErrors(newErrors);
    
    // Automatically focus the first error element if any exist
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.getElementsByName(firstErrorKey)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      // 1-3. Build Payload
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date,
        time: formData.time,
        venue: formData.venue.trim(),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        registrationFormURL: formData.registrationFormURL.trim(),
        attendeeNote: formData.attendeeNote.trim(),
        brochureLink: formData.brochureLink.trim(),
        
        status: "pending",
        organizerId: currentUser.uid,
        organizerName: userData?.name || 'Organizer',
        organizerEmail: currentUser.email,
        registrationCount: 0,
        createdAt: serverTimestamp()
      };
      
      // Save Event
      const eventDoc = await addDoc(collection(db, 'events'), eventData);
      
      // 4. Admin notification
      await addDoc(collection(db, 'notifications'), {
        userId: "admin",
        message: `New event submitted: ${formData.title}`,
        link: "/admin",
        isRead: false,
        createdAt: serverTimestamp()
      });
      
      // 5-6. Success Flow
      setShowToast(true);
      setTimeout(() => {
        navigate('/dashboard', { state: { flashMessage: "Event submitted for review! You'll be notified once approved 🎉" } });
      }, 2000);
      
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-body">
      
      {/* Absolute Toast */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-success text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-green-500 w-[90%] max-w-lg mb-8">
          <span className="text-3xl">🎉</span>
          <p className="font-bold text-sm sm:text-base leading-tight">Event submitted for review! You'll be notified once approved.</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-heading font-extrabold text-gray-900 tracking-tight mb-2">Create New Event</h1>
          <p className="text-gray-500 text-lg">Fill in the details below to submit your event for approval.</p>
        </div>

        {/* Multi-Section Form */}
        <div className="bg-white px-6 py-8 sm:p-10 shadow-lg rounded-2xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* Section 1: Basic Info */}
            <section className="space-y-6">
              <h2 className="text-xl font-heading font-bold text-gray-900 border-b border-gray-100 pb-2">1. Basic Info</h2>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Event Title <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Annual Tech Symposium 2026"
                  disabled={loading}
                  className={`w-full px-4 py-3 bg-gray-50 border ${errors.title ? 'border-danger' : 'border-gray-300'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                />
                {errors.title && <p className="mt-1 text-xs text-danger font-medium">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description <span className="text-danger">*</span></label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What is this event about?"
                  rows="4"
                  disabled={loading}
                  className={`w-full px-4 py-3 bg-gray-50 border ${errors.description ? 'border-danger' : 'border-gray-300'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-y`}
                />
                {errors.description && <p className="mt-1 text-xs text-danger font-medium">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category <span className="text-danger">*</span></label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-4 py-3 bg-gray-50 border ${errors.category ? 'border-danger' : 'border-gray-300'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                >
                  <option value="" disabled>Select a category</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Technical">Technical</option>
                  <option value="Sports">Sports</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && <p className="mt-1 text-xs text-danger font-medium">{errors.category}</p>}
              </div>
            </section>

            {/* Section 2: Date & Location */}
            <section className="space-y-6">
              <h2 className="text-xl font-heading font-bold text-gray-900 border-b border-gray-100 pb-2">2. Date & Location</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date <span className="text-danger">*</span></label>
                  <input 
                    type="date" 
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.date ? 'border-danger' : 'border-gray-300'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-700`}
                  />
                  {errors.date && <p className="mt-1 text-xs text-danger font-medium">{errors.date}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Time <span className="text-danger">*</span></label>
                  <input 
                    type="time" 
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.time ? 'border-danger' : 'border-gray-300'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-700`}
                  />
                  {errors.time && <p className="mt-1 text-xs text-danger font-medium">{errors.time}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Venue <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="Room 401, Main Auditorium..."
                  disabled={loading}
                  className={`w-full px-4 py-3 bg-gray-50 border ${errors.venue ? 'border-danger' : 'border-gray-300'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                />
                {errors.venue && <p className="mt-1 text-xs text-danger font-medium">{errors.venue}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Capacity <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                <input 
                  type="number" 
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Leave empty for unlimited"
                  min="1"
                  disabled={loading}
                  className={`w-full px-4 py-3 bg-gray-50 border ${errors.capacity ? 'border-danger' : 'border-gray-300'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                />
                {errors.capacity && <p className="mt-1 text-xs text-danger font-medium">{errors.capacity}</p>}
              </div>
            </section>

            {/* Section 3: Registration */}
            <section className="space-y-6">
              <h2 className="text-xl font-heading font-bold text-gray-900 border-b border-gray-100 pb-2">3. Registration & Logistics</h2>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">External Form Link <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                <input 
                  type="url" 
                  name="registrationFormURL"
                  value={formData.registrationFormURL}
                  onChange={handleChange}
                  placeholder="https://forms.google.com/..."
                  disabled={loading}
                  className={`w-full px-4 py-3 bg-gray-50 border ${errors.registrationFormURL ? 'border-danger' : 'border-gray-300'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                />
                {errors.registrationFormURL && <p className="mt-1 text-xs text-danger font-medium">{errors.registrationFormURL}</p>}
                <p className="mt-1.5 text-xs text-gray-500">If provided, registering users will be redirected to this link.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Note for Attendees <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                <textarea 
                  name="attendeeNote"
                  value={formData.attendeeNote}
                  onChange={handleChange}
                  placeholder="Any instructions, dress code, what to bring..."
                  rows="2"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-y"
                />
              </div>
            </section>

            {/* Section 4: Brochure */}
            <section className="space-y-6">
              <h2 className="text-xl font-heading font-bold text-gray-900 border-b border-gray-100 pb-2">4. Brochure</h2>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Google Drive Link <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                <input 
                  type="url" 
                  name="brochureLink"
                  value={formData.brochureLink}
                  onChange={handleChange}
                  placeholder="Paste your Google Drive shareable link here"
                  disabled={loading}
                  className={`w-full px-4 py-3 bg-blue-50/50 border ${errors.brochureLink ? 'border-danger' : 'border-blue-200'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                />
                {errors.brochureLink && <p className="mt-1 text-xs text-danger font-medium">{errors.brochureLink}</p>}
                <p className="mt-2 text-xs text-gray-500 font-medium">💡 Upload your brochure to Google Drive, set sharing to "Anyone with link", then paste the link here.</p>
              </div>
            </section>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row-reverse gap-4">
               <button 
                 type="submit"
                 disabled={loading}
                 className="flex-1 bg-primary text-white font-bold py-3.5 px-6 rounded-xl hover:bg-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none"
               >
                 {loading ? (
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                 ) : "Submit Event for Review"}
               </button>
               <button 
                 type="button"
                 onClick={() => navigate('/feed')}
                 disabled={loading}
                 className="sm:w-32 bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 font-bold py-3.5 px-6 rounded-xl transition-all"
               >
                 Cancel
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
