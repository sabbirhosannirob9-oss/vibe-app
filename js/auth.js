/* ============================================
   VIBE — Authentication Logic
   ============================================
   Handles Login, Register, Logout
============================================ */

// ============================================
// SIGN UP (Register)
// ============================================
async function signUp(email, password, name) {
  const { data, error } = await sb.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { name: name }, // stored in auth.users metadata
      emailRedirectTo: window.location.origin + '/login.html'
    }
  });

  if (error) throw error;
  return data;
}

// ============================================
// SIGN IN (Login)
// ============================================
async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) throw error;
  return data;
}

// ============================================
// SIGN OUT
// ============================================
async function signOut() {
  const { error } = await sb.auth.signOut();
  if (error) throw error;
  window.location.href = 'login.html';
}

// ============================================
// REDIRECT IF ALREADY LOGGED IN
// ============================================
async function redirectIfLoggedIn() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;

  // Check if profile is complete
  const { data: profile } = await sb
    .from('profiles')
    .select('city, age, interests')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!profile || !profile.city || !profile.age) {
    window.location.href = 'setup.html';
  } else {
    window.location.href = 'app.html';
  }
}

// ============================================
// REQUIRE AUTH (for protected pages)
// ============================================
async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session.user;
}

// ============================================
// GET USER PROFILE
// ============================================
async function getUserProfile(userId) {
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ============================================
// TRANSLATE SUPABASE ERRORS
// ============================================
function translateAuthError(error) {
  const msg = (error.message || '').toLowerCase();

  if (msg.includes('invalid login credentials')) {
    return 'Wrong email or password. Please try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email first.';
  }
  if (msg.includes('user already registered')) {
    return 'This email is already registered. Try signing in.';
  }
  if (msg.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (msg.includes('unable to validate email')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment.';
  }
  if (msg.includes('network')) {
    return 'Network error. Please check your connection.';
  }

  return error.message || 'Something went wrong. Please try again.';
}

// ============================================
// VALIDATE EMAIL
// ============================================
function validateEmail(email) {
  if (!email) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email.';
  }
  return null;
}

// ============================================
// VALIDATE PASSWORD
// ============================================
function validatePassword(password) {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

// ============================================
// VALIDATE NAME
// ============================================
function validateName(name) {
  if (!name || !name.trim()) return 'Name is required.';
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
  if (name.trim().length > 30) return 'Name is too long.';
  return null;
}

// ============================================
// UI HELPERS
// ============================================
function showAuthError(message) {
  const el = document.getElementById('authError');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');

  // Auto-hide after 5s
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => el.classList.remove('show'), 5000);
}

function hideAuthError() {
  const el = document.getElementById('authError');
  if (el) el.classList.remove('show');
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function togglePassword(inputId, toggleBtn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  // Update icon (eye / eye-off)
  if (toggleBtn) {
    toggleBtn.innerHTML = isPassword
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  }
}

// ============================================
// CHECK AUTH STATE ON PAGE LOAD (for auth pages)
// ============================================
function watchAuthState() {
  sb.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth event:', event);
  });
}