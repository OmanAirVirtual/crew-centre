# Oman Air Virtual - Crew Center

A comprehensive MERN stack application for managing a virtual airline crew center with PIREP submission, route management, live flight tracking, and pilot certification exams.

## Features

- **User Authentication**: Secure registration and login system
- **PIREP Submission**: Submit and manage flight reports
- **Route Management**: View routes and codeshare routes
- **Live Flight Tracking**: Real-time tracking with Infinite Flight API integration
- **Pilot Exams**: Certification system for new pilots
- **Admin Dashboard**: Role-based admin access for management
- **Beautiful UI**: Modern, responsive design with gradient themes

## Tech Stack

- **Frontend**: React 18, React Router, Axios, Leaflet (maps), Recharts (charts)
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **API Integration**: Infinite Flight API for live tracking

## Installation

1. **Install backend dependencies:**
```bash
npm install
```

2. **Install frontend dependencies:**
```bash
cd frontend
npm install
cd ..
```

3. **Set up environment variables:**
Create a `.env` file in the root directory:
```
MONGODB_URI=mongodb://localhost:27017/oman-air-virtual
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
INFINITE_FLIGHT_API_KEY=your-infinite-flight-api-key-here
```

4. **Start MongoDB:**
Make sure MongoDB is running on your system.

5. **Run the application:**
```bash
# Development mode (runs both backend and frontend)
npm run dev

# Or run separately:
# Backend only
npm run server

# Frontend only (in another terminal)
npm run client
```

## Admin Roles

The following roles have admin access:
- CEO
- CAO (Chief Administrative Officer)
- CMO (Chief Marketing Officer)
- CFI (Chief Flight Instructor)
- Recruiter
- Routes Manager
- Crew Centre Manager

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### PIREPs
- `POST /api/pireps` - Submit PIREP
- `GET /api/pireps` - Get all PIREPs (filtered by user role)
- `GET /api/pireps/:id` - Get single PIREP
- `PATCH /api/pireps/:id/review` - Review PIREP (admin only)

### Routes
- `GET /api/routes` - Get all routes
- `GET /api/routes/:id` - Get single route
- `POST /api/routes` - Create route (admin only)
- `PUT /api/routes/:id` - Update route (admin only)
- `DELETE /api/routes/:id` - Delete route (admin only)

### Tracking
- `GET /api/tracking/live` - Get live flight tracking data
- `GET /api/tracking/flight/:callsign` - Get specific flight tracking

### Exams
- `GET /api/exams` - Get all exams
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams/:id/attempt` - Submit exam attempt
- `GET /api/exams/attempts/my` - Get user's exam attempts
- `POST /api/exams` - Create exam (admin only)

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `PATCH /api/admin/users/:id/role` - Update user role (admin only)
- `PATCH /api/admin/users/:id/status` - Update user status (admin only)
- `GET /api/admin/stats` - Get dashboard statistics (admin only)

## Project Structure

```
crew/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── App.js       # Main app component
│   └── public/          # Static files
└── package.json         # Root package.json
```

## License

ISC
