-- Auberon Chat Database Verification & Repair Script
-- Run this in Supabase SQL Editor to check and fix your database setup

-- =============================================================================
-- VERIFICATION QUERIES - Check what exists
-- =============================================================================

-- Check if tables exist
SELECT 
  'profiles' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'conversations' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations' AND table_schema = 'public') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'messages' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- Check if functions exist
SELECT 
  'handle_new_user' as function_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'handle_new_user' AND routine_schema = 'public') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- Check if trigger exists
SELECT 
  'on_auth_user_created' as trigger_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- Check RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'conversations', 'messages');

-- =============================================================================
-- REPAIR SECTION - Add missing components
-- =============================================================================

-- 1. Create profiles table if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    CREATE TABLE profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email TEXT,
      openrouter_api_key TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✅ Created profiles table';
  ELSE
    RAISE NOTICE '✅ Profiles table already exists';
  END IF;
END
$$;

-- 2. Create conversations table if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations' AND table_schema = 'public') THEN
    CREATE TABLE conversations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      title TEXT,
      model TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✅ Created conversations table';
  ELSE
    RAISE NOTICE '✅ Conversations table already exists';
  END IF;
END
$$;

-- 3. Create messages table if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
    CREATE TABLE messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      model TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✅ Created messages table';
  ELSE
    RAISE NOTICE '✅ Messages table already exists';
  END IF;
END
$$;

-- 4. Enable RLS on all tables
DO $$
BEGIN
  -- Enable RLS on profiles
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Enabled RLS on profiles';
  END IF;
  
  -- Enable RLS on conversations
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations' AND table_schema = 'public') THEN
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Enabled RLS on conversations';
  END IF;
  
  -- Enable RLS on messages
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ Enabled RLS on messages';
  END IF;
END
$$;

-- 5. Create RLS Policies (DROP and recreate to avoid conflicts)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  
  DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
  DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
  
  DROP POLICY IF EXISTS "Users can view own messages" ON messages;
  DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
  DROP POLICY IF EXISTS "Users can update own messages" ON messages;
  DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
  
  RAISE NOTICE '🧹 Cleaned up existing policies';
END
$$;

-- Create profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create conversations policies
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Create messages policies
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- 7. Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate errors
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- FINAL VERIFICATION - Run this to confirm everything is working
-- =============================================================================

-- Count records in each table
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT 
  'conversations' as table_name,
  COUNT(*) as record_count
FROM conversations
UNION ALL
SELECT 
  'messages' as table_name,
  COUNT(*) as record_count
FROM messages;

-- Show all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '🎉 Database setup complete! All tables, policies, functions, and triggers are now in place.';
  RAISE NOTICE '🚀 Your Auberon Chat app should now work properly!';
END
$$;
