// Migration script: create user_preferences table
// Run: npx tsx scripts/migrate-settings.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function migrate() {
  if (!serviceRoleKey || serviceRoleKey.startsWith('eyJhbG')) {
    console.log('Using service role key (length: ' + serviceRoleKey.length + ')');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Create user_preferences table via raw SQL using pg
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id uuid PRIMARY KEY DEFAULT auth.uid(),
        theme text NOT NULL DEFAULT 'light',
        accent_color text NOT NULL DEFAULT '#E6002D',
        font_size integer NOT NULL DEFAULT 2,
        reduce_motion boolean NOT NULL DEFAULT false,
        haptic boolean NOT NULL DEFAULT true,
        language text NOT NULL DEFAULT 'Tiếng Việt',
        timezone text NOT NULL DEFAULT '(GMT+07:00) Bangkok, Hanoi, Jakarta',
        notify_birthday boolean NOT NULL DEFAULT true,
        notify_event_reminder boolean NOT NULL DEFAULT true,
        notify_anniversary boolean NOT NULL DEFAULT true,
        notify_ai_suggest boolean NOT NULL DEFAULT false,
        push_enabled boolean NOT NULL DEFAULT true,
        email_notify boolean NOT NULL DEFAULT false,
        sms_notify boolean NOT NULL DEFAULT false,
        quiet_from text NOT NULL DEFAULT '22:00',
        quiet_to text NOT NULL DEFAULT '07:00',
        public_profile boolean NOT NULL DEFAULT false,
        online_status boolean NOT NULL DEFAULT true,
        location_share boolean NOT NULL DEFAULT false,
        ai_data_use boolean NOT NULL DEFAULT true,
        anonymous_stats boolean NOT NULL DEFAULT true,
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      -- Enable RLS
      ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

      -- RLS: users can only see/update their own preferences
      CREATE POLICY "Users can view own preferences"
        ON user_preferences FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert own preferences"
        ON user_preferences FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update own preferences"
        ON user_preferences FOR UPDATE
        USING (auth.uid() = user_id);

      -- Auto-create preferences row on user signup
      CREATE OR REPLACE FUNCTION handle_new_user_preferences()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.user_preferences (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Trigger on auth.users
      DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
      CREATE TRIGGER on_auth_user_created_preferences
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION handle_new_user_preferences();
    `
  });

  if (error) {
    console.error('RPC exec_sql failed:', error);
    // Fallback: try direct SQL via rest
    console.log('Trying direct SQL via management API...');
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${supabaseUrl.replace('https://', '').replace('.supabase.co', '')}/sql`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      }
    );
    if (!res.ok) {
      const errBody = await res.text();
      console.error('Management API failed:', res.status, errBody);
      // Last resort: print SQL for manual execution
      console.log('\n=== SQL TO RUN MANUALLY ===');
      console.log(sql);
      console.log('=== END SQL ===');
    } else {
      console.log('✅ Migration applied via Management API');
    }
  } else {
    console.log('✅ Migration applied successfully via RPC');
  }
}

const sql = `
  CREATE TABLE IF NOT EXISTS user_preferences (
    user_id uuid PRIMARY KEY DEFAULT auth.uid(),
    theme text NOT NULL DEFAULT 'light',
    accent_color text NOT NULL DEFAULT '#E6002D',
    font_size integer NOT NULL DEFAULT 2,
    reduce_motion boolean NOT NULL DEFAULT false,
    haptic boolean NOT NULL DEFAULT true,
    language text NOT NULL DEFAULT 'Tiếng Việt',
    timezone text NOT NULL DEFAULT '(GMT+07:00) Bangkok, Hanoi, Jakarta',
    notify_birthday boolean NOT NULL DEFAULT true,
    notify_event_reminder boolean NOT NULL DEFAULT true,
    notify_anniversary boolean NOT NULL DEFAULT true,
    notify_ai_suggest boolean NOT NULL DEFAULT false,
    push_enabled boolean NOT NULL DEFAULT true,
    email_notify boolean NOT NULL DEFAULT false,
    sms_notify boolean NOT NULL DEFAULT false,
    quiet_from text NOT NULL DEFAULT '22:00',
    quiet_to text NOT NULL DEFAULT '07:00',
    public_profile boolean NOT NULL DEFAULT false,
    online_status boolean NOT NULL DEFAULT true,
    location_share boolean NOT NULL DEFAULT false,
    ai_data_use boolean NOT NULL DEFAULT true,
    anonymous_stats boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can view own preferences') THEN
      CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can insert own preferences') THEN
      CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can update own preferences') THEN
      CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
    END IF;
  END $$;
`;

migrate().catch(console.error);
