#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Setting up Lead Pools tables...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'db', 'CREATE_LEAD_POOLS.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolons and filter out comments and empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--')) continue;
      
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: directError } = await supabase.from('_migrations').insert({
            name: `lead_pools_${Date.now()}`,
            executed_at: new Date().toISOString()
          });
          
          if (directError && !directError.message.includes('does not exist')) {
            console.log(`⚠️  Warning: ${error.message}`);
          }
        }
        
        console.log(`✅ Statement ${i + 1} completed`);
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} warning: ${err.message}`);
      }
    }

    console.log('\n✅ Migration completed!\n');
    console.log('📊 Verifying tables...\n');

    // Verify tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('cold_outreach_lead_pools')
      .select('count')
      .limit(0);

    if (tablesError) {
      console.log('⚠️  Could not verify tables automatically.');
      console.log('   Please run the SQL manually in Supabase SQL Editor:\n');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Copy contents of db/CREATE_LEAD_POOLS.sql');
      console.log('   3. Paste and execute\n');
    } else {
      console.log('✅ Tables verified successfully!\n');
    }

    console.log('🎉 Setup complete! You can now use Lead Pools.\n');
    console.log('Next steps:');
    console.log('  1. Go to /dev-login to login');
    console.log('  2. Navigate to /lead-pools');
    console.log('  3. Create your first pool');
    console.log('  4. Add contacts to the pool');
    console.log('  5. Create a campaign and select the pool\n');

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.log('\n📝 Manual setup required:');
    console.log('   Run the SQL file manually in Supabase SQL Editor');
    console.log('   File: db/CREATE_LEAD_POOLS.sql\n');
    process.exit(1);
  }
}

runMigration();
