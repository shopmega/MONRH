/**
 * Check all columns in app_settings table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllColumns() {
  console.log('🔍 Checking all app_settings columns...\n');
  
  // Try common column names
  const possibleColumns = [
    'id', 'key', 'name', 'setting_name', 'slug',
    'value', 'data', 'content', 'payload',
    'updated_at', 'created_at', 'timestamp'
  ];
  
  const existingColumns = [];
  
  for (const col of possibleColumns) {
    const { data, error } = await supabase
      .from('app_settings')
      .select(col)
      .limit(1);
    
    if (!error) {
      console.log(`✅ Column '${col}' exists`);
      existingColumns.push(col);
    }
  }
  
  console.log('\n📊 Existing columns:', existingColumns.join(', '));
  
  // Try to insert a row with the discovered columns
  if (existingColumns.includes('key')) {
    console.log('\n📝 Attempting to insert test row...');
    const testRow = {
      key: 'test_health_check',
      value: { test: true },
    };
    
    // Add updated_at if it exists
    if (existingColumns.includes('updated_at')) {
      testRow.updated_at = new Date().toISOString();
    }
    
    const { error: insertError } = await supabase
      .from('app_settings')
      .insert(testRow);
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
    } else {
      console.log('✅ Insert successful');
      
      // Clean up
      await supabase.from('app_settings').delete().eq('key', 'test_health_check');
      console.log('🗑️  Test row cleaned up');
    }
  }
}

checkAllColumns().catch(console.error);
