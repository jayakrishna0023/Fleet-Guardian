# 🔥 Firebase Setup Guide for Fleet Guardian AI

This guide will walk you through setting up Firebase for your Fleet Guardian AI application step-by-step.

## Table of Contents
1. [Create Firebase Project](#1-create-firebase-project)
2. [Enable Authentication](#2-enable-authentication)
3. [Create Firestore Database](#3-create-firestore-database)
4. [Create Cloud Storage](#4-create-cloud-storage)
5. [Get Configuration Keys](#5-get-configuration-keys)
6. [Configure Environment Variables](#6-configure-environment-variables)
7. [Set Up Security Rules](#7-set-up-security-rules)
8. [Initialize Data](#8-initialize-data)
9. [Deploy to Production](#9-deploy-to-production)

---

## 1. Create Firebase Project

### Step 1.1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account

### Step 1.2: Create a New Project
1. Click **"Create a project"** or **"Add project"**
2. Enter a project name: `fleet-guardian-ai` (or your preferred name)
3. (Optional) Enable Google Analytics - recommended for production
4. Click **"Create project"**
5. Wait for the project to be created, then click **"Continue"**

---

## 2. Enable Authentication

### Step 2.1: Navigate to Authentication
1. In the Firebase Console, select your project
2. Click **"Build"** in the left sidebar
3. Select **"Authentication"**

### Step 2.2: Enable Email/Password Provider
1. Click **"Get started"**
2. Go to the **"Sign-in method"** tab
3. Click on **"Email/Password"**
4. Toggle **"Enable"** to ON
5. (Optional) Enable **"Email link (passwordless sign-in)"**
6. Click **"Save"**

### Step 2.3: (Optional) Enable Additional Providers
You can also enable:
- Google Sign-In
- Phone Authentication
- Microsoft/Apple/GitHub etc.

---

## 3. Create Firestore Database

### Step 3.1: Navigate to Firestore
1. In Firebase Console, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**

### Step 3.2: Choose Security Mode
1. Select **"Start in test mode"** (for development)
   - ⚠️ Note: Test mode allows anyone to read/write for 30 days
   - We'll set up proper rules later
2. Click **"Next"**

### Step 3.3: Choose Location
1. Select a Cloud Firestore location closest to your users
   - `us-central` - United States
   - `europe-west` - Europe
   - `asia-south1` - India
   - etc.
2. Click **"Enable"**

---

## 4. Create Cloud Storage

### Step 4.1: Navigate to Storage
1. In Firebase Console, click **"Build"** → **"Storage"**
2. Click **"Get started"**

### Step 4.2: Set Up Storage
1. Accept the security rules warning
2. Choose the same location as your Firestore database
3. Click **"Done"**

---

## 5. Get Configuration Keys

### Step 5.1: Register a Web App
1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. Enter an app nickname: `fleet-guardian-web`
6. (Optional) Check "Also set up Firebase Hosting"
7. Click **"Register app"**

### Step 5.2: Copy Configuration
You'll see a code snippet like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXXX"
};
```

**Save these values!** You'll need them for the next step.

---

## 6. Configure Environment Variables

### Step 6.1: Create .env File
In your project root directory, create a `.env` file:

```bash
# Copy from .env.example and fill in your values
cp .env.example .env
```

### Step 6.2: Add Firebase Config
Edit the `.env` file and add your Firebase configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyD...your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# AI Services (Optional)
VITE_GOOGLE_API_KEY=your-gemini-api-key
VITE_GROQ_API_KEY=your-groq-api-key
```

### Step 6.3: Restart Development Server
```bash
npm run dev
```

---

## 7. Set Up Security Rules

### Step 7.1: Firestore Security Rules
1. Go to **Firestore Database** → **Rules** tab
2. Replace with these production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Helper function to check user role from Firestore
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    // Check if user is admin (via role OR hardcoded email for bootstrapping)
    function isAdmin() {
      return (isAuthenticated() && 
             (hasRole('admin') || request.auth.token.email == 'admin@fleetai.com'));
    }
    
    function isManagerOrAbove() {
      return isAdmin() || hasRole('manager');
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own profile, Admins can read all
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      // Users can update their own profile (except role)
      allow update: if isAuthenticated() && isOwner(userId) && 
        (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']));
      // Only admins can create users (manual) or change roles
      allow create, delete: if isAuthenticated() && isAdmin();
      // Admins can update any user fully
      allow update: if isAuthenticated() && isAdmin();
    }
    
    // Vehicle Requests collection (Critical Fix)
    match /vehicle_requests/{requestId} {
      // Allow any authenticated user to read/create requests
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      // Only admins can update status (approve/reject)
      allow update: if isAuthenticated() && isAdmin();
      allow delete: if isAuthenticated() && isAdmin();
    }

    // Vehicle Requests (legacy/alternative collection name if used)
    match /vehicleRequests/{requestId} {
      allow read, create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && isAdmin();
    }
    
    // Vehicles collection (Production-Ready with Owner-Based Access)
    match /vehicles/{vehicleId} {
      // Users can read their own vehicles, admins/managers can read all
      allow read: if isAuthenticated() && (
        isManagerOrAbove() || 
        resource.data.ownerId == request.auth.uid
      );
      // Users can create vehicles they own
      allow create: if isAuthenticated() && (
        isManagerOrAbove() || 
        request.resource.data.ownerId == request.auth.uid
      );
      // Users can update their own vehicles, managers can update any
      allow update: if isAuthenticated() && (
        isManagerOrAbove() || 
        resource.data.ownerId == request.auth.uid
      );
      // Only admins can delete vehicles
      allow delete: if isAuthenticated() && isAdmin();
    }
    
    // Alerts collection
    match /alerts/{alertId} {
      // Authenticated users can read alerts
      allow read: if isAuthenticated();
      // Authenticated users can create and update alerts
      allow create, update: if isAuthenticated();
      // Only admins can delete alerts
      allow delete: if isAuthenticated() && isAdmin();
    }
    
    // Trips collection
    match /trips/{tripId} {
      // Authenticated users can read trips
      allow read: if isAuthenticated();
      // Managers and above can create trips
      allow create: if isAuthenticated() && isManagerOrAbove();
      // Only admins can update/delete trips
      allow update, delete: if isAuthenticated() && isAdmin();
    }
    
    // Telemetry collection (read-heavy, write-restricted)
    match /telemetry/{telemetryId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isManagerOrAbove();
    }
    
    // Reports collection
    match /reports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && isAdmin();
    }
  }
}
```

3. Click **"Publish"**

### Step 7.2: Storage Security Rules
1. Go to **Storage** → **Rules** tab
2. Replace with these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isValidImageType() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isValidDocType() {
      return request.resource.contentType.matches('application/pdf') ||
             request.resource.contentType.matches('text/csv') ||
             request.resource.contentType.matches('application/json');
    }
    
    function isUnder10MB() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // User avatars
    match /users/avatars/{userId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && 
                      request.auth.uid == userId && 
                      isValidImageType() && 
                      isUnder10MB();
      allow delete: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Vehicle images
    match /vehicles/images/{vehicleId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isValidImageType() && isUnder10MB();
      allow delete: if isAuthenticated();
    }
    
    // Vehicle documents
    match /vehicles/documents/{vehicleId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isValidDocType() && isUnder10MB();
      allow delete: if isAuthenticated();
    }
    
    // Data uploads
    match /uploads/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isValidDocType() && isUnder10MB();
      allow delete: if isAuthenticated();
    }
    
    // Reports
    match /reports/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
```

3. Click **"Publish"**

---

## 8. Initialize Data

### Step 8.1: Create First Admin User
After setting up Firebase, you'll need to create the first admin user:

1. Start your app: `npm run dev`
2. Go to the Register page
3. Create an account with your email
4. Go to Firebase Console → Firestore
5. Find your user document in the `users` collection
6. Edit the document and change `role` from `"viewer"` to `"admin"`

### Step 8.2: Add Initial Vehicles (Optional)
You can add vehicles through:
- The Fleet Guardian UI (Vehicles → Add Vehicle)
- Firebase Console directly
- Import via the Upload page

---

## 9. Deploy to Production

### Step 9.1: Build for Production
```bash
npm run build
```

### Step 9.2: Deploy Options

#### Option A: Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Deploy
firebase deploy --only hosting
```

#### Option B: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

#### Option C: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Step 9.3: Set Environment Variables in Production
Make sure to add all your `.env` variables to your hosting platform's environment configuration.

---

## 📁 Database Structure

Here's the Firestore collections structure used by Fleet Guardian:

```
firestore/
├── users/
│   └── {userId}/
│       ├── email: string
│       ├── name: string
│       ├── role: "admin" | "manager" | "operator" | "viewer"
│       ├── phone?: string
│       ├── avatar?: string (Storage URL)
│       ├── createdAt: timestamp
│       ├── lastLogin: timestamp
│       └── settings: {
│           notifications: boolean,
│           twoFactorEnabled: boolean,
│           theme: "dark" | "light" | "system"
│       }
│
├── vehicles/
│   └── {vehicleId}/
│       ├── name: string
│       ├── type: "bus" | "truck" | "van" | "car"
│       ├── licensePlate: string
│       ├── make?: string
│       ├── model?: string
│       ├── year?: number
│       ├── driver?: string
│       ├── healthScore: number (0-100)
│       ├── status: "operational" | "warning" | "critical" | "maintenance"
│       ├── mileage: number
│       ├── fuelEfficiency: number
│       ├── location?: { lat: number, lng: number }
│       ├── sensors?: { ... }
│       ├── lastUpdated: timestamp
│       └── createdAt: timestamp
│
├── alerts/
│   └── {alertId}/
│       ├── vehicleId: string
│       ├── vehicleName: string
│       ├── severity: "critical" | "warning" | "info"
│       ├── type: string
│       ├── title: string
│       ├── message: string
│       ├── component?: string
│       ├── probability?: number
│       ├── timestamp: timestamp
│       ├── acknowledged: boolean
│       ├── acknowledgedBy?: string
│       └── acknowledgedAt?: timestamp
│
├── trips/
│   └── {tripId}/
│       ├── vehicleId: string
│       ├── timestamp: timestamp
│       ├── mileage: number
│       ├── duration: number
│       ├── averageSpeed: number
│       ├── fuelEfficiency: number
│       └── ... other trip data
│
└── telemetry/
    └── {telemetryId}/
        ├── vehicleId: string
        ├── timestamp: timestamp
        ├── engineTemp: number
        ├── oilPressure: number
        ├── batteryVoltage: number
        └── ... other sensor data
```

---

## 🛟 Troubleshooting

### "Firebase not configured" message
- Ensure all `VITE_FIREBASE_*` environment variables are set
- Restart the development server after adding env variables

### "Permission denied" errors
- Check that the user is authenticated
- Verify the Firestore security rules are published
- Check the user's role in the users collection

### Storage upload fails
- Verify file size is under 10MB
- Check file type matches allowed types
- Ensure Storage security rules are published

### Authentication not working
- Verify Email/Password provider is enabled
- Check the API key and auth domain are correct
- Look for errors in browser console

---

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Firebase Console shows the correct configuration
3. Ensure all security rules are published
4. Check that environment variables are correct

---

**Happy Fleet Managing! 🚛**
