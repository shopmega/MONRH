/**
 * Check actual column names in app_settings table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('🔍 Checking app_settings columns...\n');
  
  // Query information schema to get actual columns
  const { data, error } = await supabase.rpc('get_columns', {
    table_name: 'app_settings',
    schema_name: 'public'
  });
  
  if (error) {
    console.log('RPC method not available, trying alternative...');
    
    // Alternative: try to insert a test row and see what happens
    const testRow = {
      name: 'test_check',
      value: { check: true },
      updated_at: new Date().toISOString()
    };
    
    const { error: insertError } = await supabase
      .from('app_settings')
      .insert(testRow);
    
    if (insertError) {
      console.log('Insert error:', insertError.message);
      console.log('Error code:', insertError.code);
      
      // Try selecting with different column names
      console.log('\nTrying different column combinations...');
      
      const possibleColumns = ['id', 'name', 'key', 'setting_name', 'slug'];
      
      for (const col of possibleColumns) {
        const { data, error } = await supabase
          .from('app_settings')
          .select(col)
          .limit(1);
        
        if (!error) {
          console.log(`✅ Column '${col}' exists!`);
        } else {
          console.log(`❌ Column '${col}': ${error.message}`);
        }
      }
    } else {
      console.log('✅ Insert successful - table has name/value/updated_at columns');
      
      // Clean up test row
      await supabase.from('app_settings').delete().eq('name', 'test_check');
    }
  } else {
    console.log('Columns:', data);
  }
}

checkColumns().catch(console.error);
