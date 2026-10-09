/* ============================================
   VIBE — Main App Logic (SPA) — FIXED VERSION
   ============================================
   Navigation, Feed, Matches, Chats, Profile,
   Settings, Chat Room, Realtime, Mood, Gifts
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
  feedOffset: 0,
  feedHasMore: true,
  currentRoom: null,
  currentPartner: null,
  currentPostId: null,
  realtimeChannel: null,
  profileTab: 'posts',
  moodChangeCount: 0,
  lastMoodChangeAt: null,
  giftStats: null,
  _settingsInited: false,
  _navInited: false,
  _profileTabsInited: false,
  _initDone: false
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

    await updateLastSeen();
    await loadCurrentMood();

    // Setup all handlers BEFORE loading data
    renderProfileView();
    setupNavigation();
    setupMoodModal();
    setupChatRoom();
    setupProfileActions();
    setupProfileTabs();
    setupGiftSystem();
    setupPostSystem();
    renderEmptyStates();

    // Hide loading spinner
    hideAppLoading();

    // Make sure feed view is active from start
    const urlHash = window.location.hash.replace('#', '');
    const validHash = ['feed', 'matches', 'chats', 'profile', 'settings'].includes(urlHash);
    const startView = validHash ? urlHash : 'feed';

    switchView(startView, false);

    // Load all data in parallel
    await Promise.allSettled([
      loadFeed(),
      loadMatches(),
      loadGiftStats(),
      loadActiveUsers(),
      loadChats()
    ]);

    // Mark init complete
    app._initDone = true;

    // Periodic tasks
    setInterval(updateLastSeen, 2 * 60 * 1000);
    setInterval(loadActiveUsers, 60 * 1000);

    window.addEventListener('themechange', () => {
      const toggle = document.getElementById('profileDarkToggle');
      if (toggle) updateProfileToggleState(toggle);
    });

    console.log('✅ App initialized (Feed + 5 tabs)');

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
// NAVIGATION (5 tabs) — FIXED
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

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  // Update views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + view);
  if (target) target.classList.add('active');

  // Update hash
  if (updateHash) {
    history.replaceState(null, '', '#' + view);
  }

  // Scroll top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Lazy loads (only after init, or force on first)
  if (view === 'feed') {
    if (app.feedPosts.length === 0) {
      loadFeed();
    } else {
      renderFeed();
    }
  }

  if (view === 'chats') {
    if (app.chats.length === 0) loadChats();
    loadActiveUsers();
  }

  if (view === 'settings') {
    initSettingsView();
  }

  if (view === 'profile') {
    loadGiftStats();
    if (app.profileTab === 'posts') loadMyPosts();
  }

  if (view === 'matches') {
    if (app.matches.length === 0 && app.currentMood) {
      loadMatches();
    } else {
      renderMatches();
    }
  }
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
      // Delay mood modal open to after app ready
      setTimeout(() => openMoodModal(true), 800);
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

    renderFeed();
  } catch (err) {
    console.error('Load feed error:', err);
    renderFeed();
  }
}

function renderFeed() {
  const listEl = document.getElementById('feedList');
  if (!listEl) return;

  if (app.feedPosts.length === 0) {
    listEl.innerHTML = renderEmptyFeed();
    return;
  }

  listEl.innerHTML = app.feedPosts.map(p => renderPostCard(p)).join('');
  attachPostListeners(listEl);
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
      if (submit) submit.disabled = len === 0 || len > 280;
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
      setTimeout(() => btn.classList.remove('spinning'), 500);
    });
  }
}

function attachPostListeners(container) {
  container.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const postId = parseInt(btn.dataset.postId, 10);
      const post = findPostById(postId);
      if (!post) return;

      const wasLiked = post.liked_by_me;
      post.liked_by_me = !wasLiked;
      post.like_count += wasLiked ? -1 : 1;

      btn.classList.toggle('liked', post.liked_by_me);
      const countSpan = btn.querySelector('.action-count');
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
      const postId = parseInt(btn.dataset.postId, 10);
      openCommentSheet(postId);
    });
  });

  container.querySelectorAll('.post-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const postId = parseInt(btn.dataset.postId, 10);
      showPostMenu(postId, btn);
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

  if (!content) return;

  setButtonLoading(submitBtn, true);

  try {
    await createPost(content);
    showToast('Post shared!', 'success');
    closeCreatePost();

    await loadFeed(true);
    if (app.currentView === 'profile' && app.profileTab === 'posts') {
      await loadMyPosts();
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

  listEl.innerHTML = `
    <div style="text-align: center; padding: 24px;">
      <div class="spinner" style="margin: 0 auto;"></div>
    </div>
  `;

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
    author_verified: app.profile.is_verified
  })).join('');

  attachPostListeners(listEl);
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

    let users = data || [];

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
      container.innerHTML = `
        <div class="active-empty">
          No one is active right now. Check back later.
        </div>
      `;
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

  const userIds = Object.keys(latestByUser);

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
}

// ============================================
// OPEN CHAT WITH USER
// ============================================
async function openChatWithUser(userId, userName) {
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

  if (backBtn) backBtn.addEventListener('click', closeChatRoom);

  if (input) {
    input.addEventListener('input', () => {
      const hasText = input.value.trim().length > 0;
      if (sendBtn) sendBtn.disabled = !hasText;
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
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

  await loadMessages();
  subscribeToMessages();

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

  app.currentPartner = null;
  app.currentRoom = null;
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
    const m = g.msg;
    const mine = m.sender_id === app.user.id;
    return `
      <div class="msg ${mine ? 'mine' : 'theirs'}">
        <div class="msg-bubble">${escapeHtml(m.message)}</div>
      </div>
    `;
  }).join('');

  scrollToBottom();
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

function scrollToBottom() {
  const el = document.getElementById('chatMessages');
  if (el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
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

  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;

  const { error } = await sb
    .from('messages')
    .insert({
      room_id: app.currentRoom.id,
      sender_id: app.user.id,
      message: text
    });

  if (error) {
    console.error('Send error:', error);
    showToast('Failed to send. Try again.', 'error');
    input.value = text;
    sendBtn.disabled = false;
  }
}

// ============================================
// REALTIME
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
    .subscribe();
}

function appendMessage(msg) {
  const el = document.getElementById('chatMessages');
  if (!el) return;

  const empty = el.querySelector('.chat-empty');
  if (empty) el.innerHTML = '';

  const mine = msg.sender_id === app.user.id;
  const div = document.createElement('div');
  div.className = `msg ${mine ? 'mine' : 'theirs'}`;
  div.innerHTML = `<div class="msg-bubble">${escapeHtml(msg.message)}</div>`;
  el.appendChild(div);
  scrollToBottom();
}

// ============================================
// LOAD CHATS LIST
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

    const partnerId = room.user1_id === app.user.id ? room.user2_id : room.user1_id;
    return { room, partner: profileMap[partnerId], lastMessage: lastMsg };
  }));

  const activeChats = chatData.filter(c => c.lastMessage);
  activeChats.sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));

  app.chats = activeChats;

  if (activeChats.length === 0) {
    listEl.querySelectorAll('.chat-item').forEach(e => e.remove());
    if (emptyEl) emptyEl.style.display = 'flex';
    updateChatBadge(0);
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  const html = activeChats.map(c => {
    const partner = c.partner;
    if (!partner) return '';

    const initial = (partner.name || 'U').charAt(0).toUpperCase();
    const status = getActiveStatus(partner.last_seen);
    const preview = c.lastMessage.message.length > 40
      ? c.lastMessage.message.slice(0, 40) + '...'
      : c.lastMessage.message;
    const time = timeAgo(c.lastMessage.created_at);

    return `
      <div class="chat-item" data-user-id="${partner.id}">
        <div class="avatar-wrapper">
          <div class="avatar">${initial}</div>
          <span class="status-dot ${status.color}"></span>
        </div>
        <div class="chat-item-info">
          <div class="chat-item-top">
            <span class="chat-item-name">${escapeHtml(partner.name)}${verifiedBadgeHTML(partner.is_verified, 'sm')}</span>
            <span class="chat-item-time">${time}</span>
          </div>
          <div class="chat-item-preview">${escapeHtml(preview)}</div>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.chat-item').forEach(e => e.remove());
  listEl.insertAdjacentHTML('afterbegin', html);

  listEl.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', async () => {
      const userId = item.dataset.userId;
      const partnerProfile = profileMap[userId];
      if (partnerProfile) {
        await openChatRoom({
          id: userId,
          name: partnerProfile.name,
          last_seen: partnerProfile.last_seen,
          is_verified: partnerProfile.is_verified
        });
      }
    });
  });

  updateChatBadge(activeChats.length);
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
// PROFILE VIEW
// ============================================
function renderProfileView() {
  if (!app.profile) return;
  const p = app.profile;

  const avatarEl = document.getElementById('profileAvatar');
  if (avatarEl) avatarEl.textContent = (p.name || 'U').charAt(0).toUpperCase();

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
}

// ============================================
// PROFILE ACTIONS
// ============================================
function setupProfileActions() {
  document.getElementById('logoutRow')?.addEventListener('click', async () => {
    if (confirm('Sign out of Vibe?')) await signOut();
  });

  document.getElementById('editProfileRow')?.addEventListener('click', () => {
    showToast('Edit Profile coming soon!', 'info');
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
// SETTINGS VIEW
// ============================================
function initSettingsView() {
  renderThemeSelector('themeOptions');

  if (app._settingsInited) return;
  app._settingsInited = true;

  document.getElementById('notificationsRow')?.addEventListener('click', () => showToast('Coming soon!', 'info'));
  document.getElementById('languageRow')?.addEventListener('click', () => showToast('More languages coming soon!', 'info'));
  document.getElementById('blockedUsersRow')?.addEventListener('click', () => showToast('No blocked users yet.', 'info'));
  document.getElementById('safetyRow')?.addEventListener('click', () => showToast('Safety Center coming soon!', 'info'));
  document.getElementById('aboutRow')?.addEventListener('click', showAboutModal);
  document.getElementById('termsRow')?.addEventListener('click', () => showToast('Terms coming soon!', 'info'));

  document.getElementById('settingsLogoutRow')?.addEventListener('click', async () => {
    if (confirm('Sign out of Vibe?')) await signOut();
  });
}

function showAboutModal() {
  alert('Vibe v1.0.0\n\nMatch your mood. Meet real people.\n\n(c) 2026 Vibe');
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