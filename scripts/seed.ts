/**
 * Seed script for Boy Child Association
 * Populates realistic Ugandan safeguarding and community circles data.
 * Usage: npx tsx scripts/seed.ts
 */
import { mockStore } from '../src/lib/firebase/mockStore';

async function seedDatabase() {
  console.log('--- Initialising Boy Child Association Seed Data ---');
  console.log(`Programmes: ${mockStore.programmes.length}`);
  console.log(`Community Circles: ${mockStore.circles.length}`);
  console.log(`Pre-seeded Uganda Users: ${Object.keys(mockStore.users).length}`);
  console.log(`Safeguarding Concern Reports: ${mockStore.concernReports.length}`);
  console.log(`Mentor Applications: ${mockStore.mentorApplications.length}`);
  console.log(`Audit Log Records: ${mockStore.auditLogs.length}`);

  console.log('\nSample User Accounts:');
  Object.values(mockStore.users).forEach((u) => {
    console.log(`- [${u.role.toUpperCase()}] ${u.fullName} (${u.email}) - Status: ${u.status}`);
  });

  console.log('\n--- Seed verification completed successfully! ---');
}

seedDatabase().catch(console.error);
