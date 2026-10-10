/* ============================================
   VIBE — Main App Logic — FINAL v2.2.2
   ============================================
   Features:
   - Auth + Profile + Mood system
   - Feed + Posts (with image + likers)
   - Matches + Active users
   - Chat + Realtime + Read receipts + Typing
   - Chat photo send + Message menu
   - Gifts + Streaks + Confetti
   - Full-screen Profile Page
   - Avatar + Cover upload
   - Edit Profile Sheet
   - Privacy + Block + Report
   - Audio unlock + Notification
   - SMART BOTTOM NAV (badge, auto-hide, ripple, long-press)
   - LIKERS SHEET (who liked)
============================================ */

// ============================================
// STATE
// ============================================
const app = {
  user: null,
  profile: null,
  currentMood: null,
  currentView: 'feed',
  matches: [],
  activeUsers: [],
  chats: [],
  feedPosts: [],
  myPosts: [],
  blockedUsers: [],
  feedOffset: 0,
  feedHasMore: true,
  currentRoom: null,
  currentPartner: null,
  currentPostId: null,
  currentReplyTo: null,
  realtimeChannel: null,
  typingChannel: null,
  typingTimeout: null,
  partnerTyping: false,
  partnerTypingTimer: null,
  profileTab: 'posts',
  moodChangeCount: 0,
  lastMoodChangeAt: null,
  giftStats: null,
  reportTarget: null,
  reportReason: null,
  contextChat: null,
  viewingProfile: null,
  soundEnabled: true,
  vibrationEnabled: true,
  notificationsEnabled: true,
  unreadChatCount: 0,
  _pendingPostImage: null,
  _settingsInited: false,
  _navInited: false,
  _profileTabsInited: false,
  _feedRendering: false,
  _backInited: false,
  _chatMenuInited: false,
  _contextMenuInited: false,
  _newFeaturesBooted: false,
  _smartNavInited: false,
  _lastScrollY: 0,
  _navHidden: false
};

// ============================================
// INIT
// ============================================
(async () => {
  try {
    app.user = await requireAuth();
    if (!app.user) return;

    app.profile = await getUserProfile(app.user.id);
    if (!app.profile) {
      window.location.href = 'setup.html';
      return;
    }

    if (!app.profile.city || !app.profile.age) {
      window.location.href = 'setup.html';
      return;
    }

    loadUserPreferences();

    await updateLastSeen();
    await loadCurrentMood();
    await loadBlockedUsers();

    renderProfileView();
    setupNavigation();
    setupSmartNav();
    setupMoodModal();
    setupChatRoom();
    setupProfileActions();
    setupProfileTabs();
    setupGiftSystem();
    setupPostSystem();
    setupBackButton();
    setupChatMenu();
    setupChatContextMenu();
    setupSettingsToggles();
    setupBlockedUsers();
    setupReportSheet();
    setupNotifications();
    renderEmptyStates();

    bootVibeNewFeatures();

    hideAppLoading();

    const urlHash = window.location.hash.replace('#', '');
    const validHash = ['feed', 'matches', 'chats', 'profile', 'settings'].includes(urlHash);
    const startView = validHash ? urlHash : 'feed';

    switchView(startView, false);

    await loadFeed();
    renderFeed();

    await Promise.allSettled([
      loadMatches(),
      loadGiftStats(),
      loadActiveUsers(),
      loadChats()
    ]);

    renderFeed();

    setInterval(updateLastSeen, 2 * 60 * 1000);
    setInterval(loadActiveUsers, 60 * 1000);
    setInterval(refreshNavBadge, 30 * 1000);

    window.addEventListener('themechange', () => {
      const toggle = document.getElementById('profileDarkToggle');
      if (toggle) updateProfileToggleState(toggle);
    });

    console.log('✅ App initialized (v2.2.2)');

  } catch (err) {
    console.error('App init error:', err);
    hideAppLoading();
    showToast('Something went wrong. Please reload.', 'error');
  }
})();

// ============================================
// LOADING
// ============================================
function hideAppLoading() {
  const el = document.getElementById('appLoading');
  if (el) {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 400);
  }
}

// ============================================
// VERIFIED BADGE
// ============================================
function verifiedBadgeHTML(isVerified, size = 'default') {
  if (!isVerified) return '';
  const sizeClass = size === 'lg' ? 'badge-lg'
                  : size === 'sm' ? 'badge-sm'
                  : size === 'chat' ? 'badge-chat' : '';
  return `<span class="verified-badge ${sizeClass}" aria-label="Verified">
    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </span>`;
}

// ============================================
// USER PREFERENCES
// ============================================
function loadUserPreferences() {
  app.soundEnabled = localStorage.getItem('vibe_sound') !== 'false';
  app.vibrationEnabled = localStorage.getItem('vibe_vibration') !== 'false';
  app.notificationsEnabled = localStorage.getItem('vibe_notifications') !== 'false';
  window.__vibeSoundEnabled = app.soundEnabled;
}

function saveUserPreference(key, value) {
  localStorage.setItem(`vibe_${key}`, String(value));
  if (key === 'sound') window.__vibeSoundEnabled = value;
}

// ============================================
// SMART BOTTOM NAVIGATION
// ============================================
function setupSmartNav() {
  if (app._smartNavInited) return;
  app._smartNavInited = true;

  const nav = document.querySelector('.bottom-nav');
  if (!nav) return;

  // ─── TAP FEEDBACK (RIPPLE + HAPTIC) ───
  nav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('touchstart', (e) => {
      createNavRipple(item, e);
      if (app.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(8);
      }
    }, { passive: true });

    item.addEventListener('click', (e) => {
      if (item.__longPressed) {
        item.__longPressed = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    });

    // ─── LONG-PRESS HANDLERS ───
    let pressTimer = null;

    const startPress = () => {
      pressTimer = setTimeout(() => {
        item.__longPressed = true;

        if (app.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate([10, 30, 10]);
        }

        const view = item.dataset.view;

        if (view === 'feed') {
          const feedList = document.getElementById('feedList');
          if (feedList) feedList.scrollTop = 0;
          window.scrollTo({ top: 0, behavior: 'smooth' });
          showToast('Feed scroll → top', 'info');
        } else if (view === 'chats') {
          markAllChatsRead();
        } else if (view === 'profile') {
          openEditProfileSheet();
        } else if (view === 'matches') {
          loadMatches();
          showToast('Refreshing matches…', 'info');
        } else if (view === 'settings') {
          toggleTheme();
          showToast('Theme toggled', 'info');
        }
      }, 550);
    };

    const cancelPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    item.addEventListener('touchstart', startPress, { passive: true });
    item.addEventListener('touchend', cancelPress);
    item.addEventListener('touchmove', cancelPress);
    item.addEventListener('touchcancel', cancelPress);
    item.addEventListener('mousedown', startPress);
    item.addEventListener('mouseup', cancelPress);
    item.addEventListener('mouseleave', cancelPress);

    // ─── DOUBLE-TAP PROFILE → EDIT ───
    let lastTap = 0;
    item.addEventListener('click', () => {
      if (item.dataset.view === 'profile') {
        const now = Date.now();
        if (now - lastTap < 300) {
          openEditProfileSheet();
          lastTap = 0;
        } else {
          lastTap = now;
        }
      }
    });
  });

  // ─── AUTO-HIDE ON SCROLL ───
  let scrollTimeout = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) return;

    scrollTimeout = setTimeout(() => {
      scrollTimeout = null;

      const y = window.scrollY;
      const navEl = document.querySelector('.bottom-nav');
      if (!navEl) return;

      if (y < 30) {
        navEl.classList.remove('nav-hidden');
        app._navHidden = false;
        return;
      }

      if (document.getElementById('chatRoom')?.classList.contains('open')) return;

      const openSheet = document.querySelector(
        '.modal-overlay.open, .gift-popup-overlay.open, .create-post-overlay.open, .comment-sheet-overlay.open, .sheet-overlay.open, .profile-page.open, .edit-profile-overlay.open'
      );
      if (openSheet) return;

      const delta = y - app._lastScrollY;

      if (delta > 8 && !app._navHidden) {
        navEl.classList.add('nav-hidden');
        app._navHidden = true;
      } else if (delta < -8 && app._navHidden) {
        navEl.classList.remove('nav-hidden');
        app._navHidden = false;
      }

      app._lastScrollY = y;
    }, 50);
  }, { passive: true });

  // ─── KEYBOARD-AWARE ───
  document.addEventListener('focusin', (e) => {
    if (e.target.matches('input, textarea')) {
      nav.classList.add('nav-keyboard');
    }
  });
  document.addEventListener('focusout', () => {
    nav.classList.remove('nav-keyboard');
  });

  // ─── NAV DOT FOR NEW NOTIFICATIONS ───
  updateNavDots();
}

function createNavRipple(item, e) {
  const ripple = document.createElement('span');
  ripple.className = 'nav-ripple';

  const rect = item.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  const x = (touch.clientX || (rect.left + rect.width / 2)) - rect.left;
  const y = (touch.clientY || (rect.top + rect.height / 2)) - rect.top;

  const size = Math.max(rect.width, rect.height) * 1.6;

  ripple.style.width = size + 'px';
  ripple.style.height = size + 'px';
  ripple.style.left = (x - size / 2) + 'px';
  ripple.style.top = (y - size / 2) + 'px';

  item.appendChild(ripple);

  setTimeout(() => {
    if (ripple.parentNode) ripple.remove();
  }, 600);
}

function updateNavDots() {
  const profileNav = document.querySelector('.nav-item[data-view="profile"]');
  if (!profileNav) return;

  const hasAvatar = !!app.profile?.avatar_url;
  const hasCover = !!app.profile?.cover_url;
  const hasBio = !!app.profile?.bio;

  if (!hasAvatar && !hasCover && !hasBio) {
    profileNav.classList.add('has-dot');
  } else {
    profileNav.classList.remove('has-dot');
  }
}

async function markAllChatsRead() {
  if (!app.chats || app.chats.length === 0) {
    showToast('No chats to mark', 'info');
    return;
  }

  try {
    const roomIds = app.chats.map(c => c.room.id);

    const { error } = await sb
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('room_id', roomIds)
      .neq('sender_id', app.user.id)
      .is('read_at', null);

    if (error) throw error;

    showToast('All chats marked as read', 'success');
    await loadChats();
  } catch (err) {
    console.error('Mark all read error:', err);
    showToast('Failed to mark all read', 'error');
  }
}

// ⚡ Real-time nav badge refresh
function refreshNavBadge() {
  if (app.currentView === 'chats') return; // already in chats
  loadChats();
}

// ============================================
// BACK BUTTON
// ============================================
function setupBackButton() {
  if (app._backInited) return;
  app._backInited = true;

  history.pushState({ vibe: true }, '', location.href);

  window.addEventListener('popstate', (e) => {
    const editSheet = document.getElementById('editProfileSheet');
    if (editSheet && editSheet.classList.contains('open')) {
      e.preventDefault();
      history.pushState(null, '', location.href);
      closeEditProfileSheet();
      return;
    }

    const likersSheet = document.getElementById('likersSheet');
    if (likersSheet && likersSheet.classList.contains('open')) {
      e.preventDefault();
      history.pushState(null, '', location.href);
      closeLikersSheet();
      return;
    }

    const profilePage = document.getElementById('userProfilePage');
    if (profilePage && profilePage.classList.contains('open')) {
      e.preventDefault();
      history.pushState(null, '', location.href);
      closeFullProfile();
      return;
    }

    const chatRoom = document.getElementById('chatRoom');
    if (chatRoom && chatRoom.classList.contains('open')) {
      e.preventDefault();
      history.pushState(null, '', location.href);
      closeChatRoom();
      return;
    }

    const openModal = document.querySelector(
      '.modal-overlay.open, .gift-popup-overlay.open, .create-post-overlay.open, .comment-sheet-overlay.open, .sheet-overlay.open'
    );
    if (openModal) {
      e.preventDefault();
      history.pushState(null, '', location.href);
      openModal.classList.remove('open');
      document.body.style.overflow = '';
      return;
    }

    if (app.currentView !== 'feed') {
      e.preventDefault();
      history.pushState(null, '', location.href);
      switchView('feed');
      return;
    }
  });
}

// ============================================
// EMPTY STATES
// ============================================
function renderEmptyStates() {
  const chatEmptyIll = document.getElementById('chatEmptyIllustration');
  if (chatEmptyIll) chatEmptyIll.innerHTML = getIcon('empty_chat');

  const giftsEmptyIll = document.getElementById('giftsEmptyIllustration');
  if (giftsEmptyIll) giftsEmptyIll.innerHTML = getIcon('empty_moon');
}

function emptyMatchesHTML() {
  return `
    <div class="app-empty">
      <div class="app-empty-illustration">${getIcon('empty_moon')}</div>
      <h3 class="app-empty-title">No one yet</h3>
      <p class="app-empty-text">No one else is on your vibe right now. Check back later.</p>
    </div>
  `;
}

function emptyMoodHTML() {
  return `
    <div class="app-empty">
      <div class="app-empty-illustration">${getIcon('empty_search')}</div>
      <h3 class="app-empty-title">Set your mood first</h3>
      <p class="app-empty-text">Pick a mood to see who's on your wavelength today.</p>
    </div>
  `;
}

// ============================================
// NAVIGATION
// ============================================
function setupNavigation() {
  if (app._navInited) return;
  app._navInited = true;

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      switchView(item.dataset.view);
    });
  });

  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '');
    if (['feed', 'matches', 'chats', 'profile', 'settings'].includes(h) && h !== app.currentView) {
      switchView(h, false);
    }
  });
}

function switchView(view, updateHash = true) {
  const validViews = ['feed', 'matches', 'chats', 'profile', 'settings'];
  if (!validViews.includes(view)) return;

  app.currentView = view;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + view);
  if (target) target.classList.add('active');

  if (updateHash) {
    history.replaceState(null, '', '#' + view);
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
  app._lastScrollY = 0;

  if (view === 'feed') {
    if (app.feedPosts.length === 0) {
      loadFeed().then(() => { renderFeed(); forceRepaint('feedList'); });
    } else {
      renderFeed();
      forceRepaint('feedList');
    }
  }

  if (view === 'chats') {
    if (app.chats.length === 0) loadChats();
    loadActiveUsers();
  }

  if (view === 'settings') initSettingsView();

  if (view === 'profile') {
    loadGiftStats();
    if (app.profileTab === 'posts') loadMyPosts();
    if (typeof setupProfileImageButtons === 'function') setupProfileImageButtons();
    if (typeof updateNavDots === 'function') updateNavDots();
  }

  if (view === 'matches') {
    if (app.matches.length === 0 && app.currentMood) {
      loadMatches();
    } else {
      renderMatches();
    }
    forceRepaint('matchList');
  }
}

function forceRepaint(elementId) {
  const el = document.getElementById(elementId);
  if (el) void el.offsetHeight;
}

// ============================================
// BLOCKED USERS
// ============================================
async function loadBlockedUsers() {
  try {
    const { data, error } = await sb
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', app.user.id);

    if (error) throw error;
    app.blockedUsers = (data || []).map(b => b.blocked_id);
  } catch (err) {
    console.error('Load blocked error:', err);
    app.blockedUsers = [];
  }
}

function isBlocked(userId) {
  return app.blockedUsers.includes(userId);
}

