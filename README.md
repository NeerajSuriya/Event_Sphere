# Event Sphere

Event Sphere is a modern event management platform that enables students, organizers, and administrators to discover, create, manage, and participate in campus events. The platform streamlines event registration, approval workflows, notifications, and event tracking through an intuitive interface.

## Features

### For Participants
- Browse approved events
- Search and filter events by category and date
- View detailed event information
- Register for events
- Track registered events
- Receive event notifications

### For Organizers
- Create and submit new events
- Manage created events
- Monitor registrations
- Upload event brochures and registration links
- Receive approval/rejection updates

### For Administrators
- Review event submissions
- Approve or reject events
- Manage users
- Send announcements to all users
- View platform statistics and analytics

## Tech Stack

### Frontend
- React 19
- React Router DOM
- Tailwind CSS
- Vite

### Backend & Database
- Firebase Authentication
- Firebase Firestore

### Additional Services
- EmailJS (Email Notifications)
- React Hot Toast
- React Icons

## Project Structure

```text
src/
├── components/
│   ├── EventCard.jsx
│   ├── Navbar.jsx
│   ├── NotificationBell.jsx
│   ├── RegistrationModal.jsx
│   ├── ScrollToTop.jsx
│   └── StatusBadge.jsx
│
├── context/
│   ├── AuthContext.jsx
│   └── ThemeContext.jsx
│
├── pages/
│   ├── Landing.jsx
│   ├── Login.jsx
│   ├── EventFeed.jsx
│   ├── EventDetail.jsx
│   ├── CreateEvent.jsx
│   ├── UserDashboard.jsx
│   ├── AdminDashboard.jsx
│   └── NotFound.jsx
│
├── services/
│   ├── firebase.js
│   └── emailService.js
│
└── utils/
    └── roleGuard.jsx
```

## User Roles

### User
- Browse events
- Register for events
- View registrations
- Receive notifications

### Organizer
- Create event requests
- Track submitted events
- Manage event details

### Admin
- Approve or reject event requests
- Manage users
- Broadcast announcements
- Monitor platform activity

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Event_Sphere
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a Firebase project and enable:
- Authentication
- Firestore Database

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Configure EmailJS

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### 5. Start Development Server

```bash
npm run dev
```

Application will be available at:

```text
http://localhost:5173
```

## Build for Production

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Core Modules

### Event Feed
- Search functionality
- Category filters
- Date-based filters
- Event cards

### Event Registration
- Register for events
- Track registration status
- View event details

### Admin Dashboard
- Event moderation
- User management
- Announcement system
- Platform insights

### User Dashboard
- Created events
- Registered events
- Notifications

## Database Collections

### users

```json
{
  "uid": "string",
  "name": "string",
  "email": "string",
  "role": "user",
  "isBanned": false
}
```

### events

```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "date": "string",
  "time": "string",
  "venue": "string",
  "capacity": "number",
  "status": "pending"
}
```

### registrations

```json
{
  "eventId": "string",
  "userId": "string",
  "registeredAt": "timestamp"
}
```

### notifications

```json
{
  "title": "string",
  "message": "string",
  "createdAt": "timestamp"
}
```

## Future Enhancements

- QR-based event check-in
- Attendance tracking
- Event analytics dashboard
- Certificate generation
- Real-time notifications
- Event recommendations
- Mobile application support

## Contributors

Developed as a campus event management solution to simplify event discovery, registration, and administration.

## License

This project is intended for educational and academic purposes.
