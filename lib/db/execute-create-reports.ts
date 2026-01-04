import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQL() {
  try {
    const sqlPath = path.join(process.cwd(), 'lib/db/migrations/create-reports-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Executing SQL to create reports table...');
    const { data, error } = await supabase.rpc('exec', { sql });

    if (error) {
      console.error('SQL execution error:', error);
      // Try an alternative approach
      const statements = sql.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const result = await supabase.rpc('exec', { sql: statement });
          if (result.error) {
            console.error('Error:', result.error);
          }
        }
      }
    } else {
      console.log('✅ Reports table created successfully!');
      console.log(data);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runSQL();