async function blockUser(userId) {
  try {
    const { error } = await sb
      .from('blocked_users')
      .insert({ blocker_id: app.user.id, blocked_id: userId });

    if (error) throw error;

    app.blockedUsers.push(userId);
    showToast('User blocked', 'success');

    if (app.viewingProfile?.id === userId) closeFullProfile();

    await loadChats();
    await loadMatches();
    await loadActiveUsers();
    closeChatMenu();
  } catch (err) {
    console.error('Block error:', err);
    showToast('Failed to block user', 'error');
  }
}

async function unblockUser(userId) {
  try {
    const { error } = await sb
      .from('blocked_users')
      .delete()
      .eq('blocker_id', app.user.id)
      .eq('blocked_id', userId);

    if (error) throw error;

    app.blockedUsers = app.blockedUsers.filter(id => id !== userId);
    showToast('User unblocked', 'success');

    await loadBlockedUsersList();

    if (app.viewingProfile?.id === userId) {
      const blockLabel = document.getElementById('ppBlockBtnLabel');
      const blockBtn = document.getElementById('ppBlockBtn');
      if (blockLabel) blockLabel.textContent = 'Block';
      if (blockBtn) blockBtn.classList.remove('unblock');
    }

    await loadChats();
  } catch (err) {
    console.error('Unblock error:', err);
    showToast('Failed to unblock', 'error');
  }
}

function setupBlockedUsers() {
  document.getElementById('blockedUsersRow')?.addEventListener('click', () => {
    openBlockedUsersSheet();
  });

  document.getElementById('blockedUsersClose')?.addEventListener('click', () => {
    closeSheet('blockedUsersSheet');
  });

  document.getElementById('blockedUsersSheet')?.addEventListener('click', (e) => {
    if (e.target.id === 'blockedUsersSheet') closeSheet('blockedUsersSheet');
  });
}

async function openBlockedUsersSheet() {
  openSheet('blockedUsersSheet');
  await loadBlockedUsersList();
}

async function loadBlockedUsersList() {
  const container = document.getElementById('blockedUsersList');
  if (!container) return;

  if (app.blockedUsers.length === 0) {
    container.innerHTML = `
      <div class="app-empty" style="padding: 32px 16px;">
        <div class="app-empty-title">No blocked users</div>
        <div class="app-empty-text">You haven't blocked anyone yet.</div>
      </div>
    `;
    return;
  }

  const { data: profiles } = await sb
    .from('profiles')
    .select('id, name, is_verified')
    .in('id', app.blockedUsers);

  if (!profiles || profiles.length === 0) {
    container.innerHTML = `<div class="app-empty-text">No blocked users found.</div>`;
    return;
  }

  container.innerHTML = profiles.map(p => {
    const initial = (p.name || 'U').charAt(0).toUpperCase();
    return `
      <div class="blocked-user-item">
        <div class="avatar" style="width: 40px; height: 40px; font-size: 14px;">${initial}</div>
        <div class="blocked-user-info">
          <div class="blocked-user-name">${escapeHtml(p.name)}</div>
        </div>
        <button class="blocked-user-unblock" data-user-id="${p.id}">Unblock</button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.blocked-user-unblock').forEach(btn => {
    btn.addEventListener('click', async () => {
      await unblockUser(btn.dataset.userId);
    });
  });
}

// ============================================
// REPORT
// ============================================
function setupReportSheet() {
  document.querySelectorAll('.report-reason').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.report-reason').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      app.reportReason = btn.dataset.reason;

      const submitBtn = document.getElementById('reportSubmitBtn');
      if (submitBtn) submitBtn.disabled = false;
    });
  });

  document.getElementById('reportSubmitBtn')?.addEventListener('click', submitReport);
  document.getElementById('reportCancel')?.addEventListener('click', () => closeSheet('reportSheet'));
  document.getElementById('reportSheet')?.addEventListener('click', (e) => {
    if (e.target.id === 'reportSheet') closeSheet('reportSheet');
  });
}

function openReportSheet(userId) {
  app.reportTarget = userId;
  app.reportReason = null;

  document.querySelectorAll('.report-reason').forEach(b => b.classList.remove('selected'));
  const submitBtn = document.getElementById('reportSubmitBtn');
  if (submitBtn) submitBtn.disabled = true;

  const details = document.getElementById('reportDetails');
  if (details) details.value = '';

  openSheet('reportSheet');
}

async function submitReport() {
  if (!app.reportTarget || !app.reportReason) return;

  const submitBtn = document.getElementById('reportSubmitBtn');
  const details = document.getElementById('reportDetails')?.value.trim() || '';

  setButtonLoading(submitBtn, true);

  try {
    const { error } = await sb
      .from('reports')
      .insert({
        reporter_id: app.user.id,
        reported_id: app.reportTarget,
        reason: app.reportReason,
        details: details || null
      });

    if (error) throw error;

    showToast('Report submitted. Thank you!', 'success');
    closeSheet('reportSheet');

    app.reportTarget = null;
    app.reportReason = null;
  } catch (err) {
    console.error('Report error:', err);
    showToast('Failed to submit report', 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// ============================================
// SHEET HELPERS
// ============================================
function openSheet(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeSheet(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ============================================
// CHAT MENU
// ============================================
function setupChatMenu() {
  if (app._chatMenuInited) return;
  app._chatMenuInited = true;

  document.getElementById('chatMenuBtn')?.addEventListener('click', openChatMenu);
  document.getElementById('chatMenuCancel')?.addEventListener('click', closeChatMenu);
  document.getElementById('chatMenuSheet')?.addEventListener('click', (e) => {
    if (e.target.id === 'chatMenuSheet') closeChatMenu();
  });
}

function openChatMenu() {
  const partner = app.currentPartner;
  if (!partner) return;

  const optionsEl = document.getElementById('chatMenuOptions');
  if (!optionsEl) return;

  const blocked = isBlocked(partner.id);

  optionsEl.innerHTML = `
    <button class="sheet-option" data-action="view-profile">
      <div class="sheet-option-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <div class="sheet-option-content">
        <div class="sheet-option-label">View Profile</div>
      </div>
    </button>

    ${blocked ? `
      <button class="sheet-option" data-action="unblock">
        <div class="sheet-option-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
        </div>
        <div class="sheet-option-content">
          <div class="sheet-option-label">Unblock User</div>
        </div>
      </button>
    ` : `
      <button class="sheet-option danger" data-action="block">
        <div class="sheet-option-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
        </div>
        <div class="sheet-option-content">
          <div class="sheet-option-label">Block User</div>
          <div class="sheet-option-description">You won't see their messages</div>
        </div>
      </button>
    `}

    <button class="sheet-option danger" data-action="report">
      <div class="sheet-option-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
          <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
      </div>
      <div class="sheet-option-content">
        <div class="sheet-option-label">Report User</div>
        <div class="sheet-option-description">Help us keep Vibe safe</div>
      </div>
    </button>
  `;

  optionsEl.querySelectorAll('.sheet-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      closeChatMenu();

      if (action === 'block') {
        if (confirm(`Block ${partner.name}?`)) blockUser(partner.id);
      } else if (action === 'unblock') {
        unblockUser(partner.id);
      } else if (action === 'report') {
        openReportSheet(partner.id);
      } else if (action === 'view-profile') {
        openFullProfile(partner.id);
      }
    });
  });

  openSheet('chatMenuSheet');
}

function closeChatMenu() {
  closeSheet('chatMenuSheet');
}

// ============================================
// CHAT CONTEXT MENU
// ============================================
function setupChatContextMenu() {
  if (app._contextMenuInited) return;
  app._contextMenuInited = true;

  document.getElementById('chatContextCancel')?.addEventListener('click', closeChatContextMenu);
  document.getElementById('chatContextMenu')?.addEventListener('click', (e) => {
    if (e.target.id === 'chatContextMenu') closeChatContextMenu();
  });
}

function attachChatListLongPress(container) {
  const LONG_PRESS_MS = 500;
  let pressTimer = null;
  let didTrigger = false;

  container.querySelectorAll('.chat-item').forEach(item => {
    item.dataset.longPressed = 'false';

    const startPress = () => {
      didTrigger = false;
      item.classList.add('pressing');

      pressTimer = setTimeout(() => {
        didTrigger = true;
        item.dataset.longPressed = 'true';
        item.classList.remove('pressing');

        if (app.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate([15, 40, 15]);
        }

        showChatContextMenu(item);
      }, LONG_PRESS_MS);
    };

    const cancelPress = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      item.classList.remove('pressing');
    };

    item.addEventListener('touchstart', startPress, { passive: true });
    item.addEventListener('touchend', cancelPress);
    item.addEventListener('touchmove', cancelPress);
    item.addEventListener('touchcancel', cancelPress);
    item.addEventListener('mousedown', startPress);
    item.addEventListener('mouseup', cancelPress);
    item.addEventListener('mouseleave', cancelPress);

    item.addEventListener('click', (e) => {
      if (didTrigger) {
        e.stopPropagation();
        e.preventDefault();
        didTrigger = false;
      }
    }, true);
  });
}

function showChatContextMenu(chatItem) {
  const userId = chatItem.dataset.userId;
  const chatId = chatItem.dataset.chatId;
  const name = chatItem.dataset.partnerName;
  const verified = chatItem.dataset.partnerVerified === 'true';
  const lastMessage = chatItem.dataset.lastMessage;
  const isPinned = chatItem.dataset.pinned === 'true';
  const isMuted = chatItem.dataset.muted === 'true';

  app.contextChat = { userId, chatId, name, verified, isPinned, isMuted };

  const avatarEl = document.getElementById('contextChatAvatar');
  const nameEl = document.getElementById('contextChatName');
  const subEl = document.getElementById('contextChatSub');

  if (avatarEl) avatarEl.textContent = (name || 'U').charAt(0).toUpperCase();
  if (nameEl) nameEl.innerHTML = escapeHtml(name) + verifiedBadgeHTML(verified, 'sm');
  if (subEl) subEl.textContent = lastMessage || 'Say hi to start';

  const optionsEl = document.getElementById('chatContextOptions');
  if (!optionsEl) return;

  optionsEl.innerHTML = `
    <button class="sheet-option" data-action="message">
      <div class="sheet-option-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <div class="sheet-option-content">
        <div class="sheet-option-label">Message</div>
      </div>
    </button>

    <button class="sheet-option" data-action="view-profile">
      <div class="sheet-option-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <div class="sheet-option-content">
        <div class="sheet-option-label">View Profile</div>
      </div>
    </button>

    <button class="sheet-option" data-action="mute">
      <div class="sheet-option-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${isMuted ? `
            <path d="M3 9v6h4l5 5V4L7 9H3z"></path>
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"></path>
            <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
          ` : `
            <path d="M3 9v6h4l5 5V4L7 9H3z"></path>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          `}
        </svg>
      </div>
      <div class="sheet-option-content">
        <div class="sheet-option-label">${isMuted ? 'Unmute Chat' : 'Mute Chat'}</div>
        <div class="sheet-option-description">${isMuted ? 'Turn on notifications' : 'Turn off notifications'}</div>
      </div>
    </button>

    <button class="sheet-option" data-action="pin">
      <div class="sheet-option-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="17" x2="12" y2="22"></line>
          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"></path>
        </svg>
      </div>
      <div class="sheet-option-content">
        <div class="sheet-option-label">${isPinned ? 'Unpin Chat' : 'Pin Chat'}</div>
        <div class="sheet-option-description">${isPinned ? 'Remove from top' : 'Pin to top'}</div>
      </div>
    </button>

    <button class="sheet-option danger" data-action="delete">
      <div class="sheet-option-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </div>
      <div class="sheet-option-content">
        <div class="sheet-option-label">Delete Chat</div>
        <div class="sheet-option-description">Remove from your list</div>
      </div>
    </button>

    <button class="sheet-option danger" data-action="block">
      <div class="sheet-option-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
      </div>
      <div class="sheet-option-content">
        <div class="sheet-option-label">Block User</div>
      </div>
    </button>

    <button class="sheet-option danger" data-action="report">
      <div class="sheet-option-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
          <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
      </div>
      <div class="sheet-option-content">
        <div class="sheet-option-label">Report User</div>
      </div>
    </button>
  `;

  optionsEl.querySelectorAll('.sheet-option').forEach(btn => {
    btn.addEventListener('click', () => {
      handleContextAction(btn.dataset.action);
    });
  });

  openSheet('chatContextMenu');
}

function closeChatContextMenu() {
  closeSheet('chatContextMenu');
  app.contextChat = null;
}

async function handleContextAction(action) {
  const ctx = app.contextChat;
  if (!ctx) return;

  closeChatContextMenu();

  if (action === 'message') {
    openChatWithUser(ctx.userId, ctx.name);
  } else if (action === 'view-profile') {
    openFullProfile(ctx.userId);
  } else if (action === 'mute') {
    await toggleMuteChat(ctx.chatId, !ctx.isMuted);
  } else if (action === 'pin') {
    await togglePinChat(ctx.chatId, !ctx.isPinned);
  } else if (action === 'delete') {
    await deleteChatForMe(ctx.chatId);
  } else if (action === 'block') {
    if (confirm(`Block ${ctx.name}?`)) blockUser(ctx.userId);
  } else if (action === 'report') {
    openReportSheet(ctx.userId);
  }
}

async function toggleMuteChat(chatId, mute) {
  try {
    const { error } = await sb
      .from('chat_rooms')
      .update({ muted: mute })
      .eq('id', parseInt(chatId, 10));

    if (error) throw error;

    showToast(mute ? '🔕 Chat muted' : '🔔 Chat unmuted', 'success');

    const chat = app.chats.find(c => c.room.id === parseInt(chatId, 10));
    if (chat) chat.room.muted = mute;

    await loadChats();
  } catch (err) {
    console.error('Mute error:', err);
    showToast('Failed to update', 'error');
  }
}

async function togglePinChat(chatId, pin) {
  try {
    const { error } = await sb
      .from('chat_rooms')
      .update({ pinned: pin })
      .eq('id', parseInt(chatId, 10));

    if (error) throw error;

    showToast(pin ? '📌 Chat pinned' : 'Chat unpinned', 'success');

    const chat = app.chats.find(c => c.room.id === parseInt(chatId, 10));
    if (chat) chat.room.pinned = pin;

    await loadChats();
  } catch (err) {
    console.error('Pin error:', err);
    showToast('Failed to update', 'error');
  }
}

async function deleteChatForMe(chatId) {
  try {
    const { data: room } = await sb
      .from('chat_rooms')
      .select('deleted_for')
      .eq('id', parseInt(chatId, 10))
      .single();

    const currentDeleted = room?.deleted_for || [];
    if (currentDeleted.includes(app.user.id)) return;

    const newDeleted = [...currentDeleted, app.user.id];

    const { error } = await sb
      .from('chat_rooms')
      .update({ deleted_for: newDeleted })
      .eq('id', parseInt(chatId, 10));

    if (error) throw error;

    showToast('🗑️ Chat deleted', 'success');
    await loadChats();
  } catch (err) {
    console.error('Delete chat error:', err);
    showToast('Failed to delete', 'error');
  }
}

// ============================================
// FULL PROFILE PAGE
// ============================================
async function openFullProfile(userId) {
  if (!userId) return;

  if (isBlocked(userId)) {
    showToast('This user is blocked', 'info');
    return;
  }

  if (userId === app.user.id) {
    switchView('profile');
    return;
  }

  const page = document.getElementById('userProfilePage');
  if (!page) return;

  history.pushState({ profilePage: userId }, '', location.href);

  page.classList.add('open');
  page.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const scroll = document.getElementById('profilePageScroll');
  if (scroll) scroll.scrollTop = 0;

  const postsList = document.getElementById('ppPostsList');
  if (postsList) {
    postsList.innerHTML = `<div class="pp-loading"><div class="spinner"></div>Loading…</div>`;
  }

  try {
    const { data: profile, error } = await sb
      .from('profiles')
      .select('id, name, age, gender, city, interests, bio, is_verified, last_seen, streak_count, total_gifts, avatar_url, cover_url, created_at, profile_visibility')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!profile) {
      showToast('Profile not found', 'error');
      closeFullProfile();
      return;
    }

    if (profile.profile_visibility === 'nobody' && profile.id !== app.user.id) {
      showToast('This profile is private', 'info');
      closeFullProfile();
      return;
    }

    app.viewingProfile = profile;
    renderFullProfile(profile);

    await loadProfilePosts(userId);

  } catch (err) {
    console.error('openFullProfile error:', err);
    showToast('Failed to load profile', 'error');
    closeFullProfile();
  }
}

function renderFullProfile(profile) {
  const p = profile;

  const titleEl = document.getElementById('profilePageTitle');
  if (titleEl) titleEl.textContent = p.name || 'Profile';

  const coverImg = document.getElementById('ppCoverImg');
  const coverGrad = document.getElementById('ppCoverGradient');
  if (coverImg) {
    if (p.cover_url) {
      coverImg.src = p.cover_url;
      coverImg.style.display = 'block';
      if (coverGrad) coverGrad.style.display = 'block';
    } else {
      coverImg.src = '';
      coverImg.style.display = 'none';
      if (coverGrad) coverGrad.style.display = 'none';
    }
  }

  const avatarImg = document.getElementById('ppAvatarImg');
  const avatarFallback = document.getElementById('ppAvatarFallback');
  if (p.avatar_url) {
    if (avatarImg) {
      avatarImg.src = p.avatar_url;
      avatarImg.style.display = 'block';
    }
    if (avatarFallback) avatarFallback.style.display = 'none';
  } else {
    if (avatarImg) {
      avatarImg.src = '';
      avatarImg.style.display = 'none';
    }
    if (avatarFallback) {
      avatarFallback.textContent = (p.name || 'U').charAt(0).toUpperCase();
      avatarFallback.style.display = 'flex';
    }
  }

  const dot = document.getElementById('ppStatusDot');
  if (dot) {
    const status = getActiveStatus(p.last_seen);
    dot.className = 'pp-status-dot ' + status.color;
  }

  const nameEl = document.getElementById('ppName');
  if (nameEl) {
    nameEl.innerHTML = escapeHtml(p.name || 'User') + verifiedBadgeHTML(p.is_verified, 'lg');
  }

  const metaEl = document.getElementById('ppMeta');
  if (metaEl) {
    const parts = [];
    if (p.age) parts.push(`<span class="pp-meta-item">${getIcon('meta_age')}<span>${p.age}</span></span>`);
    if (p.gender) {
      const iconKey = p.gender === 'male' ? 'meta_male' : p.gender === 'female' ? 'meta_female' : 'meta_other';
      const label = p.gender.charAt(0).toUpperCase() + p.gender.slice(1);
      parts.push(`<span class="pp-meta-item">${getIcon(iconKey)}<span>${label}</span></span>`);
    }
    if (p.city) parts.push(`<span class="pp-meta-item">${getIcon('meta_city')}<span>${escapeHtml(p.city)}</span></span>`);
    metaEl.innerHTML = parts.join('<span class="pp-meta-dot"></span>');
  }

  const bioEl = document.getElementById('ppBio');
  if (bioEl) {
    if (p.bio) {
      bioEl.textContent = p.bio;
      bioEl.style.display = 'block';
    } else {
      bioEl.textContent = '';
      bioEl.style.display = 'none';
    }
  }

  const streakEl = document.getElementById('ppStreak');
  const giftsEl = document.getElementById('ppGifts');
  if (streakEl) streakEl.textContent = p.streak_count || 0;
  if (giftsEl) giftsEl.textContent = p.total_gifts || 0;

  const interestsWrap = document.getElementById('ppInterestsWrap');
  const interestsEl = document.getElementById('ppInterests');
  if (p.interests && p.interests.length > 0) {
    if (interestsWrap) interestsWrap.style.display = 'block';
    if (interestsEl) {
      interestsEl.innerHTML = p.interests.map(i => `<span class="chip">${escapeHtml(i)}</span>`).join('');
    }
  } else {
    if (interestsWrap) interestsWrap.style.display = 'none';
  }

  const blockLabel = document.getElementById('ppBlockBtnLabel');
  const blockBtn = document.getElementById('ppBlockBtn');
  if (blockLabel && blockBtn) {
    const blocked = isBlocked(p.id);
    blockLabel.textContent = blocked ? 'Unblock' : 'Block';
    blockBtn.classList.toggle('unblock', blocked);
  }

  const aboutAge = document.getElementById('ppAboutAge');
  const aboutGender = document.getElementById('ppAboutGender');
  const aboutCity = document.getElementById('ppAboutCity');
  const aboutLastSeen = document.getElementById('ppAboutLastSeen');
  const aboutJoined = document.getElementById('ppAboutJoined');

  if (aboutAge) aboutAge.textContent = p.age || '—';
  if (aboutGender) aboutGender.textContent = p.gender
    ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1)
    : '—';
  if (aboutCity) aboutCity.textContent = p.city || '—';

  const statusInfo = getActiveStatus(p.last_seen);
  if (aboutLastSeen) aboutLastSeen.textContent = statusInfo.label || '—';

  if (aboutJoined) {
    if (p.created_at) {
      const joined = new Date(p.created_at);
      aboutJoined.textContent = joined.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      aboutJoined.textContent = '—';
    }
  }

  const aboutBioBlock = document.getElementById('ppAboutBioBlock');
  const aboutBio = document.getElementById('ppAboutBio');
  if (p.bio) {
    if (aboutBioBlock) aboutBioBlock.style.display = 'block';
    if (aboutBio) aboutBio.textContent = p.bio;
  } else {
    if (aboutBioBlock) aboutBioBlock.style.display = 'none';
  }
}

