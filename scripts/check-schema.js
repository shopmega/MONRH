/**
 * Check which schema is being used and list tables in that schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

console.log('🔍 Checking database schema configuration...\n');
console.log('Schema:', schema);
console.log('URL:', supabaseUrl);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: schema }
});

async function checkSchema() {
  console.log(`📊 Testing connection to schema: ${schema}\n`);
  
  // Try to query a known table
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .limit(1);
  
  if (error) {
    console.log('❌ Error querying admin_users:');
    console.log('   Message:', error.message);
    console.log('   Code:', error.code);
    console.log('   Hint:', error.hint);
    
    // Try public schema as fallback
    console.log('\n🔄 Trying public schema...');
    const publicSupabase = createClient(supabaseUrl, supabaseKey);
    const { data: publicData, error: publicError } = await publicSupabase
      .from('admin_users')
      .select('user_id')
      .limit(1);
    
    if (publicError) {
      console.log('❌ Also failed in public schema:', publicError.message);
    } else {
      console.log('✅ Table exists in public schema!');
      console.log('   You should set NEXT_PUBLIC_SUPABASE_SCHEMA=public in .env.local');
    }
  } else {
    console.log('✅ Successfully connected to schema:', schema);
    console.log('   Found admin_users table');
  }
  
  // List all tables in the current schema
  console.log('\n📋 Attempting to list tables...');
  
  try {
    // Query information_schema to list tables
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables_in_schema', {
      schema_name: schema
    });
    
    if (tablesError) {
      console.log('   RPC method not available, trying direct query...');
      
      // Alternative: query information_schema directly
      const { data: infoTables, error: infoError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', schema)
        .eq('table_type', 'BASE TABLE');
      
      if (infoError) {
        console.log('   ❌ Cannot query information_schema:', infoError.message);
      } else {
        console.log(`   ✅ Found ${infoTables?.length || 0} tables in ${schema} schema:`);
        infoTables?.forEach(t => console.log('      -', t.table_name));
      }
    } else {
      console.log('   Tables:', tables);
    }
  } catch (err) {
    console.log('   Error listing tables:', err.message);
  }
}

checkSchema().catch(console.error);
