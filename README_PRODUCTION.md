# 🚛 Fleet Guardian AI - Production Ready Setup

A professional, enterprise-grade fleet management system with AI-powered predictions, voice assistant, real-time GPS tracking, and comprehensive analytics.

## ✨ Features

### Core Features
- ✅ **Real-time Fleet Management** - Live vehicle tracking and status monitoring
- ✅ **AI-Powered Predictions** - ML-based vehicle health scoring and maintenance predictions
- ✅ **Voice Assistant** - Google Assistant-style audio orb for hands-free operation
- ✅ **GPS Integration** - Real-time location tracking with route visualization
- ✅ **Professional Analytics** - Comprehensive dashboards and reports
- ✅ **Firebase Backend** - Scalable cloud database and authentication

### Advanced Features
- 🤖 **Gemini AI Integration** - Advanced contextual analysis and recommendations
- 🎙️ **Voice Command** - Natural language processing via Groq
- 📊 **Predictive Analytics** - Machine learning-based vehicle health predictions
- 🗺️ **GPS Tracking** - Real-time location monitoring
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- 🌓 **Dark/Light Mode** - System-wide theme switching
- 🔒 **Role-Based Access** - Admin, Manager, Operator, Viewer roles

## 🚀 Quick Start

### 1. Automated Firebase Setup
```bash
cd scripts
npm run setup
```

This will:
- Connect to your Firebase project
- Create the first admin user
- Add sample vehicles and alerts
- Configure all environment variables

### 2. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:8080`

### 3. Login
- **Email**: Your registered admin email
- **Password**: Your admin password

## 📋 Project Structure

```
src/
├── components/
│   ├── dashboard/        # Dashboard widgets and cards
│   ├── layout/           # Header, Sidebar, main layout
│   ├── voice/            # Professional AudioOrb voice assistant
│   ├── views/            # Page views (Vehicles, Alerts, etc.)
│   └── ui/               # shadcn/ui components
├── context/
│   ├── AuthContext.tsx   # Authentication with Firebase Auth
│   ├── DataContext.tsx   # Real-time data from Firestore
│   └── VehicleContext.tsx # Vehicle-specific data
├── services/
│   ├── firebase.ts       # Firebase initialization
│   ├── firebaseAuth.ts   # Authentication service
│   ├── firestoreService.ts # Database operations
│   ├── storageService.ts # File uploads (IndexedDB fallback)
│   ├── voiceAssistant.ts # Voice recognition/synthesis
│   ├── geminiService.ts  # Google Gemini AI
│   └── mlEngine.ts       # Vehicle health predictions
├── pages/
│   ├── Index.tsx         # Dashboard home
│   └── NotFound.tsx      # 404 page
└── types/
    └── vehicle.ts        # TypeScript interfaces
```

## 🔐 Authentication

### Supported Auth Methods
- ✅ Email/Password (Primary)
- ✅ Google Sign-In (Optional)
- ✅ Custom JWT (Optional)

### Role-Based Permissions
```
Admin
  ├─ Manage users
  ├─ Full vehicle control
  ├─ Generate reports
  └─ Configure system

Manager
  ├─ View all vehicles
  ├─ Create/update trips
  ├─ Generate reports
  └─ Cannot modify settings

Operator
  ├─ View assigned vehicles
  ├─ Record trips
  └─ View basic analytics

Viewer
  ├─ Read-only access
  └─ View dashboards only
```

## 📊 Data Structure

### Vehicles Collection
```typescript
{
  id: string;
  name: string;
  type: 'bus' | 'truck' | 'van' | 'car';
  licensePlate: string;
  status: 'operational' | 'warning' | 'critical' | 'maintenance';
  healthScore: number; // 0-100
  mileage: number;
  fuelEfficiency: number;
  driver: string;
  location: { lat: number; lng: number };
  sensors: {
    engineTemp: number;
    oilPressure: number;
    tirePressure: { fl: number; fr: number; rl: number; rr: number };
    batteryVoltage: number;
    fuelLevel: number;
  };
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}
```