function closeFullProfile() {
  const page = document.getElementById('userProfilePage');
  if (!page) return;

  page.classList.remove('open');
  page.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  app.viewingProfile = null;

  switchProfileTab('posts');
}

async function loadProfilePosts(userId) {
  const listEl = document.getElementById('ppPostsList');
  if (!listEl) return;

  try {
    const posts = await fetchUserPosts(userId, 30);

    const postsCountEl = document.getElementById('ppPosts');
    if (postsCountEl) postsCountEl.textContent = posts.length;

    if (posts.length === 0) {
      listEl.innerHTML = `
        <div class="pp-empty">
          <div class="pp-empty-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="pp-empty-title">No posts yet</div>
          <div class="pp-empty-text">This user hasn't shared anything.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = posts.map(p => renderPostCard(p)).join('');
    attachPostListeners(listEl);

  } catch (err) {
    console.error('loadProfilePosts error:', err);
    listEl.innerHTML = `<div class="pp-loading">Failed to load posts</div>`;
  }
}

function switchProfileTab(tab) {
  const tabs = document.querySelectorAll('.pp-tab');
  const panes = document.querySelectorAll('.pp-tab-pane');

  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  panes.forEach(p => {
    const isMatch = p.id === 'ppPane' + tab.charAt(0).toUpperCase() + tab.slice(1);
    p.classList.toggle('active', isMatch);
  });
}

function setupProfilePageButtons() {
  document.getElementById('profilePageBack')?.addEventListener('click', () => {
    history.back();
  });

  document.getElementById('profilePageMenu')?.addEventListener('click', () => {
    const p = app.viewingProfile;
    if (!p) return;
    const blocked = isBlocked(p.id);

    const sheet = document.getElementById('chatContextMenu');
    const optionsEl = document.getElementById('chatContextOptions');
    const avatarEl = document.getElementById('contextChatAvatar');
    const nameEl = document.getElementById('contextChatName');
    const subEl = document.getElementById('contextChatSub');

    if (!sheet || !optionsEl) return;

    if (avatarEl) avatarEl.textContent = (p.name || 'U').charAt(0).toUpperCase();
    if (nameEl) nameEl.innerHTML = escapeHtml(p.name) + verifiedBadgeHTML(p.is_verified, 'sm');
    if (subEl) subEl.textContent = p.city || 'View profile options';

    optionsEl.innerHTML = `
      <button class="sheet-option ${blocked ? '' : 'danger'}" data-pp-action="block">
        <div class="sheet-option-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            ${blocked
              ? '<polyline points="8 12 11 15 16 9"></polyline>'
              : '<line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>'}
          </svg>
        </div>
        <div class="sheet-option-content">
          <div class="sheet-option-label">${blocked ? 'Unblock User' : 'Block User'}</div>
        </div>
      </button>

      <button class="sheet-option danger" data-pp-action="report">
        <div class="sheet-option-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
        </div>
        <div class="sheet-option-content">
          <div class="sheet-option-label">Report User</div>
        </div>
      </button>

      <button class="sheet-option" data-pp-action="copy-link">
        <div class="sheet-option-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </div>
        <div class="sheet-option-content">
          <div class="sheet-option-label">Copy Link</div>
        </div>
      </button>
    `;

    optionsEl.querySelectorAll('[data-pp-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.ppAction;
        closeChatContextMenu();

        if (action === 'block') {
          if (blocked) {
            await unblockUser(p.id);
          } else {
            if (confirm(`Block ${p.name}?`)) await blockUser(p.id);
          }
        } else if (action === 'report') {
          openReportSheet(p.id);
        } else if (action === 'copy-link') {
          const url = location.origin + '/profile?user=' + p.id;
          try {
            await navigator.clipboard.writeText(url);
            showToast('Link copied', 'success');
          } catch (_) {
            showToast('Copy failed', 'error');
          }
        }
      });
    });

    sheet.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  document.getElementById('ppMessageBtn')?.addEventListener('click', async () => {
    const p = app.viewingProfile;
    if (!p) return;
    closeFullProfile();
    await openChatWithUser(p.id, p.name);
  });

  document.getElementById('ppBlockBtn')?.addEventListener('click', async () => {
    const p = app.viewingProfile;
    if (!p) return;
    const blocked = isBlocked(p.id);
    if (blocked) {
      await unblockUser(p.id);
    } else {
      if (confirm(`Block ${p.name}?`)) await blockUser(p.id);
    }
  });

  document.getElementById('ppReportBtn')?.addEventListener('click', () => {
    const p = app.viewingProfile;
    if (!p) return;
    openReportSheet(p.id);
  });

  document.querySelectorAll('.pp-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchProfileTab(tab.dataset.tab);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && app.viewingProfile) {
      closeFullProfile();
    }
  });
}

// ============================================
// LOAD CURRENT MOOD
// ============================================
async function loadCurrentMood() {
  try {
    const { data, error } = await sb
      .from('vibes')
      .select('*')
      .eq('user_id', app.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Load mood error:', error);
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await sb
      .from('vibes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', app.user.id)
      .gte('created_at', todayStart.toISOString());

    app.moodChangeCount = count || 0;

    if (data) {
      app.currentMood = data.mood;
      app.lastMoodChangeAt = new Date(data.created_at);
      renderMyMood();
    } else {
      setTimeout(() => openMoodModal(true), 1200);
    }
  } catch (err) {
    console.error('loadCurrentMood error:', err);
  }
}

function renderMyMood() {
  if (!app.currentMood) return;
  const mood = getMoodById(app.currentMood);
  if (!mood) return;

  const emojiEl = document.getElementById('myMoodEmoji');
  const nameEl = document.getElementById('myMoodName');
  if (emojiEl) emojiEl.textContent = mood.emoji;
  if (nameEl) nameEl.textContent = mood.label;
}

// ============================================
// FEED
// ============================================
async function loadFeed(reset = true) {
  const listEl = document.getElementById('feedList');
  if (!listEl) return;
  if (app._feedRendering) return;

  app._feedRendering = true;

  try {
    if (reset) {
      app.feedOffset = 0;
      app.feedHasMore = true;
    }

    const posts = await fetchFeed(20, app.feedOffset);

    if (reset) app.feedPosts = [];
    app.feedPosts = app.feedPosts.concat(posts);
    app.feedOffset += posts.length;
    if (posts.length < 20) app.feedHasMore = false;
  } catch (err) {
    console.error('Load feed error:', err);
  } finally {
    app._feedRendering = false;
  }
}

function renderFeed() {
  const listEl = document.getElementById('feedList');
  if (!listEl) return;

  if (app.feedPosts.length === 0) {
    listEl.innerHTML = renderEmptyFeed();
  } else {
    listEl.innerHTML = app.feedPosts.map(p => renderPostCard(p)).join('');
    attachPostListeners(listEl);
  }
  void listEl.offsetHeight;
}

// ============================================
// POST SYSTEM
// ============================================
function setupPostSystem() {
  const fab = document.getElementById('fabCreatePost');
  if (fab) fab.addEventListener('click', openCreatePost);

  const closeBtn = document.getElementById('createPostClose');
  if (closeBtn) closeBtn.addEventListener('click', closeCreatePost);

  const overlay = document.getElementById('createPostOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target.id === 'createPostOverlay') closeCreatePost();
    });
  }

  const submitBtn = document.getElementById('createPostSubmit');
  if (submitBtn) submitBtn.addEventListener('click', submitPost);

  const input = document.getElementById('createPostInput');
  if (input) {
    input.addEventListener('input', () => {
      const len = input.value.length;
      const counter = document.getElementById('createPostCounter');
      const submit = document.getElementById('createPostSubmit');
      if (counter) {
        counter.textContent = `${len} / 280`;
        counter.classList.toggle('warn', len > 240 && len <= 270);
        counter.classList.toggle('danger', len > 270);
      }
      if (submit) {
        submit.disabled = (len === 0 && !app._pendingPostImage) || len > 280;
      }
    });
  }

  const commentOverlay = document.getElementById('commentSheetOverlay');
  if (commentOverlay) {
    commentOverlay.addEventListener('click', (e) => {
      if (e.target.id === 'commentSheetOverlay') closeCommentSheet();
    });
  }

  const commentInput = document.getElementById('commentInput');
  if (commentInput) {
    commentInput.addEventListener('input', () => {
      const sendBtn = document.getElementById('commentSendBtn');
      if (sendBtn) sendBtn.disabled = !commentInput.value.trim();
    });
    commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const sendBtn = document.getElementById('commentSendBtn');
        if (sendBtn && !sendBtn.disabled) submitComment();
      }
    });
  }

  const commentSend = document.getElementById('commentSendBtn');
  if (commentSend) commentSend.addEventListener('click', submitComment);

  const refreshBtn = document.getElementById('feedRefreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.classList.add('spinning');
      await loadFeed(true);
      renderFeed();
      setTimeout(() => btn.classList.remove('spinning'), 500);
    });
  }
}

function attachPostListeners(container) {
  container.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();

      const countSpan = btn.querySelector('.action-count');
      const postId = parseInt(btn.dataset.postId, 10);

      // v2.2.2 — Count-এ tap → likers sheet
      if (countSpan && (e.target === countSpan || countSpan.contains(e.target))) {
        openLikersSheet(postId);
        return;
      }

      const post = findPostById(postId);
      if (!post) return;

      const wasLiked = post.liked_by_me;
      post.liked_by_me = !wasLiked;
      post.like_count += wasLiked ? -1 : 1;

      btn.classList.toggle('liked', post.liked_by_me);
      if (countSpan) countSpan.textContent = post.like_count;
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', post.liked_by_me ? 'currentColor' : 'none');

      try {
        await toggleLike(postId, wasLiked);
      } catch (err) {
        console.error('Like error:', err);
        post.liked_by_me = wasLiked;
        post.like_count += wasLiked ? 1 : -1;
        btn.classList.toggle('liked', wasLiked);
        if (countSpan) countSpan.textContent = post.like_count;
        if (svg) svg.setAttribute('fill', wasLiked ? 'currentColor' : 'none');
      }
    });
  });

  container.querySelectorAll('.comment-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCommentSheet(parseInt(btn.dataset.postId, 10));
    });
  });

  container.querySelectorAll('.post-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showPostMenu(parseInt(btn.dataset.postId, 10), btn);
    });
  });

  // Image viewer (tap on post image)
  container.querySelectorAll('.post-card-image[data-viewer-url]').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = img.dataset.viewerUrl;
      if (url && typeof openImageViewer === 'function') openImageViewer(url);
    });
  });
}

function findPostById(postId) {
  return app.feedPosts.find(p => p.id === postId) || app.myPosts.find(p => p.id === postId);
}

// ============================================
// CREATE POST
// ============================================
function openCreatePost() {
  const overlay = document.getElementById('createPostOverlay');
  const input = document.getElementById('createPostInput');
  const counter = document.getElementById('createPostCounter');
  const submit = document.getElementById('createPostSubmit');
  const avatar = document.getElementById('createPostAvatar');
  const nameEl = document.getElementById('createPostUserName');

  if (avatar) avatar.textContent = (app.profile?.name || 'U').charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = app.profile?.name || 'You';

  if (input) {
    input.value = '';
    input.focus();
  }
  if (counter) counter.textContent = '0 / 280';
  if (submit) submit.disabled = true;

  clearCreatePostImage();

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCreatePost() {
  const overlay = document.getElementById('createPostOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

async function submitPost() {
  const input = document.getElementById('createPostInput');
  const submitBtn = document.getElementById('createPostSubmit');
  const content = input.value.trim();
  if (!content && !app._pendingPostImage) return;

  setButtonLoading(submitBtn, true);

  try {
    let imageData = null;

    if (app._pendingPostImage && typeof uploadPostImage === 'function') {
      imageData = await uploadPostImage(app._pendingPostImage);
    }

    const postPayload = { content: content || '' };
    if (imageData) {
      postPayload.image_url = imageData.url;
      postPayload.image_width = imageData.width;
      postPayload.image_height = imageData.height;
    }

    const newPost = await createPost(postPayload);
    showToast('Post shared!', 'success');
    closeCreatePost();
    clearCreatePostImage();

    const optimisticPost = {
      id: newPost.id,
      user_id: app.user.id,
      content: content,
      image_url: imageData?.url || null,
      image_width: imageData?.width || null,
      image_height: imageData?.height || null,
      created_at: newPost.created_at || new Date().toISOString(),
      author_name: app.profile.name,
      author_verified: app.profile.is_verified || false,
      author_avatar: app.profile.avatar_url || null,
      like_count: 0,
      comment_count: 0,
      liked_by_me: false
    };

    app.feedPosts.unshift(optimisticPost);

    if (app.currentView === 'feed') {
      renderFeed();
      forceRepaint('feedList');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (app.currentView === 'profile' && app.profileTab === 'posts') {
      app.myPosts.unshift(optimisticPost);
      renderMyPosts();
    }
  } catch (err) {
    console.error('Post error:', err);
    showToast(err.message || 'Failed to post', 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// ============================================
// POST MENU
// ============================================
function showPostMenu(postId, anchorBtn) {
  document.querySelectorAll('.post-menu-popup').forEach(p => p.remove());

  const post = findPostById(postId);
  if (!post || post.user_id !== app.user.id) return;

  const popup = document.createElement('div');
  popup.className = 'post-menu-popup';
  popup.innerHTML = `
    <button class="post-menu-item danger" id="deletePostBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      Delete post
    </button>
  `;

  anchorBtn.parentElement.appendChild(popup);

  const closeHandler = (e) => {
    if (!popup.contains(e.target) && e.target !== anchorBtn) {
      popup.remove();
      document.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('click', closeHandler), 10);

  popup.querySelector('#deletePostBtn')?.addEventListener('click', async () => {
    if (!confirm('Delete this post?')) return;
    try {
      await deletePost(postId);
      showToast('Post deleted', 'success');
      app.feedPosts = app.feedPosts.filter(p => p.id !== postId);
      app.myPosts = app.myPosts.filter(p => p.id !== postId);
      renderFeed();
      if (app.currentView === 'profile' && app.profileTab === 'posts') {
        renderMyPosts();
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete', 'error');
    }
  });
}

// ============================================
// COMMENT SHEET
// ============================================
async function openCommentSheet(postId) {
  app.currentPostId = postId;
  const overlay = document.getElementById('commentSheetOverlay');
  const listEl = document.getElementById('commentSheetList');
  const inputEl = document.getElementById('commentInput');

  if (!overlay || !listEl) return;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (inputEl) inputEl.value = '';

  listEl.innerHTML = `<div style="text-align: center; padding: 24px;"><div class="spinner" style="margin: 0 auto;"></div></div>`;

  try {
    const comments = await fetchComments(postId);

    if (comments.length === 0) {
      listEl.innerHTML = `
        <div class="comment-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <div class="comment-empty-text">No comments yet.<br>Be the first!</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = comments.map(c => renderCommentItem(c)).join('');
    attachCommentListeners(listEl);
  } catch (err) {
    console.error('Load comments error:', err);
    listEl.innerHTML = `<div class="comment-empty-text">Failed to load comments</div>`;
  }
}

