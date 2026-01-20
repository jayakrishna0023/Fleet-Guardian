// Database Testing Utility
// Tests all database operations: Firebase Auth, Firestore, Storage

import { isFirebaseConfigured, auth, db, storage } from '@/config/firebase';
import { firebaseAuthService } from '@/services/firebaseAuth';
import * as firestoreService from '@/services/firestoreService';
import { Vehicle } from '@/types/vehicle';

interface TestResult {
  name: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  duration?: number;
}

class DatabaseTester {
  private results: TestResult[] = [];

  private addResult(name: string, status: 'success' | 'failed' | 'skipped', message: string, duration?: number) {
    this.results.push({ name, status, message, duration });
    const icon = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏭️';
    console.log(`${icon} ${name}: ${message}${duration ? ` (${duration}ms)` : ''}`);
  }

  private async runTest(name: string, testFn: () => Promise<void>) {
    const start = Date.now();
    try {
      await testFn();
      const duration = Date.now() - start;
      this.addResult(name, 'success', 'Passed', duration);
    } catch (error) {
      const duration = Date.now() - start;
      this.addResult(name, 'failed', error instanceof Error ? error.message : 'Unknown error', duration);
    }
  }

  async testFirebaseConfiguration() {
    console.log('\n🔧 Testing Firebase Configuration...\n');

    await this.runTest('Firebase Config Check', async () => {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured');
      }
      if (!auth) throw new Error('Auth is not initialized');
      if (!db) throw new Error('Firestore is not initialized');
      if (!storage) throw new Error('Storage is not initialized');
    });
  }

  async testAuthentication() {
    console.log('\n🔐 Testing Authentication Services...\n');

    await this.runTest('Auth Service Initialization', async () => {
      if (!firebaseAuthService) {
        throw new Error('Firebase Auth Service not initialized');
      }
    });

    await this.runTest('Check Current Auth State', async () => {
      const currentUser = firebaseAuthService.getCurrentUser();
      console.log('   Current user:', currentUser?.email || 'Not logged in');
    });

    await this.runTest('Get All Users (Admin)', async () => {
      const users = await firebaseAuthService.getAllUsers();
      console.log(`   Found ${users.length} users in database`);
      if (users.length > 0) {
        console.log(`   Sample user: ${users[0].email} (${users[0].role})`);
      }
    });
  }

  async testFirestoreOperations() {
    console.log('\n💾 Testing Firestore Operations...\n');

    await this.runTest('Fetch Vehicles', async () => {
      const vehicles = await firestoreService.getVehicles();
      console.log(`   Found ${vehicles.length} vehicles in Firestore`);
      if (vehicles.length > 0) {
        console.log(`   Sample vehicle: ${vehicles[0].name} (${vehicles[0].licensePlate})`);
      }
    });

    await this.runTest('Fetch Alerts', async () => {
      const alerts = await firestoreService.getAlerts();
      console.log(`   Found ${alerts.length} alerts in Firestore`);
    });

    await this.runTest('Fetch Trips', async () => {
      // Get trips for first vehicle if any exist
      const vehicles = await firestoreService.getVehicles();
      if (vehicles.length > 0) {
        const trips = await firestoreService.getTrips(vehicles[0].id);
        console.log(`   Found ${trips.length} trips in Firestore`);
      } else {
        console.log(`   No vehicles found to fetch trips from`);
      }
    });

    await this.runTest('Fetch Vehicle Requests', async () => {
      const requests = await firestoreService.getVehicleRequests();
      console.log(`   Found ${requests.length} vehicle requests`);
    });

    // Test CRUD operations with mock data
    let testVehicleId: string | null = null;

    await this.runTest('Create Test Vehicle', async () => {
      const mockVehicle: Omit<Vehicle, 'id'> = {
        name: 'Test Vehicle ' + Date.now(),
        type: 'van',
        licensePlate: 'TEST-' + Math.floor(Math.random() * 9999),
        healthScore: 100,
        status: 'operational',
        mileage: 0,
        fuelEfficiency: 15,
        engineTemperature: 75,
        sensors: {
          engineTemp: 75,
          oilPressure: 40,
          batteryVoltage: 12.6,
          tirePressure: { fl: 32, fr: 32, rl: 32, rr: 32 },
          fuelLevel: 100,
        },
        location: { lat: 40.7128, lng: -74.006 },
        trips: [],
        alerts: [],
      };

      const createdVehicle = await firestoreService.addVehicle(mockVehicle);
      testVehicleId = createdVehicle.id;
      console.log(`   Created vehicle with ID: ${testVehicleId}`);
    });

    if (testVehicleId) {
      await this.runTest('Read Test Vehicle', async () => {
        const vehicle = await firestoreService.getVehicle(testVehicleId!);
        if (!vehicle) throw new Error('Vehicle not found');
        console.log(`   Retrieved: ${vehicle.name}`);
      });

      await this.runTest('Update Test Vehicle', async () => {
        await firestoreService.updateVehicle(testVehicleId!, { healthScore: 95 });
        const updated = await firestoreService.getVehicle(testVehicleId!);
        if (updated?.healthScore !== 95) throw new Error('Update failed');
        console.log(`   Updated health score to 95`);
      });

      await this.runTest('Delete Test Vehicle', async () => {
        await firestoreService.deleteVehicle(testVehicleId!);
        const deleted = await firestoreService.getVehicle(testVehicleId!);
        if (deleted) throw new Error('Delete failed - vehicle still exists');
        console.log(`   Successfully deleted test vehicle`);
      });
    }
  }

  async testStorage() {
    console.log('\n📦 Testing Storage Services...\n');

    await this.runTest('Storage Availability', async () => {
      if (!storage) throw new Error('Storage not initialized');
      console.log('   Storage bucket configured');
    });
  }

  async runAllTests() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   🧪 FLEET GUARDIAN DATABASE TESTS       ║');
    console.log('╚════════════════════════════════════════════╝\n');

    const startTime = Date.now();

    if (!isFirebaseConfigured()) {
      console.log('⚠️  Firebase is not configured. Tests will be skipped.');
      console.log('   To enable Firebase, add your credentials to .env file\n');
      return;
    }

    await this.testFirebaseConfiguration();
    await this.testAuthentication();
    await this.testFirestoreOperations();
    await this.testStorage();

    const totalTime = Date.now() - startTime;

    // Summary
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   📊 TEST SUMMARY                         ║');
    console.log('╚════════════════════════════════════════════╝\n');

    const passed = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`⏱️  Total Time: ${totalTime}ms\n`);

    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`   - ${r.name}: ${r.message}`));
      console.log('');
    }

    if (passed === total) {
      console.log('🎉 All tests passed! Database is working correctly.\n');
    } else if (failed > 0) {
      console.log('⚠️  Some tests failed. Please check the errors above.\n');
    }

    return {
      total,
      passed,
      failed,
      skipped,
      duration: totalTime,
      results: this.results,
    };
  }
}

// Export singleton instance
export const databaseTester = new DatabaseTester();

// Auto-run tests in development
if (import.meta.env.DEV) {
  // Run tests after a short delay to ensure everything is initialized
  setTimeout(() => {
    if (isFirebaseConfigured()) {
      console.log('🔍 Auto-running database tests...\n');
      databaseTester.runAllTests();
    }
  }, 2000);
}
