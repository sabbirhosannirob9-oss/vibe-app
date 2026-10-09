/* ============================================
   VIBE — Profile Setup Logic
   ============================================
   Multi-step setup: About → Interests → Mood
============================================ */

// ============================================
// STATE
// ============================================
const setupState = {
  age: null,
  gender: null,
  city: null,
  interests: [],
  bio: '',
  mood: null,
  currentStep: 1,
  userId: null
};

const MAX_INTERESTS = 5;

// ============================================
// INIT
// ============================================
(async () => {
  // Require auth
  const user = await requireAuth();
  if (!user) return;
  setupState.userId = user.id;

  // Check if profile already exists and is complete
  const existing = await getUserProfile(user.id);
  if (existing && existing.city && existing.age) {
    // Already set up → go to app
    window.location.href = 'app.html';
    return;
  }

  // Pre-fill name/email if available
  if (existing && existing.name) {
    // not used in setup but nice to have
  }

  // Hide loading screen
  hideLoading();

  // Init UI
  initStep1();
  initStep2();
  initStep3();

  // Show step 1
  goToStep(1);
})();

// ============================================
// LOADING
// ============================================
function hideLoading() {
  const el = document.getElementById('pageLoading');
  if (el) {
    el.classList.add('hide');
    setTimeout(() => el.remove(), 400);
  }
}

// ============================================
// STEP NAVIGATION
// ============================================
function goToStep(n) {
  setupState.currentStep = n;

  // Hide all
  document.querySelectorAll('.step-view').forEach(el => el.classList.remove('active'));

  // Show current
  const current = document.getElementById('step' + n);
  if (current) current.classList.add('active');

  // Update progress
  const fill = document.getElementById('progressFill');
  if (fill) fill.style.width = (n / 3) * 100 + '%';

  // Scroll top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// STEP 1 — About
// ============================================
function initStep1() {
  const ageInput = document.getElementById('ageInput');
  const cityInput = document.getElementById('cityInput');
  const genderBtns = document.querySelectorAll('.gender-btn');
  const nextBtn = document.getElementById('nextTo2');

  // Gender buttons
  genderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      genderBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      setupState.gender = btn.dataset.value;
    });
  });

  // Next
  nextBtn.addEventListener('click', () => {
    hideAuthError();

    const age = parseInt(ageInput.value, 10);
    const city = cityInput.value;

    // Validate
    if (!age || age < 18 || age > 99) {
      return showAuthError('Please enter a valid age (18-99).');
    }
    if (!setupState.gender) {
      return showAuthError('Please select your gender.');
    }
    if (!city) {
      return showAuthError('Please select your city.');
    }

    setupState.age = age;
    setupState.city = city;
    setupState.gender = setupState.gender;

    goToStep(2);
  });

  // Enter key on age
  ageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') nextBtn.click();
  });
}

// ============================================
// STEP 2 — Interests + Bio
// ============================================
function initStep2() {
  const chips = document.querySelectorAll('.interest-chip');
  const limitEl = document.getElementById('interestLimit');
  const bioInput = document.getElementById('bioInput');
  const bioCounter = document.getElementById('bioCounter');
  const nextBtn = document.getElementById('nextTo3');
  const backBtn = document.getElementById('backTo1');

  // Interest chips
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const value = chip.dataset.value;

      if (chip.classList.contains('selected')) {
        chip.classList.remove('selected');
        setupState.interests = setupState.interests.filter(i => i !== value);
      } else {
        if (setupState.interests.length >= MAX_INTERESTS) {
          showToast(`You can pick up to ${MAX_INTERESTS} interests.`, 'info');
          return;
        }
        chip.classList.add('selected');
        setupState.interests.push(value);
      }

      updateInterestLimit();
    });
  });

  function updateInterestLimit() {
    const count = setupState.interests.length;
    limitEl.textContent = `${count} / ${MAX_INTERESTS} selected`;
    limitEl.classList.toggle('warn', count >= MAX_INTERESTS);
  }

  // Bio counter
  bioInput.addEventListener('input', () => {
    bioCounter.textContent = `${bioInput.value.length} / 150`;
  });

  // Next
  nextBtn.addEventListener('click', () => {
    hideAuthError();

    if (setupState.interests.length === 0) {
      return showAuthError('Please pick at least one interest.');
    }

    setupState.bio = bioInput.value.trim();
    goToStep(3);
  });

  // Back
  backBtn.addEventListener('click', () => goToStep(1));
}

// ============================================
// STEP 3 — Mood + Save
// ============================================
function initStep3() {
  const moodCards = document.querySelectorAll('.mood-card');
  const finishBtn = document.getElementById('finishBtn');
  const backBtn = document.getElementById('backTo2');
  const goToAppBtn = document.getElementById('goToApp');

  // Mood cards
  moodCards.forEach(card => {
    card.addEventListener('click', () => {
      moodCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      setupState.mood = card.dataset.mood;
    });
  });

  // Finish
  finishBtn.addEventListener('click', async () => {
    hideAuthError();

    if (!setupState.mood) {
      return showAuthError('Please select your mood.');
    }

    setButtonLoading(finishBtn, true);

    try {
      await saveProfileAndMood();
      showSuccessScreen();
    } catch (err) {
      console.error('Setup error:', err);
      showAuthError(err.message || 'Failed to save. Please try again.');
      setButtonLoading(finishBtn, false);
    }
  });

  // Back
  backBtn.addEventListener('click', () => goToStep(2));

  // Go to app
  goToAppBtn.addEventListener('click', () => {
    window.location.href = 'app.html';
  });
}

// ============================================
// SAVE PROFILE + VIBE
// ============================================
async function saveProfileAndMood() {
  const userId = setupState.userId;

  // 1. Update profile
  const { error: profileErr } = await sb
    .from('profiles')
    .update({
      age: setupState.age,
      gender: setupState.gender,
      city: setupState.city,
      interests: setupState.interests,
      bio: setupState.bio || null,
      last_seen: new Date().toISOString()
    })
    .eq('id', userId);

  if (profileErr) {
    console.error('Profile update error:', profileErr);
    throw new Error('Could not save profile.');
  }

  // 2. Insert vibe
  const { error: vibeErr } = await sb
    .from('vibes')
    .insert({
      user_id: userId,
      mood: setupState.mood
    });

  if (vibeErr) {
    console.error('Vibe insert error:', vibeErr);
    throw new Error('Could not save mood.');
  }

  console.log('✅ Profile + Vibe saved');
}

// ============================================
// SUCCESS SCREEN
// ============================================
function showSuccessScreen() {
  document.querySelectorAll('.step-view').forEach(el => el.classList.remove('active'));

  const success = document.getElementById('successScreen');
  success.classList.add('show');

  const fill = document.getElementById('progressFill');
  if (fill) fill.style.width = '100%';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}