function closeCommentSheet() {
  const overlay = document.getElementById('commentSheetOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  app.currentPostId = null;
}

function attachCommentListeners(container) {
  container.querySelectorAll('.comment-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const commentId = parseInt(btn.dataset.commentId, 10);
      if (!confirm('Delete this comment?')) return;

      try {
        await deleteComment(commentId);
        btn.closest('.comment-item')?.remove();

        const post = findPostById(app.currentPostId);
        if (post) {
          post.comment_count = Math.max(0, post.comment_count - 1);
          document.querySelectorAll('.feed-list').forEach(c => {
            const commentBtn = c.querySelector(`.comment-btn[data-post-id="${app.currentPostId}"]`);
            if (commentBtn) {
              const countSpan = commentBtn.querySelector('.action-count');
              if (countSpan) countSpan.textContent = post.comment_count;
            }
          });
        }
        showToast('Comment deleted', 'success');
      } catch (err) {
        console.error('Delete comment error:', err);
        showToast('Failed to delete', 'error');
      }
    });
  });
}

async function submitComment() {
  const input = document.getElementById('commentInput');
  const sendBtn = document.getElementById('commentSendBtn');
  const content = input.value.trim();
  if (!content || !app.currentPostId) return;

  sendBtn.disabled = true;

  try {
    const comment = await addComment(app.currentPostId, content);
    const listEl = document.getElementById('commentSheetList');
    const empty = listEl.querySelector('.comment-empty');
    if (empty) listEl.innerHTML = '';

    const html = renderCommentItem({
      id: comment.id,
      user_id: app.user.id,
      content: comment.content,
      created_at: comment.created_at,
      author_name: app.profile?.name || 'You',
      author_verified: app.profile?.is_verified || false,
      author_avatar: app.profile?.avatar_url || null,
      is_mine: true
    });
    listEl.insertAdjacentHTML('beforeend', html);
    attachCommentListeners(listEl);
    listEl.scrollTop = listEl.scrollHeight;

    const post = findPostById(app.currentPostId);
    if (post) {
      post.comment_count += 1;
      document.querySelectorAll('.feed-list').forEach(c => {
        const commentBtn = c.querySelector(`.comment-btn[data-post-id="${app.currentPostId}"]`);
        if (commentBtn) {
          const countSpan = commentBtn.querySelector('.action-count');
          if (countSpan) countSpan.textContent = post.comment_count;
        }
      });
    }

    input.value = '';
  } catch (err) {
    console.error('Comment error:', err);
    showToast(err.message || 'Failed to comment', 'error');
    sendBtn.disabled = false;
  }
}

// ============================================
// MY POSTS
// ============================================
async function loadMyPosts() {
  const listEl = document.getElementById('myPostsList');
  if (!listEl) return;

  try {
    const posts = await fetchUserPosts(app.user.id, 20);
    app.myPosts = posts;
    renderMyPosts();
  } catch (err) {
    console.error('Load my posts error:', err);
  }
}

function renderMyPosts() {
  const listEl = document.getElementById('myPostsList');
  if (!listEl) return;

  if (app.myPosts.length === 0) {
    listEl.innerHTML = `
      <div class="app-empty">
        <div class="app-empty-illustration">${getIcon('empty_moon')}</div>
        <h3 class="app-empty-title">No posts yet</h3>
        <p class="app-empty-text">Tap the + button to share your first post.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = app.myPosts.map(p => renderPostCard({
    ...p,
    author_name: app.profile.name,
    author_verified: app.profile.is_verified,
    author_avatar: app.profile.avatar_url || null
  })).join('');

  attachPostListeners(listEl);
  void listEl.offsetHeight;
}

// ============================================
// PROFILE TABS
// ============================================
function setupProfileTabs() {
  if (app._profileTabsInited) return;
  app._profileTabsInited = true;

  const tabs = document.querySelectorAll('.profile-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      app.profileTab = tabName;

      tabs.forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));

      const content = document.getElementById('tab-' + tabName);
      if (content) content.classList.add('active');

      if (tabName === 'posts') loadMyPosts();
      if (tabName === 'gifts') loadGiftStats();
    });
  });
}

// ============================================
// ACTIVE USERS
// ============================================
async function loadActiveUsers() {
  const container = document.getElementById('activeUsers');
  const countEl = document.getElementById('activeCount');
  if (!container) return;

  try {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await sb
      .from('profiles')
      .select('id, name, is_verified, last_seen')
      .neq('id', app.user.id)
      .gte('last_seen', cutoff)
      .order('last_seen', { ascending: false })
      .limit(20);

    if (error) throw error;

    let users = (data || []).filter(u => !isBlocked(u.id));

    if (app.currentMood && users.length > 0) {
      const userIds = users.map(u => u.id);
      const { data: vibes } = await sb
        .from('vibes')
        .select('user_id, mood, created_at')
        .in('user_id', userIds)
        .eq('mood', app.currentMood)
        .order('created_at', { ascending: false });

      const latestMoodByUser = {};
      (vibes || []).forEach(v => {
        if (!latestMoodByUser[v.user_id]) latestMoodByUser[v.user_id] = v.mood;
      });

      users = users.filter(u => latestMoodByUser[u.id]);
    }

    app.activeUsers = users;

    if (countEl) {
      countEl.textContent = users.length > 0
        ? `${users.length} ${users.length === 1 ? 'person' : 'people'}`
        : '';
    }

    if (users.length === 0) {
      container.innerHTML = `<div class="active-empty">No one is active right now. Check back later.</div>`;
      return;
    }

    container.innerHTML = users.map(u => {
      const initial = (u.name || 'U').charAt(0).toUpperCase();
      const status = getActiveStatus(u.last_seen);
      return `
        <div class="active-user" data-user-id="${u.id}" data-name="${escapeHtml(u.name)}">
          <div class="active-user-avatar">
            <div class="avatar">${initial}</div>
            <span class="status-dot ${status.color}"></span>
          </div>
          <div class="active-user-name">${escapeHtml(u.name)}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.active-user').forEach(el => {
      el.addEventListener('click', () => {
        openChatWithUser(el.dataset.userId, el.dataset.name);
      });
    });

  } catch (err) {
    console.error('Load active users error:', err);
  }
}

// ============================================
// LOAD MATCHES
// ============================================
async function loadMatches() {
  const listEl = document.getElementById('matchList');
  const countEl = document.getElementById('matchesCount');

  if (!app.currentMood) {
    if (listEl) listEl.innerHTML = emptyMoodHTML();
    if (countEl) countEl.textContent = '—';
    return;
  }

  const cutoff = new Date(Date.now() - CONFIG.ACTIVE_USER_DAYS * 24 * 60 * 60 * 1000);

  const { data: vibes, error: vibeErr } = await sb
    .from('vibes')
    .select('user_id, created_at')
    .eq('mood', app.currentMood)
    .neq('user_id', app.user.id)
    .order('created_at', { ascending: false });

  if (vibeErr) {
    console.error('Load matches error:', vibeErr);
    return;
  }

  const latestByUser = {};
  (vibes || []).forEach(v => {
    if (!latestByUser[v.user_id]) latestByUser[v.user_id] = v.created_at;
  });

  const userIds = Object.keys(latestByUser).filter(id => !isBlocked(id));

  if (userIds.length === 0) {
    if (listEl) listEl.innerHTML = emptyMatchesHTML();
    if (countEl) countEl.textContent = '0 people';
    const hintEl = document.getElementById('myMoodHint');
    if (hintEl) hintEl.textContent = 'No matches yet';
    app.matches = [];
    return;
  }

  const { data: profiles, error: profErr } = await sb
    .from('profiles')
    .select('id, name, age, gender, city, interests, bio, last_seen, is_verified')
    .in('id', userIds)
    .gte('last_seen', cutoff.toISOString())
    .order('last_seen', { ascending: false })
    .limit(30);

  if (profErr) {
    console.error('Load profiles error:', profErr);
    return;
  }

  app.matches = (profiles || []).map(p => ({
    ...p,
    mood: app.currentMood,
    vibe_created_at: latestByUser[p.id]
  }));

  if (countEl) {
    countEl.textContent = app.matches.length === 0
      ? '0 people'
      : `${app.matches.length} ${app.matches.length === 1 ? 'person' : 'people'}`;
  }

  const hintEl = document.getElementById('myMoodHint');
  if (hintEl) {
    hintEl.textContent = app.matches.length === 0
      ? 'No matches yet'
      : `${app.matches.length} ${app.matches.length === 1 ? 'person' : 'people'} on your vibe`;
  }

  renderMatches();
}

