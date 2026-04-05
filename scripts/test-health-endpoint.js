/**
 * Test the health endpoint directly
 */

const fetch = require('node-fetch');

async function testHealthEndpoint() {
  console.log('🔍 Testing health endpoint...\n');
  
  // Test basic health (no auth required)
  console.log('1. Testing basic health check...');
  try {
    const basicRes = await fetch('http://localhost:3000/api/health');
    const basicData = await basicRes.json();
    console.log('   Status:', basicRes.status);
    console.log('   OK:', basicData.ok);
    console.log('   Scope:', basicData.scope);
    console.log('   Checks:', Object.keys(basicData.checks || {}).join(', '));
  } catch (err) {
    console.log('   ❌ Error:', err.message);
    console.log('   Is dev server running? (npm run dev)');
  }
  
  console.log('\n2. Testing full health check (requires admin auth)...');
  console.log('   Note: This requires cookies from authenticated admin session');
  console.log('   You must be logged in to the admin panel in your browser');
  console.log('   Then visit: http://localhost:3000/admin');
  console.log('   And click "Vérifier les API" button');
  
  console.log('\n💡 If you see only supabase.ping in the UI:');
  console.log('   - Make sure dev server is running: npm run dev');
  console.log('   - Make sure you\'re logged in as admin');
  console.log('   - Check browser console for 401 errors');
  console.log('   - Verify you have admin role in admin_users table');
}

testHealthEndpoint().catch(console.error);
