/* ============================================
   VIBE — Configuration File
   ============================================
   ⚠️ এই ফাইলে শুধু PUBLIC credentials থাকবে।
   service_role key কখনো এখানে দেবেন না!
============================================ */

const CONFIG = {
  // Supabase Project URL
  SUPABASE_URL: 'https://wuudwpzrswpaanmqhkwk.supabase.co',

  // Supabase Anon (Publishable) Key
  SUPABASE_ANON_KEY: 'sb_publishable_9IHf8Yz8-DYFYSdNPEmYgg_3tp8hKct',

  // App Info
  APP_NAME: 'Vibe',
  APP_VERSION: '1.0.0',

  // Business Rules
  MOOD_CHANGE_COOLDOWN_HOURS: 4,   // মুড পরিবর্তন: ৪ ঘণ্টা
  DAILY_MOOD_CHANGE_LIMIT: 6,       // দিনে সর্বোচ্চ ৬ বার
  DAILY_CHAT_LIMIT: 10,             // প্রতিদিন ১০টি চ্যাট
  ACTIVE_USER_DAYS: 3,              // ৩ দিনের মধ্যে লগইন = active

  // Mood List
  MOODS: [
    { id: 'happy',     emoji: '😊', label: 'Happy' },
    { id: 'sad',       emoji: '😔', label: 'Sad' },
    { id: 'party',     emoji: '🎉', label: 'Party' },
    { id: 'chill',     emoji: '😌', label: 'Chill' },
    { id: 'tired',     emoji: '😴', label: 'Tired' },
    { id: 'motivated', emoji: '🔥', label: 'Motivated' }
  ]
};

// Freeze to prevent accidental changes
Object.freeze(CONFIG);