function renderMatches() {
  const listEl = document.getElementById('matchList');
  if (!listEl) return;

  if (app.matches.length === 0) {
    listEl.innerHTML = emptyMatchesHTML();
    void listEl.offsetHeight;
    return;
  }

  listEl.innerHTML = app.matches.map(m => {
    const mood = getMoodById(m.mood);
    const status = getActiveStatus(m.last_seen);
    const initial = (m.name || 'U').charAt(0).toUpperCase();

    return `
      <div class="match-card" data-user-id="${m.id}" data-name="${escapeHtml(m.name)}">
        <div class="avatar-wrapper">
          <div class="avatar">${initial}</div>
          <span class="status-dot ${status.color}"></span>
        </div>
        <div class="match-info">
          <div class="match-name-row">
            <span class="match-name">${escapeHtml(m.name)}${verifiedBadgeHTML(m.is_verified, 'sm')}</span>
          </div>
          <div class="match-meta">
            ${m.age ? `<span>${m.age}</span>` : ''}
            ${m.age && m.city ? '<span class="match-meta-dot"></span>' : ''}
            ${m.city ? `<span>${escapeHtml(m.city)}</span>` : ''}
            ${mood ? `<span class="match-mood-tag">${mood.emoji} ${mood.label}</span>` : ''}
          </div>
          <div class="match-status">
            <span class="status-dot ${status.color}" style="width: 7px; height: 7px;"></span>
            <span>${status.label}</span>
          </div>
        </div>
        <button class="match-say-hi" data-user-id="${m.id}" data-name="${escapeHtml(m.name)}" aria-label="Say hi">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.match-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.match-say-hi')) return;
      openChatWithUser(card.dataset.userId, card.dataset.name);
    });
  });

  listEl.querySelectorAll('.match-say-hi').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await openChatWithUser(btn.dataset.userId, btn.dataset.name);
    });
  });

  void listEl.offsetHeight;
}

// ============================================
// OPEN CHAT WITH USER
// ============================================
async function openChatWithUser(userId, userName) {
  if (isBlocked(userId)) {
    showToast('This user is blocked', 'info');
    return;
  }

  let partner = app.matches.find(m => m.id === userId);

  if (!partner) {
    const { data } = await sb
      .from('profiles')
      .select('id, name, age, gender, city, last_seen, is_verified')
      .eq('id', userId)
      .maybeSingle();
    partner = data;
  }

  if (!partner) return;

  const canChat = await checkChatLimit();
  if (!canChat) {
    showToast(`Daily chat limit reached (${CONFIG.DAILY_CHAT_LIMIT} per day).`, 'error');
    return;
  }

  await openChatRoom(partner);
}

// ============================================
// CHAT LIMIT
// ============================================
async function checkChatLimit() {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await sb
    .from('daily_chat_limits')
    .select('*')
    .eq('user_id', app.user.id)
    .eq('date', today)
    .maybeSingle();

  if (!data) {
    await sb.from('daily_chat_limits').insert({
      user_id: app.user.id,
      date: today,
      chat_count: 1
    });
    return true;
  }

  if (data.chat_count >= CONFIG.DAILY_CHAT_LIMIT) return false;

  await sb
    .from('daily_chat_limits')
    .update({ chat_count: data.chat_count + 1 })
    .eq('id', data.id);

  return true;
}

// ============================================
// CHAT ROOM
// ============================================
function setupChatRoom() {
  const backBtn = document.getElementById('chatBackBtn');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  const replyClose = document.getElementById('replyPreviewClose');

  if (backBtn) backBtn.addEventListener('click', closeChatRoom);
  if (replyClose) replyClose.addEventListener('click', cancelReply);

  if (input) {
    input.addEventListener('input', () => {
      const hasText = input.value.trim().length > 0;
      if (sendBtn) sendBtn.disabled = !hasText;
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';

      sendTypingStatus();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (sendBtn && !sendBtn.disabled) sendMessage();
      }
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
}

async function openChatRoom(partner) {
  app.currentPartner = partner;

  history.pushState({ chatRoom: true }, '', location.href);

  const chatNameEl = document.getElementById('chatName');
  if (chatNameEl) {
    chatNameEl.innerHTML = escapeHtml(partner.name) + verifiedBadgeHTML(partner.is_verified, 'chat');
  }

  const chatAvatarEl = document.getElementById('chatAvatar');
  if (chatAvatarEl) chatAvatarEl.textContent = (partner.name || 'U').charAt(0).toUpperCase();

  updatePartnerStatus(partner.last_seen);

  const room = document.getElementById('chatRoom');
  room.classList.add('open');
  document.body.style.overflow = 'hidden';

  cancelReply();

  unlockAudioOnFirstTap();
  setupChatAttachButton();
  attachMessageLongPress();
  setupMessageContextMenu();

  await loadMessages();
  subscribeToMessages();
  subscribeToTyping();

  await markMessagesAsRead();

  // Clear badge for this room
  setTimeout(() => refreshNavBadge(), 500);

  setTimeout(() => document.getElementById('chatInput')?.focus(), 350);
}

function closeChatRoom() {
  const room = document.getElementById('chatRoom');
  room.classList.remove('open');
  document.body.style.overflow = '';

  if (app.realtimeChannel) {
    sb.removeChannel(app.realtimeChannel);
    app.realtimeChannel = null;
  }

  if (app.typingChannel) {
    sb.removeChannel(app.typingChannel);
    app.typingChannel = null;
  }

  cancelReply();
  removeTypingBubble();
  app.currentPartner = null;
  app.currentRoom = null;
  window.__activeRoomId = null;
  app.partnerTyping = false;

  loadChats();
}

function updatePartnerStatus(lastSeen) {
  const status = getActiveStatus(lastSeen);
  const statusEl = document.getElementById('chatStatus');
  if (!statusEl) return;

  statusEl.innerHTML = `
    <span class="status-dot ${status.color}"></span>
    <span>${status.label}</span>
  `;
}

// ============================================
// GET / CREATE ROOM
// ============================================
async function getOrCreateRoom(partnerId) {
  const { data: existing } = await sb
    .from('chat_rooms')
    .select('*')
    .or(`and(user1_id.eq.${app.user.id},user2_id.eq.${partnerId}),and(user1_id.eq.${partnerId},user2_id.eq.${app.user.id})`)
    .maybeSingle();

  if (existing) return existing;

  const [u1, u2] = [app.user.id, partnerId].sort();

  const { data: created, error } = await sb
    .from('chat_rooms')
    .insert({ user1_id: u1, user2_id: u2 })
    .select()
    .single();

  if (error) {
    const { data: retry } = await sb
      .from('chat_rooms')
      .select('*')
      .or(`and(user1_id.eq.${app.user.id},user2_id.eq.${partnerId}),and(user1_id.eq.${partnerId},user2_id.eq.${app.user.id})`)
      .maybeSingle();
    return retry;
  }

  return created;
}

// ============================================
// LOAD MESSAGES
// ============================================
async function loadMessages() {
  if (!app.currentPartner) return;

  const room = await getOrCreateRoom(app.currentPartner.id);
  if (!room) return;

  app.currentRoom = room;
  window.__activeRoomId = room.id;

  const { data: messages, error } = await sb
    .from('messages')
    .select('*')
    .eq('room_id', room.id)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    console.error('Load messages error:', error);
    return;
  }

  renderMessages(messages || []);
}

function renderMessages(messages) {
  const el = document.getElementById('chatMessages');
  if (!el) return;

  if (messages.length === 0) {
    el.innerHTML = `
      <div class="chat-empty">
        <div class="chat-empty-illustration">${getIcon('empty_wave')}</div>
        <div class="chat-empty-title">Say hi!</div>
        <div class="chat-empty-text">You're both on the same vibe. Start the conversation.</div>
      </div>
    `;
    return;
  }

  const groups = [];
  let lastDate = null;

  messages.forEach(msg => {
    const date = new Date(msg.created_at).toDateString();
    if (date !== lastDate) {
      groups.push({ type: 'date', date: msg.created_at });
      lastDate = date;
    }
    groups.push({ type: 'msg', msg });
  });

  el.innerHTML = groups.map(g => {
    if (g.type === 'date') return `<div class="msg-date">${formatDate(g.date)}</div>`;
    return renderMessageRow(g.msg);
  }).join('');

  attachMessageSwipe(el);
  attachMessageLongPress();
  scrollToBottom();
}

function renderMessageRow(m) {
  const mine = m.sender_id === app.user.id;
  const senderName = mine ? 'You' : (app.currentPartner?.name || 'User');
  const isImage = m.message_type === 'image' || !!m.image_url;

  let bubbleInner;
  if (isImage) {
    bubbleInner = `<img src="${m.image_url}" class="chat-photo" alt="photo" onclick="openImageViewer('${m.image_url}')">`;
  } else {
    bubbleInner = escapeHtml(m.message || '');
  }

  return `
    <div class="msg-wrapper ${mine ? 'mine' : 'theirs'}">
      <div class="msg-swipe-reply-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 17 4 12 9 7"></polyline>
          <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
        </svg>
      </div>
      <div class="msg ${mine ? 'mine' : 'theirs'}${isImage ? ' image-message' : ''}" 
           data-msg-id="${m.id}" 
           data-msg-text="${escapeHtml(m.message || '')}"
           data-msg-sender="${escapeHtml(senderName)}"
           data-msg-time="${m.created_at}"
           data-msg-read="${m.read_at ? 'true' : 'false'}"
           data-mine="${mine ? 'true' : 'false'}"
           data-sender-name="${escapeHtml(senderName)}">
        <div class="msg-bubble${isImage ? ' image-bubble' : ''}">${bubbleInner}</div>
        <div class="msg-meta">
          <span>${formatTime(m.created_at)}</span>
          ${mine ? renderMessageStatus(m) : ''}
        </div>
      </div>
    </div>
  `;
}

function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(iso) {
  const d = new Date(iso);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function scrollToBottom() {
  const el = document.getElementById('chatMessages');
  if (el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
}

// ============================================
// READ RECEIPTS
// ============================================
function renderMessageStatus(msg) {
  const isRead = !!msg.read_at;
  return `
    <span class="msg-status ${isRead ? 'read' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${isRead ? `
          <polyline points="2 12 7 17 12 12"></polyline>
          <polyline points="9 12 14 17 22 6"></polyline>
        ` : `
          <polyline points="5 12 10 17 19 6"></polyline>
        `}
      </svg>
    </span>
  `;
}

async function markMessagesAsRead() {
  if (!app.currentRoom || !app.currentPartner) return;

  try {
    const { error } = await sb
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('room_id', app.currentRoom.id)
      .neq('sender_id', app.user.id)
      .is('read_at', null);

    if (error) throw error;
  } catch (err) {
    console.error('Mark read error:', err);
  }
}

// ============================================
// TYPING
// ============================================
function subscribeToTyping() {
  if (!app.currentRoom || !app.currentPartner) return;

  if (app.typingChannel) sb.removeChannel(app.typingChannel);

  app.typingChannel = sb
    .channel('typing-' + app.currentRoom.id)
    .on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.userId === app.currentPartner.id) showPartnerTyping();
    })
    .on('broadcast', { event: 'stop_typing' }, (payload) => {
      if (payload.payload.userId === app.currentPartner.id) hidePartnerTyping();
    })
    .subscribe();
}

function sendTypingStatus() {
  if (!app.typingChannel || !app.currentRoom) return;

  app.typingChannel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId: app.user.id }
  });

  clearTimeout(app.typingTimeout);
  app.typingTimeout = setTimeout(() => {
    if (app.typingChannel) {
      app.typingChannel.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { userId: app.user.id }
      });
    }
  }, 2000);
}

let __typingHideTimer = null;

function showPartnerTyping() {
  app.partnerTyping = true;

  const statusEl = document.getElementById('chatStatus');
  if (statusEl) {
    statusEl.innerHTML = `
      <span class="typing-indicator show">
        typing
        <span class="typing-dots">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </span>
      </span>
    `;
  }

  if (typeof showTypingBubble === 'function') showTypingBubble();

  clearTimeout(__typingHideTimer);
  __typingHideTimer = setTimeout(hidePartnerTyping, 4000);
}

function hidePartnerTyping() {
  app.partnerTyping = false;

  if (typeof removeTypingBubble === 'function') removeTypingBubble();

  if (app.currentPartner) updatePartnerStatus(app.currentPartner.last_seen);

  clearTimeout(__typingHideTimer);
  __typingHideTimer = null;
}

// ============================================
// SWIPE TO REPLY
// ============================================
function attachMessageSwipe(container) {
  const SWIPE_THRESHOLD = 60;
  const MAX_SWIPE = 80;

  container.querySelectorAll('.msg').forEach(msgEl => {
    if (msgEl.__swipeBound) return;
    msgEl.__swipeBound = true;

    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let triggered = false;

    const wrapper = msgEl.parentElement;

    const onStart = (clientX) => {
      startX = clientX;
      currentX = 0;
      isDragging = true;
      triggered = false;
      msgEl.style.transition = 'none';
      wrapper.classList.add('swiping');
    };

    const onMove = (clientX, e) => {
      if (!isDragging) return;
      const deltaX = clientX - startX;

      if (deltaX < 0) {
        currentX = 0;
        msgEl.style.transform = '';
        return;
      }

      currentX = Math.min(deltaX, MAX_SWIPE);
      msgEl.style.transform = `translateX(${currentX}px)`;

      if (currentX >= SWIPE_THRESHOLD && !triggered) {
        triggered = true;
        if (app.vibrationEnabled && navigator.vibrate) navigator.vibrate(15);
        wrapper.classList.add('trigger-ready');
      } else if (currentX < SWIPE_THRESHOLD && triggered) {
        triggered = false;
        wrapper.classList.remove('trigger-ready');
      }

      if (currentX > 10 && e && e.cancelable) e.preventDefault();
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      wrapper.classList.remove('swiping');

      if (currentX >= SWIPE_THRESHOLD) {
        const msgText = msgEl.dataset.msgText;
        const msgSender = msgEl.dataset.msgSender;

        if (app.vibrationEnabled && navigator.vibrate) navigator.vibrate([10, 30, 10]);

        msgEl.style.transition = 'transform 0.2s ease';
        msgEl.style.transform = 'translateX(0)';

        setTimeout(() => {
          showReplyPreview(msgText, msgSender);
          wrapper.classList.remove('trigger-ready');
        }, 100);
      } else {
        msgEl.style.transition = 'transform 0.2s ease';
        msgEl.style.transform = 'translateX(0)';
        wrapper.classList.remove('trigger-ready');
      }

      currentX = 0;
      triggered = false;
    };

    msgEl.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX), { passive: true });
    msgEl.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX, e), { passive: false });
    msgEl.addEventListener('touchend', onEnd);
    msgEl.addEventListener('touchcancel', onEnd);

    msgEl.addEventListener('mousedown', (e) => onStart(e.clientX));
    document.addEventListener('mousemove', (e) => { if (isDragging) onMove(e.clientX, e); });
    document.addEventListener('mouseup', () => { if (isDragging) onEnd(); });
  });
}

// ============================================
// REPLY
// ============================================
function showReplyPreview(msgText, senderName) {
  app.currentReplyTo = { text: msgText, sender: senderName };

  const bar = document.getElementById('replyPreviewBar');
  if (!bar) return;

  bar.style.display = 'flex';
  const nameEl = bar.querySelector('.reply-preview-name');
  const textEl = bar.querySelector('.reply-preview-text');

  if (nameEl) nameEl.textContent = `Replying to ${senderName}`;
  if (textEl) textEl.textContent = msgText.slice(0, 80) + (msgText.length > 80 ? '...' : '');

  document.getElementById('chatInput')?.focus();
}

function cancelReply() {
  app.currentReplyTo = null;
  const bar = document.getElementById('replyPreviewBar');
  if (bar) bar.style.display = 'none';
}

