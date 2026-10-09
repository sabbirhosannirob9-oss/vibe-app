/* ============================================
   VIBE — Supabase Client Initialization
   ============================================
   এটা global `sb` variable তৈরি করে যা সব
   পেজে ব্যবহার করা যাবে।
============================================ */

// Supabase SDK লোড হয়েছে কিনা চেক
if (typeof supabase === 'undefined') {
  console.error('❌ Supabase SDK load হয়নি! HTML-এ <script> tag চেক করুন।');
}

// Global Supabase client
window.sb = supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,      // Session সেভ থাকবে
      autoRefreshToken: true,     // Token অটো রিফ্রেশ
      detectSessionInUrl: true,   // URL থেকে session detect
      storage: window.localStorage
    },
    realtime: {
      params: {
        eventsPerSecond: 10       // Realtime event rate
      }
    }
  }
);

console.log('✅ Supabase client initialized');

// ============================================
// Helper: Check if user is logged in
// ============================================
async function getCurrentUser() {
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) return null;
  return user;
}

// ============================================
// Helper: Update last_seen timestamp
// ============================================
async function updateLastSeen() {
  const user = await getCurrentUser();
  if (!user) return;

  await sb
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', user.id);
}

// প্রতি ২ মিনিটে last_seen update
setInterval(() => {
  updateLastSeen().catch(() => {});
}, 2 * 60 * 1000);

// পেজ focus হলেই update
window.addEventListener('focus', () => {
  updateLastSeen().catch(() => {});
});