### Alerts Collection
```typescript
{
  vehicleId: string;
  vehicleName: string;
  type: 'prediction' | 'anomaly' | 'threshold' | 'maintenance';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  component: string;
  probability: number;
  timestamp: Timestamp;
  acknowledged: boolean;
}
```

## 🎙️ Voice Assistant

### Features
- Natural language commands
- Vehicle search by name/plate
- Alert status queries
- Report generation requests
- Maintenance predictions

### Example Commands
- "Show me the status of vehicle TRK-001"
- "What alerts do I have?"
- "Generate a weekly report"
- "Which vehicles need maintenance?"

## 🧠 ML Predictions

### Health Score Calculation
```
health_score = base_score(100)
  - engine_temp_penalty(0-15)
  - oil_pressure_penalty(0-10)
  - tire_wear_penalty(0-20)
  - battery_penalty(0-15)
  - age_factor(0-10)
  - mileage_factor(0-15)
```

### Prediction Types
- **Engine Failure**: Based on temperature and pressure trends
- **Tire Issues**: Calculated from pressure and wear patterns
- **Battery Problems**: Voltage and age analysis
- **Fuel System**: Efficiency trend analysis
- **Brake Wear**: Mileage and usage patterns

## 🗺️ GPS Tracking

### Real-time Features
- Live vehicle location updates
- Route visualization
- Speed monitoring
- Geofence alerts
- Historical trip data

## 📈 Analytics & Reports

### Available Reports
- Fleet Summary Report
- Vehicle Health Report
- Maintenance Schedule
- Driver Performance
- Fuel Efficiency Report
- Trip Analysis
- Predictive Maintenance

### Export Formats
- PDF
- CSV
- Excel

## 🔧 Configuration

### Environment Variables (`.env`)
```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET= # Optional (can be empty for free tier)
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# AI Services
VITE_GOOGLE_API_KEY= # For Gemini AI
VITE_GROQ_API_KEY=   # For Voice Assistant
```

### Firebase Configuration
All Firebase setup is handled by the automated setup script. No manual configuration needed!

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Vercel
```bash
npm run build
vercel
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

## 📱 Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 UI/UX Highlights

### Design Philosophy
- **Google-inspired**: Clean, minimal interface
- **Apple-like**: Smooth animations and transitions
- **Professional**: Enterprise-grade appearance
- **Responsive**: Mobile-first design approach
- **Accessible**: WCAG 2.1 AA compliant

### Key UI Components
- **Dashboard Cards**: Vehicle status at a glance
- **Real-time Charts**: Trends and analytics
- **Modal Dialogs**: Detailed vehicle information
- **Data Tables**: Sortable and filterable lists
- **Map Integration**: GPS visualization
- **Search Bar**: Cmd+K powered search

## 🔄 Data Flow

```
Firebase Firestore
    ↓
DataContext (React Context)
    ↓
Components + Hooks
    ↓
UI Rendering
    ↓
User Interaction
    ↓
Voice Assistant / Manual Input
    ↓
AI Services (Gemini, Groq)
    ↓
Update Firestore
```

## 📦 Dependencies

### Core
- React 18
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui

### Backend
- Firebase SDK
- Firestore
- Firebase Auth

### AI & Voice
- Google Gemini API
- Groq API
- Web Speech API

### Utilities
- React Router
- React Query
- Lucide Icons
- Recharts

## 🐛 Troubleshooting

### "Firebase not configured"
- Ensure `.env` file has all Firebase variables
- Restart development server
- Check Firebase Console for valid credentials

### Voice Assistant not working
- Check browser permission for microphone
- Verify `VITE_GOOGLE_API_KEY` is set
- Use HTTPS (required for Web Audio API in production)

### GPS not showing
- Check browser location permission
- Verify vehicle data has `location` field
- Check browser console for errors

### Data not syncing
- Check Firebase Firestore rules are published
- Verify user is authenticated
- Check user role has required permissions

## 📞 Support & Documentation

- **Firebase Docs**: https://firebase.google.com/docs
- **Gemini API**: https://ai.google.dev/
- **Groq API**: https://console.groq.com
- **React Router**: https://reactrouter.com

## 📝 License

Proprietary - Fleet Guardian AI

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: Production Ready ✅