// ============================================
// SEND MESSAGE
// ============================================
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');

  const text = input.value.trim();
  if (!text || !app.currentRoom) return;

  if (containsBadWords(text)) {
    showToast('Message contains blocked words.', 'error');
    return;
  }

  let finalMessage = text;
  if (app.currentReplyTo) {
    finalMessage = `↩️ ${app.currentReplyTo.sender}: ${app.currentReplyTo.text.slice(0, 50)}\n\n${text}`;
  }

  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;

  const { error } = await sb
    .from('messages')
    .insert({
      room_id: app.currentRoom.id,
      sender_id: app.user.id,
      message: finalMessage
    });

  if (error) {
    console.error('Send error:', error);
    showToast('Failed to send. Try again.', 'error');
    input.value = text;
    sendBtn.disabled = false;
  } else {
    cancelReply();
    if (app.vibrationEnabled && navigator.vibrate) navigator.vibrate(10);
  }
}

// ============================================
// REALTIME MESSAGES
// ============================================
function subscribeToMessages() {
  if (!app.currentRoom) return;

  if (app.realtimeChannel) sb.removeChannel(app.realtimeChannel);

  app.realtimeChannel = sb
    .channel('room-' + app.currentRoom.id)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${app.currentRoom.id}`
    }, (payload) => appendMessage(payload.new))
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${app.currentRoom.id}`
    }, (payload) => updateMessageReadStatus(payload.new))
    .subscribe();
}

function appendMessage(msg) {
  const el = document.getElementById('chatMessages');
  if (!el) return;

  const empty = el.querySelector('.chat-empty');
  if (empty) el.innerHTML = '';

  const mine = msg.sender_id === app.user.id;

  const div = document.createElement('div');
  div.innerHTML = renderMessageRow(msg);
  const row = div.firstElementChild;
  el.appendChild(row);

  attachMessageSwipe(el);
  attachMessageLongPress();
  scrollToBottom();

  if (!mine) {
    markMessagesAsRead();
    if (app.vibrationEnabled && navigator.vibrate) navigator.vibrate([20, 50, 20]);
    if (app.soundEnabled && typeof playSound === 'function') {
      playSound('assets/icons/message.mp3', 0.6);
    }

    const isChatOpen = document.getElementById('chatRoom')?.classList.contains('open');
    const isPageVisible = !document.hidden;

    if (!isChatOpen || !isPageVisible) {
      showMessageNotification(msg, app.currentPartner?.name || 'New Message');
    }
  }
}

function updateMessageReadStatus(msg) {
  const el = document.querySelector(`.msg[data-msg-id="${msg.id}"]`);
  if (!el) return;

  const metaEl = el.querySelector('.msg-meta');
  if (!metaEl) return;

  const mine = msg.sender_id === app.user.id;
  if (!mine) return;

  const timeStr = formatTime(msg.created_at);
  metaEl.innerHTML = `
    <span>${timeStr}</span>
    ${renderMessageStatus(msg)}
  `;
}

// ============================================
// NOTIFICATION
// ============================================
async function showMessageNotification(msg, senderName) {
  if (!app.notificationsEnabled) return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(senderName || 'New Message', {
      body: (msg.message || '').slice(0, 120),
      icon: 'assets/icons/android-chrome-192x192.png',
      badge: 'assets/icons/android-chrome-192x192.png',
      tag: 'vibe-msg-' + msg.id,
      renotify: true,
      silent: !app.soundEnabled
    });

    notification.onclick = () => {
      window.focus();
      notification.close();

      if (msg.sender_id !== app.currentPartner?.id) {
        const room = app.chats.find(c => c.partner?.id === msg.sender_id);
        if (room && room.partner) {
          openChatRoom(room.partner);
        } else {
          openChatWithUser(msg.sender_id);
        }
      }
    };
  } catch (err) {
    console.error('Notification error:', err);
  }
}

// ============================================
// LOAD CHATS LIST + NAV BADGE
// ============================================
async function loadChats() {
  const listEl = document.getElementById('chatList');
  const emptyEl = document.getElementById('chatEmpty');
  if (!listEl) return;

  const { data: rooms, error } = await sb
    .from('chat_rooms')
    .select('*')
    .or(`user1_id.eq.${app.user.id},user2_id.eq.${app.user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Load chats error:', error);
    return;
  }

  if (!rooms || rooms.length === 0) {
    listEl.querySelectorAll('.chat-item').forEach(e => e.remove());
    if (emptyEl) emptyEl.style.display = 'flex';
    updateChatBadge(0);
    app.unreadChatCount = 0;
    return;
  }

  const partnerIds = rooms.map(r => r.user1_id === app.user.id ? r.user2_id : r.user1_id);

  const { data: profiles } = await sb
    .from('profiles')
    .select('id, name, last_seen, is_verified')
    .in('id', partnerIds);

  const profileMap = {};
  (profiles || []).forEach(p => profileMap[p.id] = p);

  const chatData = await Promise.all(rooms.map(async (room) => {
    const { data: lastMsg } = await sb
      .from('messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // ⚡ Count unread messages for this room
    const { count: unreadCount } = await sb
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id)
      .neq('sender_id', app.user.id)
      .is('read_at', null);

    const partnerId = room.user1_id === app.user.id ? room.user2_id : room.user1_id;
    return {
      room,
      partner: profileMap[partnerId],
      lastMessage: lastMsg,
      unreadCount: unreadCount || 0
    };
  }));

  const activeChats = chatData
    .filter(c => c.lastMessage && c.partner && !isBlocked(c.partner.id))
    .filter(c => {
      const deleted = c.room.deleted_for || [];
      return !deleted.includes(app.user.id);
    })
    .sort((a, b) => {
      if (a.room.pinned && !b.room.pinned) return -1;
      if (!a.room.pinned && b.room.pinned) return 1;
      return new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at);
    });

  app.chats = activeChats;

  // ⚡ Total unread count (for badge)
  const totalUnread = activeChats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  app.unreadChatCount = totalUnread;

  if (activeChats.length === 0) {
    listEl.querySelectorAll('.chat-item').forEach(e => e.remove());
    if (emptyEl) emptyEl.style.display = 'flex';
    updateChatBadge(0);
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  const html = activeChats.map(c => {
    const partner = c.partner;
    const initial = (partner.name || 'U').charAt(0).toUpperCase();
    const status = getActiveStatus(partner.last_seen);
    const preview = (c.lastMessage.message || '').length > 40
      ? (c.lastMessage.message || '').slice(0, 40) + '...'
      : (c.lastMessage.message || '');
    const time = timeAgo(c.lastMessage.created_at);
    const isPinned = c.room.pinned ? 'true' : 'false';
    const isMuted = c.room.muted ? 'true' : 'false';
    const hasUnread = c.unreadCount > 0;
    const unreadBadgeHTML = hasUnread
      ? `<span class="chat-unread-badge">${c.unreadCount > 99 ? '99+' : c.unreadCount}</span>`
      : '';

    return `
      <div class="chat-item${c.room.pinned ? ' pinned' : ''}${c.room.muted ? ' muted' : ''}${hasUnread ? ' unread' : ''}" 
           data-user-id="${partner.id}" 
           data-chat-id="${c.room.id}"
           data-partner-name="${escapeHtml(partner.name)}"
           data-partner-verified="${partner.is_verified ? 'true' : 'false'}"
           data-last-message="${escapeHtml(preview)}"
           data-pinned="${isPinned}"
           data-muted="${isMuted}">
        <div class="avatar-wrapper">
          <div class="avatar">${initial}</div>
          <span class="status-dot ${status.color}"></span>
          ${c.room.pinned ? `
            <span class="chat-pin-icon" title="Pinned">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z"/>
              </svg>
            </span>
          ` : ''}
        </div>
        <div class="chat-item-info">
          <div class="chat-item-top">
            <span class="chat-item-name">${escapeHtml(partner.name)}${verifiedBadgeHTML(partner.is_verified, 'sm')}</span>
            <span class="chat-item-time">
              ${c.room.muted ? `
                <span class="chat-mute-icon" title="Muted">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                </span>
              ` : ''}
              ${time}
            </span>
          </div>
          <div class="chat-item-preview">${escapeHtml(preview)}</div>
        </div>
        ${unreadBadgeHTML}
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.chat-item').forEach(e => e.remove());
  listEl.insertAdjacentHTML('afterbegin', html);

  listEl.querySelectorAll('.chat-item').forEach(item => {
    const userId = item.dataset.userId;
    const partnerProfile = profileMap[userId];

    item.addEventListener('click', () => {
      if (item.dataset.longPressed === 'true') {
        item.dataset.longPressed = 'false';
        return;
      }
      if (partnerProfile) {
        openChatRoom({
          id: userId,
          name: partnerProfile.name,
          last_seen: partnerProfile.last_seen,
          is_verified: partnerProfile.is_verified
        });
      }
    });
  });

  attachChatListLongPress(listEl);

  // ⚡ Update nav badge with unread count
  updateChatBadge(totalUnread);
}

function updateChatBadge(count) {
  const badge = document.getElementById('chatBadge');
  if (!badge) return;

  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.classList.add('show');
  } else {
    badge.classList.remove('show');
  }
}

// ============================================
// PROFILE VIEW (own)
// ============================================
function renderProfileView() {
  if (!app.profile) return;
  const p = app.profile;

  const avatarImg = document.getElementById('profileAvatarImg');
  const avatarFallback = document.getElementById('profileAvatarFallback');

  if (p.avatar_url) {
    if (avatarImg) { avatarImg.src = p.avatar_url; avatarImg.style.display = 'block'; }
    if (avatarFallback) avatarFallback.style.display = 'none';
  } else {
    if (avatarImg) { avatarImg.src = ''; avatarImg.style.display = 'none'; }
    if (avatarFallback) {
      avatarFallback.textContent = (p.name || 'U').charAt(0).toUpperCase();
      avatarFallback.style.display = 'flex';
    }
  }

  const avatarEl = document.getElementById('profileAvatar');
  if (avatarEl && !avatarImg) {
    avatarEl.textContent = (p.name || 'U').charAt(0).toUpperCase();
  }

  const coverImg = document.getElementById('profileCoverImg');
  if (coverImg) {
    if (p.cover_url) {
      coverImg.src = p.cover_url;
      coverImg.style.display = 'block';
    } else {
      coverImg.src = '';
      coverImg.style.display = 'none';
    }
  }

  const nameEl = document.getElementById('profileName');
  if (nameEl) nameEl.innerHTML = escapeHtml(p.name) + verifiedBadgeHTML(p.is_verified, 'lg');

  const metaEl = document.getElementById('profileMeta');
  if (metaEl) {
    const parts = [];
    if (p.age) parts.push(`<span class="profile-meta-item">${getIcon('meta_age')}<span>${p.age}</span></span>`);
    if (p.gender) {
      const iconKey = p.gender === 'male' ? 'meta_male' : p.gender === 'female' ? 'meta_female' : 'meta_other';
      const label = p.gender.charAt(0).toUpperCase() + p.gender.slice(1);
      parts.push(`<span class="profile-meta-item">${getIcon(iconKey)}<span>${label}</span></span>`);
    }
    if (p.city) parts.push(`<span class="profile-meta-item">${getIcon('meta_city')}<span>${escapeHtml(p.city)}</span></span>`);
    metaEl.innerHTML = parts.join('');
  }

  const bioEl = document.getElementById('profileBio');
  if (bioEl) bioEl.textContent = p.bio || 'No bio yet.';

  const interestsSection = document.getElementById('interestsSection');
  const interestsEl = document.getElementById('profileInterests');

  if (p.interests && p.interests.length > 0) {
    if (interestsSection) interestsSection.style.display = 'block';
    if (interestsEl) {
      interestsEl.innerHTML = p.interests.map(i => `<span class="chip">${escapeHtml(i)}</span>`).join('');
    }
  } else {
    if (interestsSection) interestsSection.style.display = 'none';
  }

  if (typeof updateNavDots === 'function') updateNavDots();
}

// ============================================
// PROFILE ACTIONS
// ============================================
function setupProfileActions() {
  document.getElementById('logoutRow')?.addEventListener('click', async () => {
    if (confirm('Sign out of Vibe?')) await signOut();
  });

  document.getElementById('editProfileRow')?.addEventListener('click', () => {
    openEditProfileSheet();
  });

  const darkToggle = document.getElementById('profileDarkToggle');
  if (darkToggle) {
    updateProfileToggleState(darkToggle);
    darkToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTheme();
      updateProfileToggleState(darkToggle);
      if (app.currentView === 'settings') renderThemeSelector('themeOptions');
    });
  }

  document.getElementById('settingsRow')?.addEventListener('click', () => switchView('settings'));

  document.getElementById('helpRow')?.addEventListener('click', () => {
    showToast('Help & Support coming soon!', 'info');
  });
}

function updateProfileToggleState(toggle) {
  const current = getCurrentTheme();
  const resolved = resolveTheme(current);
  toggle.classList.toggle('on', resolved === 'dark');
}

// ============================================
// SETTINGS
// ============================================
function setupSettingsToggles() {
  const notifToggle = document.getElementById('notificationsToggle');
  if (notifToggle) {
    notifToggle.classList.toggle('on', app.notificationsEnabled);
    notifToggle.addEventListener('click', async () => {
      app.notificationsEnabled = !app.notificationsEnabled;
      notifToggle.classList.toggle('on', app.notificationsEnabled);
      saveUserPreference('notifications', app.notificationsEnabled);

      if (app.notificationsEnabled) await requestNotificationPermission();
      showToast(`Notifications ${app.notificationsEnabled ? 'on' : 'off'}`, 'info');
    });
  }

  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.classList.toggle('on', app.soundEnabled);
    soundToggle.addEventListener('click', () => {
      app.soundEnabled = !app.soundEnabled;
      soundToggle.classList.toggle('on', app.soundEnabled);
      saveUserPreference('sound', app.soundEnabled);
      showToast(`Sound ${app.soundEnabled ? 'on' : 'off'}`, 'info');
    });
  }

  const vibToggle = document.getElementById('vibrationToggle');
  if (vibToggle) {
    vibToggle.classList.toggle('on', app.vibrationEnabled);
    vibToggle.addEventListener('click', () => {
      app.vibrationEnabled = !app.vibrationEnabled;
      vibToggle.classList.toggle('on', app.vibrationEnabled);
      saveUserPreference('vibration', app.vibrationEnabled);
      if (app.vibrationEnabled && navigator.vibrate) navigator.vibrate(50);
      showToast(`Vibration ${app.vibrationEnabled ? 'on' : 'off'}`, 'info');
    });
  }
}

