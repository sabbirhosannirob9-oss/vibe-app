/* ============================================
   VIBE — PWA Install Manager
   ============================================
   - Shows banner on every visit
   - Cross hides only for current session
   - Once installed, never shows again
============================================ */

const PWA = {
  deferredPrompt: null,
  bannerEl: null,
  installedKey: 'vibe_pwa_installed',
  dismissedKey: 'vibe_pwa_dismissed_session'
};

// ============================================
// CHECK IF ALREADY INSTALLED
// ============================================
function isPWAInstalled() {
  // 1. Check display mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                    || window.navigator.standalone === true;

  if (isStandalone) return true;

  // 2. Check localStorage flag (from previous install)
  if (localStorage.getItem(PWA.installedKey) === 'true') return true;

  return false;
}

// ============================================
// CHECK IF DISMISSED THIS SESSION
// ============================================
function isDismissedThisSession() {
  return sessionStorage.getItem(PWA.dismissedKey) === 'true';
}

// ============================================
// MARK AS DISMISSED (session only)
// ============================================
function dismissForSession() {
  sessionStorage.setItem(PWA.dismissedKey, 'true');
  hideInstallBanner();
}

// ============================================
// MARK AS INSTALLED (permanent)
// ============================================
function markAsInstalled() {
  localStorage.setItem(PWA.installedKey, 'true');
  hideInstallBanner();
}

// ============================================
// SHOW / HIDE BANNER
// ============================================
function showInstallBanner() {
  if (!PWA.bannerEl) return;
  PWA.bannerEl.classList.add('show');
}

function hideInstallBanner() {
  if (!PWA.bannerEl) return;
  PWA.bannerEl.classList.remove('show');
}

// ============================================
// CAPTURE BEFOREINSTALLPROMPT EVENT
// ============================================
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent default mini-infobar (Chrome)
  e.preventDefault();

  // Save event for later
  PWA.deferredPrompt = e;

  // Show our custom banner
  attemptShowBanner();
});

// ============================================
// ATTEMPT TO SHOW BANNER
// ============================================
function attemptShowBanner() {
  // Don't show if:
  if (isPWAInstalled()) return;           // Already installed
  if (isDismissedThisSession()) return;   // Dismissed this session
  if (!PWA.deferredPrompt) return;        // No install prompt available

  // Show
  setTimeout(() => showInstallBanner(), 1500);
}

// ============================================
// TRIGGER INSTALL
// ============================================
async function triggerInstall() {
  if (!PWA.deferredPrompt) {
    // iOS or unsupported — show guide
    if (isIOS()) {
      showIOSGuide();
    } else {
      showToast('Install option not available. Try Chrome menu → "Install app".', 'info');
    }
    return;
  }

  // Show native install prompt
  PWA.deferredPrompt.prompt();

  const { outcome } = await PWA.deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    markAsInstalled();
    showToast('App installed! Check your home screen 🎉', 'success');
  } else {
    // User said "No" in native prompt — treat as session dismiss
    dismissForSession();
  }

  // Clear prompt — can only be used once
  PWA.deferredPrompt = null;
}

// ============================================
// DETECT iOS
// ============================================
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// ============================================
// iOS GUIDE MODAL
// ============================================
function showIOSGuide() {
  const overlay = document.getElementById('iosGuideOverlay');
  if (!overlay) return;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeIOSGuide() {
  const overlay = document.getElementById('iosGuideOverlay');
  if (!overlay) return;

  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================
// LISTEN FOR APP INSTALLED
// ============================================
window.addEventListener('appinstalled', () => {
  markAsInstalled();
  showToast('Vibe installed successfully! 🎉', 'success');
});

// ============================================
// INIT
// ============================================
function initPWA() {
  PWA.bannerEl = document.getElementById('pwaBanner');

  // Attach button listeners
  const installBtn = document.getElementById('pwaInstallBtn');
  const closeBtn = document.getElementById('pwaCloseBtn');

  if (installBtn) {
    installBtn.addEventListener('click', triggerInstall);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', dismissForSession);
  }

  // iOS guide close
  const iosClose = document.getElementById('iosGuideClose');
  if (iosClose) {
    iosClose.addEventListener('click', closeIOSGuide);
  }

  const iosOverlay = document.getElementById('iosGuideOverlay');
  if (iosOverlay) {
    iosOverlay.addEventListener('click', (e) => {
      if (e.target === iosOverlay) closeIOSGuide();
    });
  }

  // If iOS and not installed and not dismissed → show guide automatically?
  // No — let user trigger via install button. But we can show a small hint after 3 sec.
  if (isIOS() && !isPWAInstalled() && !isDismissedThisSession()) {
    // iOS-এ deferredPrompt নেই — তাই আমরা banner দেখাব না automatically
    // চাইলে install button show করব, কিন্তু সেটা Settings-এ আছে
    // অথবা পরে home-এ prompt দেখাব — সেটা পরের feature
  }
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPWA);
} else {
  initPWA();
}