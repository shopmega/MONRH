/**
 * Check user_cases table structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserCases() {
  console.log('🔍 Checking user_cases table structure...\n');
  
  // Try to select all columns from one row
  const { data, error } = await supabase
    .from('user_cases')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Error:', error.message);
    console.log('Code:', error.code);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('✅ Table exists with', data.length, 'row(s)');
    console.log('\n📋 Columns:', Object.keys(data[0]).join(', '));
  } else {
    console.log('✅ Table exists but is empty');
    
    // Try to get column info by inserting and selecting
    console.log('\n📝 Testing column access...');
    const testColumns = ['id', 'user_id', 'case_type', 'title', 'status', 'company_id', 'company_name'];
    
    for (const col of testColumns) {
      const { error } = await supabase
        .from('user_cases')
        .select(col)
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${col}: ${error.message}`);
      } else {
        console.log(`   ✅ ${col}: exists`);
      }
    }
  }
}

checkUserCases().catch(console.error);
