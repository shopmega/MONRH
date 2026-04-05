/**
 * Diagnostic script to test Supabase connection and table accessibility
 * Run with: node scripts/diagnose-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

console.log('🔍 Starting Supabase diagnostics...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Schema:', schema);
console.log('Service Role Key:', supabaseKey.substring(0, 20) + '...');
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: schema }
});

// Tables that should exist based on migrations (with their primary key columns)
const expectedTables = [
  { name: 'law_versions', column: 'id' },
  { name: 'articles', column: 'slug' },
  { name: 'document_templates', column: 'id' },
  { name: 'app_settings', column: 'key' }, // Note: uses 'key' not 'name'
  { name: 'admin_users', column: 'user_id' },
  { name: 'user_simulations', column: 'id' },
  { name: 'user_documents', column: 'id' },
  { name: 'user_cases', column: 'id' },
  { name: 'evidence_artifacts', column: 'id' },
  { name: 'employment_verifications', column: 'id' },
  { name: 'user_violation_logs', column: 'id' },
  { name: 'user_overtime_logs', column: 'id' },
];

async function testTableAccess(tableInfo) {
  try {
    const { data, error } = await supabase
      .from(tableInfo.name)
      .select(tableInfo.column)
      .limit(1);
    
    if (error) {
      return {
        name: tableInfo.name,
        status: '❌ FAILED',
        error: error.message,
        code: error.code,
        hint: error.hint,
      };
    }
    
    return {
      name: tableInfo.name,
      status: '✅ OK',
      rowCount: data?.length || 0,
    };
  } catch (err) {
    return {
      name: tableInfo.name,
      status: '❌ EXCEPTION',
      error: err.message,
    };
  }
}

async function runDiagnostics() {
  console.log('📊 Testing database tables...\n');
  
  const results = [];
  
  for (const tableInfo of expectedTables) {
    process.stdout.write(`Testing ${tableInfo.name}... `);
    const result = await testTableAccess(tableInfo);
    results.push(result);
    
    console.log(result.status);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
      if (result.code) console.log(`   Code: ${result.code}`);
      if (result.hint) console.log(`   Hint: ${result.hint}`);
    }
  }
  
  console.log('\n📈 Summary:');
  const passed = results.filter(r => r.status === '✅ OK').length;
  const failed = results.filter(r => r.status !== '✅ OK').length;
  
  console.log(`   Total: ${results.length}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tables:');
    results
      .filter(r => r.status !== '✅ OK')
      .forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    
    console.log('\n💡 Possible solutions:');
    console.log('   1. Ensure all migrations have been applied to your Supabase instance');
    console.log('   2. Check that the service role key has proper permissions');
    console.log('   3. Verify RLS policies are not blocking access');
    console.log('   4. Run migrations: supabase db push --remote');
    console.log('   5. If using shared Avisine database, verify schema configuration');
    console.log('      - Current schema:', schema);
    console.log('      - Set NEXT_PUBLIC_SUPABASE_SCHEMA in .env.local if needed');
    console.log('   6. For missing tables, apply these migrations:');
    console.log('      - supabase/migrations/20260214_000002_user_data_tables.sql');
    console.log('      - supabase/migrations/20260329_000013_verification_evidence_foundation.sql');
  } else {
    console.log('\n✅ All tables are accessible!');
  }
  
  // Test app_settings specifically
  console.log('\n🔧 Testing app_settings entries...');
  const { data: settings, error: settingsError } = await supabase
    .from('app_settings')
    .select('key')
    .in('key', ['admin_config', 'law_rules_bundle']);
  
  if (settingsError) {
    console.log('❌ Error querying app_settings:', settingsError.message);
  } else {
    console.log('✅ app_settings accessible');
    console.log('   Found entries:', settings.map(s => s.key).join(', ') || '(none)');
    
    if (!settings.find(s => s.key === 'admin_config')) {
      console.log('   ⚠️  admin_config entry missing - will use file fallback');
    }
    if (!settings.find(s => s.key === 'law_rules_bundle')) {
      console.log('   ⚠️  law_rules_bundle entry missing - will use file fallback');
    }
  }
  
  // Test admin_users
  console.log('\n👤 Testing admin_users...');
  const { data: admins, error: adminsError } = await supabase
    .from('admin_users')
    .select('user_id, role, enabled')
    .eq('enabled', true);
  
  if (adminsError) {
    console.log('❌ Error querying admin_users:', adminsError.message);
  } else {
    console.log('✅ admin_users accessible');
    console.log('   Active admins:', admins?.length || 0);
  }
  
  console.log('\n✅ Diagnostics complete!\n');
}

runDiagnostics().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