function initSettingsView() {
  renderThemeSelector('themeOptions');

  if (app._settingsInited) return;
  app._settingsInited = true;

  document.getElementById('safetyRow')?.addEventListener('click', () => openSheet('safetyCenterSheet'));
  document.getElementById('safetyCenterClose')?.addEventListener('click', () => closeSheet('safetyCenterSheet'));
  document.getElementById('safetyCenterSheet')?.addEventListener('click', (e) => {
    if (e.target.id === 'safetyCenterSheet') closeSheet('safetyCenterSheet');
  });

  document.getElementById('aboutRow')?.addEventListener('click', () => openSheet('aboutVibeSheet'));
  document.getElementById('aboutVibeClose')?.addEventListener('click', () => closeSheet('aboutVibeSheet'));
  document.getElementById('aboutVibeSheet')?.addEventListener('click', (e) => {
    if (e.target.id === 'aboutVibeSheet') closeSheet('aboutVibeSheet');
  });

  document.getElementById('aboutTermsBtn')?.addEventListener('click', () => {
    closeSheet('aboutVibeSheet');
    setTimeout(() => openSheet('termsSheet'), 200);
  });

  document.getElementById('aboutContactBtn')?.addEventListener('click', () => {
    window.location.href = 'mailto:support@vibe-app.com';
  });

  document.getElementById('termsRow')?.addEventListener('click', () => openSheet('termsSheet'));
  document.getElementById('termsClose')?.addEventListener('click', () => closeSheet('termsSheet'));
  document.getElementById('termsSheet')?.addEventListener('click', (e) => {
    if (e.target.id === 'termsSheet') closeSheet('termsSheet');
  });

  document.getElementById('settingsLogoutRow')?.addEventListener('click', async () => {
    if (confirm('Sign out of Vibe?')) await signOut();
  });
}

// ============================================
// NOTIFICATIONS
// ============================================
async function setupNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') return;
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Notifications not supported', 'error');
    return false;
  }
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// ============================================
// MOOD MODAL
// ============================================
function setupMoodModal() {
  const changeBtn = document.getElementById('changeMoodBtn');
  const modal = document.getElementById('moodModal');
  const confirmBtn = document.getElementById('moodConfirmBtn');
  const moodBtns = document.querySelectorAll('.modal-mood-btn');

  changeBtn?.addEventListener('click', () => openMoodModal());

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      if (app.currentMood) closeMoodModal();
      else showToast('Please set a mood first.', 'info');
    }
  });

  let selectedMood = null;

  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      moodBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
      confirmBtn.disabled = false;
    });
  });

  confirmBtn?.addEventListener('click', async () => {
    if (!selectedMood) return;
    const canChange = canChangeMood();
    if (!canChange.ok) {
      showToast(canChange.reason, 'error');
      return;
    }

    setButtonLoading(confirmBtn, true);

    try {
      await sb.from('vibes').insert({ user_id: app.user.id, mood: selectedMood });

      app.currentMood = selectedMood;
      app.lastMoodChangeAt = new Date();
      app.moodChangeCount += 1;

      renderMyMood();
      closeMoodModal();
      showToast(`Mood set to ${getMoodById(selectedMood)?.label}`, 'success');

      await Promise.all([loadMatches(), loadActiveUsers()]);

      confirmBtn.disabled = true;
      moodBtns.forEach(b => b.classList.remove('selected'));
      selectedMood = null;
    } catch (err) {
      console.error('Mood change error:', err);
      showToast('Failed to save mood.', 'error');
    } finally {
      setButtonLoading(confirmBtn, false);
    }
  });
}

function openMoodModal(isFirstTime = false) {
  const modal = document.getElementById('moodModal');
  const title = document.getElementById('moodModalTitle');
  const subtitle = document.getElementById('moodModalSubtitle');
  const limitInfo = document.getElementById('moodLimitInfo');

  if (isFirstTime) {
    title.textContent = 'Set your mood';
    subtitle.textContent = 'Pick your mood to find people on your wavelength.';
  } else {
    title.textContent = 'Change your mood';
    subtitle.textContent = 'Pick a new mood. You can change it every 4 hours.';
  }

  if (app.currentMood && app.lastMoodChangeAt) {
    const canChange = canChangeMood();
    if (!canChange.ok) {
      limitInfo.textContent = canChange.reason;
      limitInfo.style.display = 'block';
    } else {
      limitInfo.textContent = `Changes today: ${app.moodChangeCount}/${CONFIG.DAILY_MOOD_CHANGE_LIMIT}`;
      limitInfo.style.display = 'block';
    }
  } else {
    limitInfo.style.display = 'none';
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMoodModal() {
  document.getElementById('moodModal').classList.remove('open');
  document.body.style.overflow = '';
}

function canChangeMood() {
  if (app.moodChangeCount >= CONFIG.DAILY_MOOD_CHANGE_LIMIT) {
    return { ok: false, reason: `Daily limit reached. Try again tomorrow.` };
  }
  if (app.lastMoodChangeAt) {
    const diffHours = (Date.now() - app.lastMoodChangeAt.getTime()) / (1000 * 60 * 60);
    if (diffHours < CONFIG.MOOD_CHANGE_COOLDOWN_HOURS) {
      const remaining = Math.ceil(CONFIG.MOOD_CHANGE_COOLDOWN_HOURS - diffHours);
      return { ok: false, reason: `Wait ${remaining} more hour${remaining > 1 ? 's' : ''}.` };
    }
  }
  return { ok: true };
}

// ============================================
// GIFT SYSTEM
// ============================================
function setupGiftSystem() {
  document.getElementById('giftClaimBanner')?.addEventListener('click', openGiftPopup);
  document.getElementById('giftPopupBtn')?.addEventListener('click', closeGiftPopup);
  document.getElementById('giftPopup')?.addEventListener('click', (e) => {
    if (e.target.id === 'giftPopup') closeGiftPopup();
  });
}

async function loadGiftStats() {
  try {
    const stats = await getGiftStats(app.user.id);
    app.giftStats = stats;

    const statsCard = document.getElementById('giftStatsCard');
    if (statsCard) {
      if (stats.total_gifts > 0 || stats.streak_count > 0) {
        statsCard.style.display = 'block';
        document.getElementById('totalGifts').textContent = stats.total_gifts || 0;
        document.getElementById('longestStreak').textContent = stats.longest_streak || 0;

        const streakBadge = document.getElementById('streakBadge');
        if (streakBadge && stats.streak_count > 0) {
          streakBadge.style.display = 'inline-flex';
          document.getElementById('streakNumber').textContent = stats.streak_count;
        }
      }
    }

    await loadRecentGifts();
    updateGiftBanner();
  } catch (err) {
    console.error('Load gift stats error:', err);
  }
}

async function loadRecentGifts() {
  const gifts = await getUserGifts(app.user.id, 12);
  const section = document.getElementById('recentGiftsSection');
  const grid = document.getElementById('giftGrid');
  const countLabel = document.getElementById('giftsCountLabel');
  const emptyState = document.getElementById('giftsEmpty');

  if (!grid || !section) return;

  if (gifts.length === 0) {
    section.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  section.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';
  if (countLabel) countLabel.textContent = `${app.giftStats?.total_gifts || gifts.length} total`;

  grid.innerHTML = gifts.map(g => renderGiftItem(g)).join('');
}

function updateGiftBanner() {
  const banner = document.getElementById('giftClaimBanner');
  if (!banner) return;

  if (app.giftStats?.gift_claimed_today) {
    banner.style.display = 'none';
  } else {
    banner.style.display = 'flex';
    const iconEl = document.getElementById('giftClaimIcon');
    if (iconEl) iconEl.innerHTML = getIcon('ui_gift');

    const subtitle = document.getElementById('giftClaimSubtitle');
    if (subtitle) {
      subtitle.textContent = app.giftStats?.streak_count > 0
        ? `Day ${app.giftStats.streak_count + 1} awaits!`
        : 'Tap to claim your reward';
    }
  }
}

async function openGiftPopup() {
  const popup = document.getElementById('giftPopup');
  if (!popup) return;

  popup.classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    const result = await claimDailyGift(app.user.id);
    if (result.alreadyClaimed) {
      showToast('Already claimed today!', 'info');
      closeGiftPopup();
      return;
    }

    const gift = result.gift;
    const pool = GIFT_POOL[gift.rarity];

    document.getElementById('giftPopupCard').style.setProperty('--gift-color', pool.color);
    document.getElementById('giftPopupCard').style.setProperty('--gift-glow', pool.glow);
    document.getElementById('giftPopupIcon').innerHTML = renderGiftSVG(gift.svg);

    const rarityEl = document.getElementById('giftPopupRarity');
    rarityEl.textContent = getRarityLabel(gift.rarity);
    rarityEl.style.background = pool.color;

    document.getElementById('giftPopupName').textContent = gift.name;

    const messages = {
      common: 'A little something to brighten your day.',
      uncommon: 'Nice find! Keep it up.',
      rare: 'You got lucky today!',
      epic: 'Amazing! A truly special gift.',
      legendary: 'INCREDIBLE! A legendary gift!'
    };
    document.getElementById('giftPopupMessage').textContent = messages[gift.rarity];

    if (result.isMilestone) {
      document.getElementById('giftPopupMilestone').style.display = 'inline-flex';
      document.getElementById('giftPopupMilestoneLabel').textContent = result.milestoneLabel;
    } else {
      document.getElementById('giftPopupMilestone').style.display = 'none';
    }

    document.getElementById('giftPopupStreakNum').textContent = result.streak;

    const confettiCount = result.isMilestone ? 60 : gift.rarity === 'legendary' ? 80 : gift.rarity === 'epic' ? 50 : gift.rarity === 'rare' ? 30 : 15;
    setTimeout(() => spawnConfetti(confettiCount, pool.color), 300);

    showToast(`+1 ${gift.name}!`, 'success');

    app.giftStats.gift_claimed_today = true;
    app.giftStats.total_gifts = result.totalGifts;
    app.giftStats.streak_count = result.streak;

    updateGiftBanner();
    await loadRecentGifts();

    document.getElementById('totalGifts').textContent = result.totalGifts;
    document.getElementById('streakBadge').style.display = 'inline-flex';
    document.getElementById('streakNumber').textContent = result.streak;

  } catch (err) {
    console.error('Gift error:', err);
    showToast('Failed to claim gift', 'error');
    closeGiftPopup();
  }
}

function closeGiftPopup() {
  document.getElementById('giftPopup')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================
// CONFETTI
// ============================================
function spawnConfetti(count = 30, color = '#2563EB') {
  const container = document.getElementById('confettiContainer');
  if (!container) return;

  const colors = [color, '#FBBF24', '#A855F7', '#10B981', '#FB7185', '#3B82F6'];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const c = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 6;

    piece.style.left = Math.random() * 100 + '%';
    piece.style.width = size + 'px';
    piece.style.height = size + 'px';
    piece.style.background = c;
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration = (Math.random() * 1.5 + 2) + 's';
    piece.style.animationDelay = (Math.random() * 0.3) + 's';

    container.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

/* ============================================================
   NEW FEATURES (v2.2.2)
   ============================================================ */

/* ------------------------------------------------------------
   AUDIO UNLOCK
   ------------------------------------------------------------ */
let __audioUnlocked = false;
let __audioCtx = null;
let __audioUnlockBound = false;

function unlockAudioOnFirstTap() {
  if (__audioUnlocked || __audioUnlockBound) return;
  __audioUnlockBound = true;

  const doUnlock = () => {
    try {
      if (!__audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) __audioCtx = new AC();
      }
      if (__audioCtx && __audioCtx.state === 'suspended') {
        __audioCtx.resume().catch(() => {});
      }

      if (__audioCtx) {
        const buf = __audioCtx.createBuffer(1, 1, 22050);
        const src = __audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(__audioCtx.destination);
        try { src.start(0); } catch (_) {}
      }

      __audioUnlocked = true;

      document.removeEventListener('touchstart', doUnlock, true);
      document.removeEventListener('click', doUnlock, true);
      document.removeEventListener('keydown', doUnlock, true);
      console.log('[Vibe] 🔊 Audio unlocked');
    } catch (err) {
      console.warn('[Vibe] Audio unlock error:', err);
    }
  };

  document.addEventListener('touchstart', doUnlock, true);
  document.addEventListener('click', doUnlock, true);
  document.addEventListener('keydown', doUnlock, true);
}

function playSound(src = 'assets/icons/message.mp3', volume = 0.6) {
  try {
    if (window.__vibeSoundEnabled === false) return;
    const audio = new Audio(src);
    audio.volume = volume;
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
  } catch (_) {}
}

unlockAudioOnFirstTap();

/* ------------------------------------------------------------
   TYPING BUBBLE
   ------------------------------------------------------------ */
let __typingBubbleEl = null;

function showTypingBubble() {
  const container = document.getElementById('chatMessages') ||
                    document.querySelector('.chat-messages');
  if (!container) return;
  if (__typingBubbleEl && __typingBubbleEl.parentNode) return;

  const el = document.createElement('div');
  el.className = 'typing-bubble';
  el.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  container.appendChild(el);

  __typingBubbleEl = el;
  scrollToBottom();
}

function removeTypingBubble() {
  if (__typingBubbleEl && __typingBubbleEl.parentNode) {
    __typingBubbleEl.parentNode.removeChild(__typingBubbleEl);
  }
  __typingBubbleEl = null;
}

/* ------------------------------------------------------------
   MESSAGE MENU
   ------------------------------------------------------------ */
let __activeMessageEl = null;
let __activeMessageData = null;

function setupMessageContextMenu() {
  const backdrop = document.getElementById('messageMenuOverlay');
  if (backdrop && !backdrop.__vibeBound) {
    backdrop.addEventListener('click', hideMessageMenu);
    backdrop.__vibeBound = true;
  }

  const menu = document.getElementById('messageMenu');
  if (menu && !menu.__vibeBound) {
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-action]');
      if (!item) return;
      handleMessageAction(item.dataset.action);
    });
    menu.__vibeBound = true;
  }
}

function attachMessageLongPress() {
  const container = document.getElementById('chatMessages') ||
                    document.querySelector('.chat-messages');
  if (!container) return;
  if (container.__vibeLongPressBound) return;
  container.__vibeLongPressBound = true;

  let pressTimer = null;
  let startX = 0, startY = 0;
  let currentMsg = null;

  const clearTimer = () => {
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  };

  container.addEventListener('touchstart', (e) => {
    const msgEl = e.target.closest('.msg');
    if (!msgEl) return;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    currentMsg = msgEl;

    clearTimer();
    pressTimer = setTimeout(() => {
      if (currentMsg) {
        showMessageMenu(currentMsg);
        if (app.vibrationEnabled && navigator.vibrate) navigator.vibrate(15);
      }
    }, 500);
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!pressTimer) return;
    const touch = e.touches[0];
    if (Math.abs(touch.clientX - startX) > 10 ||
        Math.abs(touch.clientY - startY) > 10) {
      clearTimer();
    }
  }, { passive: true });

  container.addEventListener('touchend', clearTimer);
  container.addEventListener('touchcancel', clearTimer);

  container.addEventListener('contextmenu', (e) => {
    const msgEl = e.target.closest('.msg');
    if (!msgEl) return;
    e.preventDefault();
    showMessageMenu(msgEl);
  });
}

function showMessageMenu(msgEl) {
  if (!msgEl) return;

  const overlay = document.getElementById('messageMenuOverlay');
  const menu = document.getElementById('messageMenu');
  if (!overlay || !menu) return;

  __activeMessageEl = msgEl;
  __activeMessageData = {
    id: msgEl.dataset.msgId,
    text: msgEl.dataset.msgText || '',
    isMine: msgEl.dataset.mine === 'true' || msgEl.classList.contains('mine')
  };

  const unsendBtn = menu.querySelector('[data-action="unsend"]');
  if (unsendBtn) {
    unsendBtn.style.display = __activeMessageData.isMine ? 'flex' : 'none';
  }

  msgEl.classList.add('menu-active');
  overlay.classList.add('active');
  menu.classList.add('active');
}

