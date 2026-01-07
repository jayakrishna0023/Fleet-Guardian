# Firebase Setup Guide for Fleet Guardian AI

This guide walks you through setting up Firebase for authentication, database, and storage.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or select an existing one)
3. Enter a project name (e.g., "Fleet Guardian AI")
4. Enable/disable Google Analytics as preferred
5. Click **"Create project"**

## Step 2: Enable Authentication

1. In your Firebase project, go to **Build > Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"** provider
5. (Optional) Enable other providers like Google, Microsoft, etc.

## Step 3: Create Firestore Database

1. Go to **Build > Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll set rules later)
4. Select a location close to your users
5. Click **"Enable"**

### Set Firestore Security Rules

Go to **Firestore > Rules** and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Vehicles collection - authenticated users can read, managers+ can write
    match /vehicles/{vehicleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }
    
    // Alerts collection
    match /alerts/{alertId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Trips collection
    match /trips/{tripId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Telemetry collection
    match /telemetry/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Create Firestore Indexes

Go to **Firestore > Indexes** and create these composite indexes:

1. **vehicles** collection:
   - Fields: `name` (Ascending)

2. **alerts** collection:
   - Fields: `timestamp` (Descending)
   - Fields: `vehicleId` (Ascending), `timestamp` (Descending)

3. **trips** collection:
   - Fields: `vehicleId` (Ascending), `timestamp` (Descending)

## Step 4: Create Storage Bucket

1. Go to **Build > Storage**
2. Click **"Get started"**
3. Choose **"Start in production mode"**
4. Select same location as Firestore
5. Click **"Done"**

### Set Storage Security Rules

Go to **Storage > Rules** and update with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper function to check auth
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // User avatars - users can manage their own
    match /users/avatars/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Vehicle images and documents
    match /vehicles/{type}/{vehicleId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // Data uploads
    match /uploads/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // Reports
    match /reports/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
```

## Step 5: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click **"Add app"** > **Web** (</> icon)
4. Register the app with a nickname
5. Copy the configuration object

## Step 6: Configure Environment Variables

Create or update your `.env` file with the Firebase config:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# AI Services
VITE_GOOGLE_API_KEY=your_gemini_api_key
VITE_GROQ_API_KEY=your_groq_api_key
```

## Step 7: Create Initial Admin User

After deployment, you need to create the first admin user:

### Option A: Using Firebase Console

1. Go to **Authentication > Users**
2. Click **"Add user"**
3. Enter email and password
4. Copy the **User UID**
5. Go to **Firestore > users**
6. Create a document with ID = User UID
7. Add fields:
   ```json
   {
     "email": "admin@yourcompany.com",
     "name": "System Administrator",
     "role": "admin",
     "createdAt": <server timestamp>,
     "lastLogin": <server timestamp>,
     "settings": {
       "notifications": true,
       "twoFactorEnabled": false,
       "theme": "dark"
     }
   }
   ```

### Option B: Using Firebase Admin SDK (for backend)

Create a Node.js script:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createAdmin() {
  // Create auth user
  const user = await admin.auth().createUser({
    email: 'admin@yourcompany.com',
    password: 'SecurePassword123!',
    displayName: 'System Administrator'
  });

  // Create Firestore profile
  await admin.firestore().collection('users').doc(user.uid).set({
    email: 'admin@yourcompany.com',
    name: 'System Administrator',
    role: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    settings: {
      notifications: true,
      twoFactorEnabled: false,
      theme: 'dark'
    }
  });

  console.log('Admin user created:', user.uid);
}

createAdmin();
```

## Step 8: Test the Connection

1. Start the development server: `npm run dev`
2. Open the browser console
3. You should see: `Data mode: Firebase Firestore` and `Auth mode: Firebase Auth`
4. Try logging in with the admin credentials

## Troubleshooting

### "Firebase not configured" errors
- Check that all environment variables are set correctly
- Restart the dev server after changing `.env`

### "Permission denied" errors
- Verify Firestore/Storage security rules are deployed
- Check that the user's role in Firestore matches expected permissions

### Empty vehicle/alert lists
- This is normal for a new database
- Add vehicles using the "Add Vehicle" feature
- Use the Upload page to import CSV/JSON data

### Authentication errors
- Ensure Email/Password provider is enabled
- Check that user exists in both Authentication and Firestore

## Data Structure

### Users Collection (`/users/{userId}`)
```typescript
{
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  phone?: string;
  avatar?: string;
  department?: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  settings?: {
    notifications: boolean;
    twoFactorEnabled: boolean;
    theme: 'dark' | 'light' | 'system';
  };
}
```

### Vehicles Collection (`/vehicles/{vehicleId}`)
```typescript
{
  name: string;
  type: 'truck' | 'van' | 'bus' | 'car';
  licensePlate: string;
  make?: string;
  model?: string;
  year?: number;
  status: 'operational' | 'warning' | 'critical' | 'maintenance';
  healthScore: number;
  mileage?: number;
  fuelEfficiency?: number;
  driver?: string;
  location?: { lat: number; lng: number };
  sensors?: {
    engineTemp?: number;
    oilPressure?: number;
    tirePressure?: { fl: number; fr: number; rl: number; rr: number };
    batteryVoltage?: number;
    fuelLevel?: number;
  };
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}
```

### Alerts Collection (`/alerts/{alertId}`)
```typescript
{
  vehicleId: string;
  vehicleName?: string;
  type: 'prediction' | 'anomaly' | 'threshold' | 'maintenance';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  component?: string;
  probability?: number;
  timestamp: Timestamp;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Timestamp;
}
```

## Next Steps

After Firebase setup:

1. **Import existing data**: Use the Upload page to import vehicle data from CSV/JSON
2. **Add team members**: Create users with appropriate roles
3. **Configure alerts**: Set up alert thresholds in the Predictions view
4. **Deploy to production**: Run `npm run build` and deploy to Firebase Hosting or Vercel
