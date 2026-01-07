import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Load .env
const envPath = path.join(rootDir, '.env');
let config = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^(VITE_\w+)=(.+)$/);
    if (match) {
      config[match[1]] = match[2].trim();
    }
  });
}

const firebaseConfig = {
  apiKey: config.VITE_FIREBASE_API_KEY,
  authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.VITE_FIREBASE_APP_ID,
  measurementId: config.VITE_FIREBASE_MEASUREMENT_ID,
};

async function main() {
  console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔧  Fleet Guardian AI - Data Fix & Cleanup Tool    🧹   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`));

  if (!firebaseConfig.apiKey) {
    console.error(chalk.red('Error: Firebase configuration not found in .env file.'));
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Login
  const email = 'admin@fleetai.com';
  const password = 'admin123';
  console.log(chalk.blue(`Logging in as ${email}...`));

  const spinner = ora('Logging in...').start();
  let user;
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    user = credential.user;
    spinner.succeed('Logged in successfully!');
  } catch (error) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      spinner.text = 'User not found or password wrong. Attempting to create user...';
      try {
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        user = credential.user;
        spinner.succeed('User created and logged in!');
      } catch (createError) {
        if (createError.code === 'auth/email-already-in-use') {
           spinner.fail('User exists but password is wrong. Please reset password in Firebase Console.');
           process.exit(1);
        }
        spinner.fail(`Failed to create user: ${createError.message}`);
        process.exit(1);
      }
    } else {
      spinner.fail(`Login failed: ${error.message}`);
      process.exit(1);
    }
  }

  // 1. Check/Fix User Profile
  const profileSpinner = ora('Checking user profile...').start();
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      profileSpinner.text = 'Profile missing. Creating...';
      await setDoc(userDocRef, {
        email: user.email,
        name: user.displayName || 'System Administrator',
        role: 'admin',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        settings: {
          notifications: true,
          twoFactorEnabled: false,
          theme: 'dark'
        }
      });
      profileSpinner.succeed('User profile created!');
    } else {
      profileSpinner.succeed('User profile exists.');
    }
  } catch (error) {
    profileSpinner.fail(`Error checking profile: ${error.message}`);
    console.log(chalk.yellow('Hint: Check your Firestore Rules in Firebase Console.'));
  }

  // 2. Fix Duplicate Vehicles
  const vehicleSpinner = ora('Checking for duplicate vehicles...').start();
  try {
    const vehiclesRef = collection(db, 'vehicles');
    const snapshot = await getDocs(vehiclesRef);
    
    const vehiclesByName = {};
    const duplicates = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const name = data.name || data.licensePlate || 'Unknown';
      if (!vehiclesByName[name]) {
        vehiclesByName[name] = [];
      }
      vehiclesByName[name].push({ id: doc.id, ...data });
    });

    for (const name in vehiclesByName) {
      const list = vehiclesByName[name];
      if (list.length > 1) {
        // Keep the one with the most recent lastUpdated, or the first one
        // Sort by lastUpdated desc
        list.sort((a, b) => {
          const timeA = a.lastUpdated?.toMillis?.() || 0;
          const timeB = b.lastUpdated?.toMillis?.() || 0;
          return timeB - timeA;
        });
        
        // Mark others for deletion
        for (let i = 1; i < list.length; i++) {
          duplicates.push(list[i]);
        }
      }
    }

    if (duplicates.length > 0) {
      vehicleSpinner.text = `Found ${duplicates.length} duplicates. Removing...`;
      for (const dup of duplicates) {
        await deleteDoc(doc(db, 'vehicles', dup.id));
      }
      vehicleSpinner.succeed(`Removed ${duplicates.length} duplicate vehicles.`);
    } else if (snapshot.empty) {
      vehicleSpinner.text = 'No vehicles found. Adding sample data...';
      const sampleVehicles = [
        {
          name: 'TRK-001',
          type: 'truck',
          licensePlate: 'KA 01 AB 1234',
          make: 'Tata',
          model: 'Prima 4928.S',
          year: 2022,
          status: 'operational',
          healthScore: 92,
          mileage: 45230,
          fuelEfficiency: 4.2,
          driver: 'Rajesh Kumar',
          location: { lat: 12.9716, lng: 77.5946 },
          sensors: {
            engineTemp: 85,
            oilPressure: 45,
            tirePressure: { fl: 100, fr: 100, rl: 95, rr: 95 },
            batteryVoltage: 12.6,
            fuelLevel: 75
          },
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        },
        {
          name: 'TRK-002',
          type: 'truck',
          licensePlate: 'KA 02 CD 5678',
          make: 'Ashok Leyland',
          model: 'Captain 2523',
          year: 2021,
          status: 'warning',
          healthScore: 78,
          mileage: 67890,
          fuelEfficiency: 3.8,
          driver: 'Suresh Patel',
          location: { lat: 13.0827, lng: 80.2707 },
          sensors: {
            engineTemp: 95,
            oilPressure: 38,
            tirePressure: { fl: 95, fr: 92, rl: 88, rr: 90 },
            batteryVoltage: 12.2,
            fuelLevel: 45
          },
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        },
        {
          name: 'VAN-001',
          type: 'van',
          licensePlate: 'MH 12 EF 9012',
          make: 'Mahindra',
          model: 'Supro Profit Truck',
          year: 2023,
          status: 'operational',
          healthScore: 95,
          mileage: 12450,
          fuelEfficiency: 12.5,
          driver: 'Amit Singh',
          location: { lat: 19.0760, lng: 72.8777 },
          sensors: {
            engineTemp: 82,
            oilPressure: 42,
            tirePressure: { fl: 35, fr: 35, rl: 35, rr: 35 },
            batteryVoltage: 12.8,
            fuelLevel: 85
          },
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        }
      ];

      const { addDoc } = await import('firebase/firestore');
      for (const v of sampleVehicles) {
        await addDoc(collection(db, 'vehicles'), v);
      }
      vehicleSpinner.succeed('Added 3 sample vehicles.');
    } else {
      vehicleSpinner.succeed(`Found ${snapshot.size} vehicles. No duplicates.`);
    }

  } catch (error) {
    vehicleSpinner.fail(`Error checking vehicles: ${error.message}`);
  }

  console.log(chalk.green('\n✓ Data cleanup complete!'));
  process.exit(0);
}

main();