function hideMessageMenu() {
  const overlay = document.getElementById('messageMenuOverlay');
  const menu = document.getElementById('messageMenu');
  if (overlay) overlay.classList.remove('active');
  if (menu) menu.classList.remove('active');
  if (__activeMessageEl) __activeMessageEl.classList.remove('menu-active');
  __activeMessageEl = null;
  __activeMessageData = null;
}

async function handleMessageAction(action) {
  const data = __activeMessageData;
  const el = __activeMessageEl;
  hideMessageMenu();
  if (!data || !el) return;

  switch (action) {
    case 'copy': {
      try {
        await navigator.clipboard.writeText(data.text || '');
        showToast('Copied', 'success');
      } catch (_) {
        showToast('Copy failed', 'error');
      }
      break;
    }

    case 'reply': {
      showReplyPreview(data.text, el.dataset.senderName || 'User');
      break;
    }

    case 'unsend': {
      if (!data.isMine) return;
      await unsendMessage(data.id, el);
      break;
    }

    default:
      console.warn('Unknown message action:', action);
  }
}

async function unsendMessage(messageId, msgEl) {
  try {
    const { error } = await sb.from('messages').delete().eq('id', messageId);
    if (error) throw error;

    const wrapper = msgEl.closest('.msg-wrapper') || msgEl;
    if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    showToast('Message unsent', 'success');
  } catch (err) {
    console.error('unsendMessage error:', err);
    showToast('Unsend failed', 'error');
  }
}

/* ------------------------------------------------------------
   CHAT ATTACH
   ------------------------------------------------------------ */
function setupChatAttachButton() {
  const attachBtn = document.getElementById('chatAttachBtn');
  const fileInput = document.getElementById('chatPhotoFileInput');
  if (!attachBtn || !fileInput) return;
  if (attachBtn.__vibeBound) return;
  attachBtn.__vibeBound = true;

  attachBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    fileInput.value = '';
    if (!file) return;

    const roomId = app.currentRoom?.id;
    if (!roomId) {
      showToast('No active chat', 'error');
      return;
    }

    if (typeof handleImageUpload === 'function') {
      await handleImageUpload(file, 'chat', roomId);
    } else {
      showToast('Upload module missing', 'error');
    }
  });
}

/* ------------------------------------------------------------
   IMAGE UPLOAD SHEET
   ------------------------------------------------------------ */
let __uploadSheetTarget = null;

function setupImageUploadSheet() {
  const sheet = document.getElementById('imageUploadSheet');
  const backdrop = document.getElementById('sheetBackdrop');
  if (!sheet) return;
  if (sheet.__vibeBound) return;
  sheet.__vibeBound = true;

  sheet.querySelectorAll('[data-upload-action]').forEach((el) => {
    el.addEventListener('click', async () => {
      const action = el.dataset.uploadAction;

      if (action === 'remove') {
        closeImageUploadSheet();
        if (__uploadSheetTarget === 'avatar') {
          if (typeof removeAvatar === 'function') await removeAvatar();
        } else if (__uploadSheetTarget === 'cover') {
          try {
            const { data: { user } } = await sb.auth.getUser();
            if (user) {
              await sb.from('profiles').update({ cover_url: null }).eq('id', user.id);
              if (app.profile) app.profile.cover_url = null;
              if (typeof updateCoverUI === 'function') updateCoverUI(null);
              showToast('Cover removed', 'success');
            }
          } catch (err) {
            console.error('Remove cover error:', err);
            showToast('Failed to remove', 'error');
          }
        }
        return;
      }

      const inputId = action === 'camera' ? 'cameraFileInput' : (
        __uploadSheetTarget === 'avatar' ? 'avatarFileInput' :
        __uploadSheetTarget === 'cover' ? 'coverFileInput' : null
      );
      const input = inputId ? document.getElementById(inputId) : null;
      closeImageUploadSheet();
      if (input) input.click();
    });
  });

  const avatarInput = document.getElementById('avatarFileInput');
  if (avatarInput && !avatarInput.__vibeBound) {
    avatarInput.__vibeBound = true;
    avatarInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      avatarInput.value = '';
      if (!file) return;
      if (typeof handleImageUpload === 'function') await handleImageUpload(file, 'avatar');
    });
  }

  const coverInput = document.getElementById('coverFileInput');
  if (coverInput && !coverInput.__vibeBound) {
    coverInput.__vibeBound = true;
    coverInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      coverInput.value = '';
      if (!file) return;
      if (typeof handleImageUpload === 'function') await handleImageUpload(file, 'cover');
    });
  }

  const camInput = document.getElementById('cameraFileInput');
  if (camInput && !camInput.__vibeBound) {
    camInput.__vibeBound = true;
    camInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      camInput.value = '';
      if (!file) return;
      const target = __uploadSheetTarget || 'avatar';
      if (typeof handleImageUpload === 'function') await handleImageUpload(file, target);
    });
  }

  if (backdrop && !backdrop.__vibeBound) {
    backdrop.__vibeBound = true;
    backdrop.addEventListener('click', closeImageUploadSheet);
  }
}

function openImageUploadSheet(target) {
  __uploadSheetTarget = target;
  const sheet = document.getElementById('imageUploadSheet');
  const backdrop = document.getElementById('sheetBackdrop');
  if (!sheet) return;

  const removeBtn = sheet.querySelector('[data-upload-action="remove"]');
  if (removeBtn) {
    if (target === 'avatar') {
      const src = document.getElementById('profileAvatarImg')?.src;
      removeBtn.style.display = src ? 'flex' : 'none';
    } else if (target === 'cover') {
      const src = document.getElementById('profileCoverImg')?.src;
      removeBtn.style.display = src ? 'flex' : 'none';
    } else {
      removeBtn.style.display = 'none';
    }
  }

  sheet.classList.add('active');
  if (backdrop) backdrop.classList.add('active');
}

function closeImageUploadSheet() {
  const sheet = document.getElementById('imageUploadSheet');
  const backdrop = document.getElementById('sheetBackdrop');
  if (sheet) sheet.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
  __uploadSheetTarget = null;
}

function setupProfileImageButtons() {
  const avatarEdit = document.getElementById('profileAvatarEdit');
  const coverEdit = document.getElementById('profileCoverEdit');

  if (avatarEdit && !avatarEdit.__vibeBound) {
    avatarEdit.__vibeBound = true;
    avatarEdit.addEventListener('click', () => openImageUploadSheet('avatar'));
  }
  if (coverEdit && !coverEdit.__vibeBound) {
    coverEdit.__vibeBound = true;
    coverEdit.addEventListener('click', () => openImageUploadSheet('cover'));
  }
}

/* ------------------------------------------------------------
   EDIT PROFILE SHEET
   ------------------------------------------------------------ */
function openEditProfileSheet() {
  const p = app.profile;
  if (!p) return;

  let sheet = document.getElementById('editProfileSheet');
  if (!sheet) {
    sheet = document.createElement('div');
    sheet.id = 'editProfileSheet';
    sheet.className = 'edit-profile-overlay';
    sheet.innerHTML = `
      <div class="edit-profile-sheet">
        <div class="edit-profile-header">
          <h2 class="edit-profile-title">Edit Profile</h2>
          <button class="edit-profile-close" id="editProfileClose">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="edit-profile-body">
          <div class="edit-field">
            <label class="edit-field-label">Name</label>
            <input type="text" class="edit-field-input" id="editName" maxlength="40">
          </div>
          <div class="edit-field">
            <label class="edit-field-label">Age</label>
            <input type="number" class="edit-field-input" id="editAge" min="18" max="99">
          </div>
          <div class="edit-field">
            <label class="edit-field-label">Gender</label>
            <select class="edit-field-input" id="editGender">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="edit-field">
            <label class="edit-field-label">City</label>
            <input type="text" class="edit-field-input" id="editCity" maxlength="40">
          </div>
          <div class="edit-field">
            <label class="edit-field-label">Bio</label>
            <textarea class="edit-field-input edit-field-textarea" id="editBio" maxlength="200" rows="3"></textarea>
          </div>
        </div>
        <div class="edit-profile-footer">
          <button class="edit-save-btn" id="editProfileSave">Save Changes</button>
        </div>
      </div>
    `;
    document.body.appendChild(sheet);

    sheet.querySelector('#editProfileClose')?.addEventListener('click', closeEditProfileSheet);
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet) closeEditProfileSheet();
    });
    sheet.querySelector('#editProfileSave')?.addEventListener('click', saveEditProfile);
  }

  sheet.querySelector('#editName').value = p.name || '';
  sheet.querySelector('#editAge').value = p.age || '';
  sheet.querySelector('#editGender').value = p.gender || '';
  sheet.querySelector('#editCity').value = p.city || '';
  sheet.querySelector('#editBio').value = p.bio || '';

  sheet.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEditProfileSheet() {
  const sheet = document.getElementById('editProfileSheet');
  if (sheet) sheet.classList.remove('open');
  document.body.style.overflow = '';
}

async function saveEditProfile() {
  const sheet = document.getElementById('editProfileSheet');
  if (!sheet) return;

  const saveBtn = sheet.querySelector('#editProfileSave');
  const name = sheet.querySelector('#editName').value.trim();
  const age = parseInt(sheet.querySelector('#editAge').value, 10) || null;
  const gender = sheet.querySelector('#editGender').value;
  const city = sheet.querySelector('#editCity').value.trim();
  const bio = sheet.querySelector('#editBio').value.trim();

  if (!name) { showToast('Name required', 'error'); return; }
  if (age && (age < 18 || age > 99)) { showToast('Age must be 18-99', 'error'); return; }

  setButtonLoading(saveBtn, true);

  try {
    const { error } = await sb
      .from('profiles')
      .update({ name, age, gender: gender || null, city: city || null, bio: bio || null })
      .eq('id', app.user.id);

    if (error) throw error;

    app.profile = { ...app.profile, name, age, gender, city, bio };
    renderProfileView();
    showToast('Profile updated', 'success');
    closeEditProfileSheet();

  } catch (err) {
    console.error('Save profile error:', err);
    showToast('Failed to save', 'error');
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

/* ------------------------------------------------------------
   CREATE POST IMAGE
   ------------------------------------------------------------ */
function setupCreatePostImage() {
  const input = document.getElementById('createPostImageInput');
  const removeBtn = document.getElementById('createPostImageRemove');
  if (!input) return;
  if (input.__vibeBound) return;
  input.__vibeBound = true;

  input.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image too large (max 10MB)', 'error');
      return;
    }

    app._pendingPostImage = file;
    showCreatePostImagePreview(file);
  });

  if (removeBtn && !removeBtn.__vibeBound) {
    removeBtn.__vibeBound = true;
    removeBtn.addEventListener('click', clearCreatePostImage);
  }
}

function showCreatePostImagePreview(file) {
  const preview = document.getElementById('createPostImagePreview');
  const img = document.getElementById('createPostImagePreviewImg');
  if (!preview || !img) return;

  const url = URL.createObjectURL(file);
  img.src = url;
  preview.style.display = 'block';

  if (preview.__lastUrl) URL.revokeObjectURL(preview.__lastUrl);
  preview.__lastUrl = url;

  const submit = document.getElementById('createPostSubmit');
  if (submit) submit.disabled = false;
}

function clearCreatePostImage() {
  app._pendingPostImage = null;

  const preview = document.getElementById('createPostImagePreview');
  const img = document.getElementById('createPostImagePreviewImg');

  if (preview) {
    if (preview.__lastUrl) {
      URL.revokeObjectURL(preview.__lastUrl);
      preview.__lastUrl = null;
    }
    preview.style.display = 'none';
  }
  if (img) img.src = '';

  const input = document.getElementById('createPostInput');
  const submit = document.getElementById('createPostSubmit');
  if (submit && input) submit.disabled = input.value.trim().length === 0;
}

/* ------------------------------------------------------------
   LIKERS SHEET (v2.2.2)
   ------------------------------------------------------------ */
async function openLikersSheet(postId) {
  if (!postId) return;

  let sheet = document.getElementById('likersSheet');
  if (!sheet) {
    sheet = document.createElement('div');
    sheet.id = 'likersSheet';
    sheet.className = 'sheet-overlay';
    sheet.innerHTML = `
      <div class="sheet-modal likers-sheet-modal">
        <div class="sheet-handle"></div>
        <div class="likers-header">
          <h3 class="likers-title" id="likersTitle">Liked by</h3>
          <button class="likers-close" id="likersClose" aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="likers-list" id="likersList">
          <div class="likers-loading">
            <div class="spinner" style="margin: 0 auto;"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(sheet);

    sheet.querySelector('#likersClose')?.addEventListener('click', closeLikersSheet);
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet) closeLikersSheet();
    });
  }

  const listEl = document.getElementById('likersList');
  const titleEl = document.getElementById('likersTitle');

  if (listEl) {
    listEl.innerHTML = `<div class="likers-loading"><div class="spinner" style="margin: 0 auto;"></div></div>`;
  }
  if (titleEl) titleEl.textContent = 'Liked by';

  sheet.classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    const likers = await fetchPostLikers(postId, 100);

    if (titleEl) {
      titleEl.textContent = likers.length === 0
        ? 'No likes yet'
        : `Liked by ${likers.length} ${likers.length === 1 ? 'person' : 'people'}`;
    }

    if (!listEl) return;

    if (likers.length === 0) {
      listEl.innerHTML = `
        <div class="likers-empty">
          <div class="likers-empty-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <div class="likers-empty-title">No likes yet</div>
          <div class="likers-empty-text">Be the first to react!</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = likers.map(u => renderLikerItem(u)).join('');

    listEl.querySelectorAll('.liker-item').forEach(item => {
      item.addEventListener('click', () => {
        const userId = item.dataset.userId;
        closeLikersSheet();
        setTimeout(() => {
          if (userId === app.user.id) {
            switchView('profile');
          } else {
            openFullProfile(userId);
          }
        }, 200);
      });
    });

  } catch (err) {
    console.error('openLikersSheet error:', err);
    if (listEl) {
      listEl.innerHTML = `<div class="likers-empty-text">Failed to load likers</div>`;
    }
  }
}

function closeLikersSheet() {
  const sheet = document.getElementById('likersSheet');
  if (sheet) sheet.classList.remove('open');
  document.body.style.overflow = '';
}

/* ------------------------------------------------------------
   BOOT
   ------------------------------------------------------------ */
function bootVibeNewFeatures() {
  if (app._newFeaturesBooted) return;
  app._newFeaturesBooted = true;

  setupMessageContextMenu();
  attachMessageLongPress();
  setupChatAttachButton();
  setupImageUploadSheet();
  setupProfileImageButtons();
  setupCreatePostImage();
  setupProfilePageButtons();
  unlockAudioOnFirstTap();

  console.log('[Vibe] ✨ New features booted (v2.2.2)');
}

window.bootVibeNewFeatures = bootVibeNewFeatures;

// ============================================
// EXPOSE GLOBALS
// ============================================
window.openEditProfileSheet = openEditProfileSheet;
window.closeEditProfileSheet = closeEditProfileSheet;
window.openFullProfile = openFullProfile;
window.closeFullProfile = closeFullProfile;
window.openChatWithUser = openChatWithUser;
window.switchView = switchView;
window.openLikersSheet = openLikersSheet;
window.closeLikersSheet = closeLikersSheet;
window.refreshNavBadge = refreshNavBadge;