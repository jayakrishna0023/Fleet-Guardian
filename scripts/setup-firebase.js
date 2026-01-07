// Fleet Guardian AI - Firebase Setup Script
// Run: cd scripts && npm install && npm run setup

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚛  Fleet Guardian AI - Firebase Setup Wizard  🔥      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`));

// Check for existing .env
let existingConfig = {};
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^(VITE_\w+)=(.+)$/);
    if (match) {
      existingConfig[match[1]] = match[2].trim();
    }
  });
  console.log(chalk.green('✓ Found existing .env file\n'));
}

async function main() {
  try {
    // Step 1: Get Firebase config
    console.log(chalk.yellow('\n📋 Step 1: Firebase Configuration\n'));
    console.log(chalk.gray('Get these values from Firebase Console → Project Settings → Your apps → Web app\n'));
    
    const firebaseAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Firebase API Key:',
        default: existingConfig.VITE_FIREBASE_API_KEY || '',
        validate: input => input.length > 0 || 'API Key is required'
      },
      {
        type: 'input',
        name: 'authDomain',
        message: 'Auth Domain (e.g., project.firebaseapp.com):',
        default: existingConfig.VITE_FIREBASE_AUTH_DOMAIN || '',
        validate: input => input.includes('.') || 'Enter a valid domain'
      },
      {
        type: 'input',
        name: 'projectId',
        message: 'Project ID:',
        default: existingConfig.VITE_FIREBASE_PROJECT_ID || '',
        validate: input => input.length > 0 || 'Project ID is required'
      },
      {
        type: 'input',
        name: 'storageBucket',
        message: 'Storage Bucket (leave empty if not using):',
        default: existingConfig.VITE_FIREBASE_STORAGE_BUCKET || ''
      },
      {
        type: 'input',
        name: 'messagingSenderId',
        message: 'Messaging Sender ID:',
        default: existingConfig.VITE_FIREBASE_MESSAGING_SENDER_ID || ''
      },
      {
        type: 'input',
        name: 'appId',
        message: 'App ID:',
        default: existingConfig.VITE_FIREBASE_APP_ID || ''
      },
      {
        type: 'input',
        name: 'measurementId',
        message: 'Measurement ID (optional):',
        default: existingConfig.VITE_FIREBASE_MEASUREMENT_ID || ''
      }
    ]);

    // Initialize Firebase
    const spinner = ora('Connecting to Firebase...').start();
    
    const firebaseConfig = {
      apiKey: firebaseAnswers.apiKey,
      authDomain: firebaseAnswers.authDomain,
      projectId: firebaseAnswers.projectId,
      storageBucket: firebaseAnswers.storageBucket || undefined,
      messagingSenderId: firebaseAnswers.messagingSenderId || undefined,
      appId: firebaseAnswers.appId || undefined,
      measurementId: firebaseAnswers.measurementId || undefined
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    spinner.succeed('Connected to Firebase!');

    // Step 2: Create Admin User
    console.log(chalk.yellow('\n👤 Step 2: Create Admin User\n'));
    
    const adminAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Admin Email:',
        validate: input => input.includes('@') || 'Enter a valid email'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Admin Password (min 6 chars):',
        validate: input => input.length >= 6 || 'Password must be at least 6 characters'
      },
      {
        type: 'input',
        name: 'name',
        message: 'Admin Full Name:',
        default: 'System Administrator'
      },
      {
        type: 'input',
        name: 'phone',
        message: 'Phone Number (optional):'
      }
    ]);

    const createSpinner = ora('Creating admin user...').start();
    
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        adminAnswers.email, 
        adminAnswers.password
      );
      const user = userCredential.user;

      // Create Firestore profile
      await setDoc(doc(db, 'users', user.uid), {
        email: adminAnswers.email,
        name: adminAnswers.name,
        phone: adminAnswers.phone || null,
        role: 'admin',
        avatar: null,
        department: 'Administration',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        settings: {
          notifications: true,
          twoFactorEnabled: false,
          theme: 'dark'
        }
      });

      createSpinner.succeed(`Admin user created! UID: ${user.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        createSpinner.warn('This email is already registered. Skipping user creation.');
      } else {
        createSpinner.fail(`Error: ${error.message}`);
        throw error;
      }
    }

    // Step 3: Add Sample Vehicles
    console.log(chalk.yellow('\n🚛 Step 3: Sample Data\n'));
    
    const { addVehicles } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addVehicles',
        message: 'Add sample vehicles to get started?',
        default: true
      }
    ]);

    if (addVehicles) {
      const vehicleSpinner = ora('Adding sample vehicles...').start();
      
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
          }
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
          }
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
            engineTemp: 78,
            oilPressure: 50,
            tirePressure: { fl: 105, fr: 105, rl: 100, rr: 100 },
            batteryVoltage: 12.8,
            fuelLevel: 90
          }
        },
        {
          name: 'BUS-001',
          type: 'bus',
          licensePlate: 'TN 01 GH 3456',
          make: 'Volvo',
          model: '9400XL',
          year: 2020,
          status: 'critical',
          healthScore: 45,
          mileage: 234500,
          fuelEfficiency: 3.2,
          driver: 'Venkat Rao',
          location: { lat: 13.0827, lng: 80.2707 },
          sensors: {
            engineTemp: 105,
            oilPressure: 28,
            tirePressure: { fl: 85, fr: 82, rl: 78, rr: 80 },
            batteryVoltage: 11.8,
            fuelLevel: 25
          }
        },
        {
          name: 'CAR-001',
          type: 'car',
          licensePlate: 'DL 01 IJ 7890',
          make: 'Maruti Suzuki',
          model: 'Dzire',
          year: 2023,
          status: 'maintenance',
          healthScore: 60,
          mileage: 8900,
          fuelEfficiency: 22.0,
          driver: 'Priya Sharma',
          location: { lat: 28.6139, lng: 77.2090 },
          sensors: {
            engineTemp: 0,
            oilPressure: 0,
            tirePressure: { fl: 100, fr: 100, rl: 100, rr: 100 },
            batteryVoltage: 12.4,
            fuelLevel: 50
          }
        }
      ];

      for (const vehicle of sampleVehicles) {
        await addDoc(collection(db, 'vehicles'), {
          ...vehicle,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });
      }

      // Add sample alerts
      const sampleAlerts = [
        {
          vehicleId: 'TRK-002',
          vehicleName: 'TRK-002',
          type: 'prediction',
          severity: 'warning',
          title: 'Engine Temperature Rising',
          message: 'Engine temperature trending higher than normal. Recommend inspection within 500km.',
          component: 'Engine',
          probability: 0.75,
          timestamp: serverTimestamp(),
          acknowledged: false
        },
        {
          vehicleId: 'BUS-001',
          vehicleName: 'BUS-001',
          type: 'threshold',
          severity: 'critical',
          title: 'Oil Pressure Critical',
          message: 'Oil pressure below safe threshold. Immediate inspection required.',
          component: 'Engine',
          probability: 0.92,
          timestamp: serverTimestamp(),
          acknowledged: false
        },
        {
          vehicleId: 'BUS-001',
          vehicleName: 'BUS-001',
          type: 'prediction',
          severity: 'warning',
          title: 'Tire Wear Detected',
          message: 'Front tires showing signs of uneven wear. Rotation recommended.',
          component: 'Tires',
          probability: 0.68,
          timestamp: serverTimestamp(),
          acknowledged: false
        }
      ];

      for (const alert of sampleAlerts) {
        await addDoc(collection(db, 'alerts'), alert);
      }

      vehicleSpinner.succeed('Added 5 vehicles and 3 sample alerts!');
    }

    // Step 4: Save .env file
    console.log(chalk.yellow('\n💾 Step 4: Save Configuration\n'));
    
    const { saveEnv } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'saveEnv',
        message: 'Save configuration to .env file?',
        default: true
      }
    ]);

    if (saveEnv) {
      // Get AI keys if not already set
      let googleApiKey = existingConfig.VITE_GOOGLE_API_KEY || '';
      let groqApiKey = existingConfig.VITE_GROQ_API_KEY || '';

      const { addAiKeys } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addAiKeys',
          message: 'Configure AI service keys (Gemini/Groq)?',
          default: !googleApiKey
        }
      ]);

      if (addAiKeys) {
        const aiAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'googleApiKey',
            message: 'Google Gemini API Key (for AI analysis):',
            default: googleApiKey
          },
          {
            type: 'input',
            name: 'groqApiKey',
            message: 'Groq API Key (for voice assistant):',
            default: groqApiKey
          }
        ]);
        googleApiKey = aiAnswers.googleApiKey;
        groqApiKey = aiAnswers.groqApiKey;
      }

      const envContent = `# Fleet Guardian AI - Environment Variables
# Generated by setup script on ${new Date().toISOString()}

# ===========================================
# FIREBASE CONFIGURATION
# ===========================================
VITE_FIREBASE_API_KEY=${firebaseAnswers.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${firebaseAnswers.authDomain}
VITE_FIREBASE_PROJECT_ID=${firebaseAnswers.projectId}
VITE_FIREBASE_STORAGE_BUCKET=${firebaseAnswers.storageBucket || ''}
VITE_FIREBASE_MESSAGING_SENDER_ID=${firebaseAnswers.messagingSenderId || ''}
VITE_FIREBASE_APP_ID=${firebaseAnswers.appId || ''}
VITE_FIREBASE_MEASUREMENT_ID=${firebaseAnswers.measurementId || ''}

# ===========================================
# AI SERVICES
# ===========================================
VITE_GOOGLE_API_KEY=${googleApiKey}
VITE_GROQ_API_KEY=${groqApiKey}
`;

      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log(chalk.green(`\n✓ Configuration saved to ${envPath}`));
    }

    // Done!
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✅  Setup Complete!                                    ║
║                                                           ║
║   Next Steps:                                            ║
║   1. cd .. (go back to project root)                    ║
║   2. npm run dev                                         ║
║   3. Login with your admin credentials                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`));

    console.log(chalk.yellow('\n⚠️  Important Firebase Console Steps:\n'));
    console.log(chalk.white(`
1. Enable Authentication:
   Firebase Console → Build → Authentication → Sign-in method
   → Enable "Email/Password"

2. Create Firestore Database (if not done):
   Firebase Console → Build → Firestore Database → Create database
   → Choose "Start in test mode" → Select location → Enable

3. (Optional) Set Security Rules for Production:
   Copy rules from FIREBASE_SETUP.md to Firebase Console
`));

    process.exit(0);
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    console.log(chalk.yellow('Troubleshooting:'));
    console.log('1. Make sure Firebase Authentication is enabled');
    console.log('2. Make sure Firestore Database is created');
    console.log('3. Check your Firebase config values');
    process.exit(1);
  }
}

main();
