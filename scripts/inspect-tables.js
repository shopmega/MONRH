/**
 * Quick script to inspect actual table schemas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName) {
  console.log(`\n📋 Inspecting ${tableName}...`);
  
  // Try to get one row to see structure
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('   Sample row keys:', Object.keys(data[0]).join(', '));
    console.log('   Total rows:', data.length);
  } else {
    console.log('   Table exists but is empty');
  }
}

async function main() {
  console.log('🔍 Inspecting table schemas...\n');
  
  await inspectTable('app_settings');
  await inspectTable('admin_users');
  await inspectTable('articles');
  
  console.log('\n✅ Done\n');
}

main().catch(console.error);
