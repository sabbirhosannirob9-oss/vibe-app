/* ============================================
   VIBE — Posts System (Safe Queries)
   ============================================
   Feed, Create, Like, Comment, Delete
   No nested joins — separate queries for safety
============================================ */

// ============================================
// FETCH FEED
// ============================================
async function fetchFeed(limit = 20, offset = 0) {
  try {
    const { data, error } = await sb
      .from('posts')
      .select('id, user_id, content, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Fetch feed error:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Author profiles
    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profiles } = await sb
      .from('profiles')
      .select('id, name, is_verified')
      .in('id', userIds);

    const profileMap = {};
    (profiles || []).forEach(p => profileMap[p.id] = p);

    // Likes & comments counts
    const postIds = data.map(p => p.id);

    const [likesData, commentsData, userLikes] = await Promise.all([
      sb.from('post_likes').select('post_id').in('post_id', postIds),
      sb.from('post_comments').select('post_id').in('post_id', postIds),
      sb.from('post_likes').select('post_id').in('post_id', postIds).eq('user_id', app.user.id)
    ]);

    const likeCounts = {};
    (likesData.data || []).forEach(l => {
      likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
    });

    const commentCounts = {};
    (commentsData.data || []).forEach(c => {
      commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
    });

    const likedByMe = new Set((userLikes.data || []).map(l => l.post_id));

    return data.map(p => {
      const profile = profileMap[p.user_id];
      return {
        id: p.id,
        user_id: p.user_id,
        content: p.content,
        created_at: p.created_at,
        author_name: profile?.name || 'User',
        author_verified: profile?.is_verified || false,
        like_count: likeCounts[p.id] || 0,
        comment_count: commentCounts[p.id] || 0,
        liked_by_me: likedByMe.has(p.id)
      };
    });
  } catch (err) {
    console.error('fetchFeed exception:', err);
    return [];
  }
}

// ============================================
// FETCH USER POSTS (for profile)
// ============================================
async function fetchUserPosts(userId, limit = 20) {
  try {
    const { data, error } = await sb
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Fetch user posts error:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    const postIds = data.map(p => p.id);

    const [likesData, commentsData, userLikes] = await Promise.all([
      sb.from('post_likes').select('post_id').in('post_id', postIds),
      sb.from('post_comments').select('post_id').in('post_id', postIds),
      sb.from('post_likes').select('post_id').in('post_id', postIds).eq('user_id', app.user.id)
    ]);

    const likeCounts = {};
    (likesData.data || []).forEach(l => {
      likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
    });

    const commentCounts = {};
    (commentsData.data || []).forEach(c => {
      commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
    });

    const likedByMe = new Set((userLikes.data || []).map(l => l.post_id));

    return data.map(p => ({
      ...p,
      like_count: likeCounts[p.id] || 0,
      comment_count: commentCounts[p.id] || 0,
      liked_by_me: likedByMe.has(p.id)
    }));
  } catch (err) {
    console.error('fetchUserPosts exception:', err);
    return [];
  }
}

// ============================================
// CREATE POST
// ============================================
async function createPost(content) {
  const trimmed = content.trim();

  if (!trimmed) throw new Error('Post cannot be empty');
  if (trimmed.length > 280) throw new Error('Post is too long (max 280 chars)');
  if (containsBadWords(trimmed)) throw new Error('Post contains blocked words');

  const { data, error } = await sb
    .from('posts')
    .insert({
      user_id: app.user.id,
      content: trimmed
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// DELETE POST
// ============================================
async function deletePost(postId) {
  const { error } = await sb
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', app.user.id);

  if (error) throw error;
}

// ============================================
// TOGGLE LIKE
// ============================================
async function toggleLike(postId, currentlyLiked) {
  if (currentlyLiked) {
    const { error } = await sb
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', app.user.id);

    if (error) throw error;
    return false;
  } else {
    const { error } = await sb
      .from('post_likes')
      .insert({ post_id: postId, user_id: app.user.id });

    if (error) throw error;
    return true;
  }
}

// ============================================
// ADD COMMENT
// ============================================
async function addComment(postId, content) {
  const trimmed = content.trim();

  if (!trimmed) throw new Error('Comment cannot be empty');
  if (trimmed.length > 200) throw new Error('Comment is too long');
  if (containsBadWords(trimmed)) throw new Error('Comment contains blocked words');

  const { data, error } = await sb
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: app.user.id,
      content: trimmed
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// DELETE COMMENT
// ============================================
async function deleteComment(commentId) {
  const { error } = await sb
    .from('post_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', app.user.id);

  if (error) throw error;
}

// ============================================
// FETCH COMMENTS
// ============================================
async function fetchComments(postId) {
  try {
    const { data, error } = await sb
      .from('post_comments')
      .select('id, user_id, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch comments error:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await sb
      .from('profiles')
      .select('id, name, is_verified')
      .in('id', userIds);

    const profileMap = {};
    (profiles || []).forEach(p => profileMap[p.id] = p);

    return data.map(c => {
      const profile = profileMap[c.user_id];
      return {
        id: c.id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        author_name: profile?.name || 'User',
        author_verified: profile?.is_verified || false,
        is_mine: c.user_id === app.user.id
      };
    });
  } catch (err) {
    console.error('fetchComments exception:', err);
    return [];
  }
}

// ============================================
// RENDER POST CARD
// ============================================
function renderPostCard(post, options = {}) {
  const initial = (post.author_name || 'U').charAt(0).toUpperCase();
  const time = timeAgo(post.created_at);
  const content = escapeHtml(post.content);
  const isMine = post.user_id === app.user.id;
  const canDelete = isMine;

  return `
    <article class="post-card" data-post-id="${post.id}">
      <header class="post-header">
        <div class="avatar post-avatar">${initial}</div>
        <div class="post-author">
          <div class="post-author-name">
            <span class="post-author-name-text">${escapeHtml(post.author_name)}</span>
            ${verifiedBadgeHTML(post.author_verified, 'sm')}
          </div>
          <div class="post-time">${time}</div>
        </div>
        ${canDelete ? `
          <button class="post-menu-btn" data-post-id="${post.id}" aria-label="Post options">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
        ` : ''}
      </header>

      <div class="post-content">${content}</div>

      <footer class="post-actions">
        <button class="post-action-btn like-btn ${post.liked_by_me ? 'liked' : ''}" data-post-id="${post.id}">
          <svg viewBox="0 0 24 24" fill="${post.liked_by_me ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span class="action-count">${post.like_count || 0}</span>
        </button>

        <button class="post-action-btn comment-btn" data-post-id="${post.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="action-count">${post.comment_count || 0}</span>
        </button>
      </footer>
    </article>
  `;
}

// ============================================
// RENDER COMMENT ITEM
// ============================================
function renderCommentItem(comment) {
  const initial = (comment.author_name || 'U').charAt(0).toUpperCase();
  const time = timeAgo(comment.created_at);

  return `
    <div class="comment-item" data-comment-id="${comment.id}">
      <div class="avatar avatar-xs">${initial}</div>
      <div class="comment-body">
        <div class="comment-header">
          <span class="comment-author">
            ${escapeHtml(comment.author_name)}${verifiedBadgeHTML(comment.author_verified, 'sm')}
          </span>
          <span class="comment-time">${time}</span>
        </div>
        <div class="comment-text">${escapeHtml(comment.content)}</div>
      </div>
      ${comment.is_mine ? `
        <button class="comment-delete-btn" data-comment-id="${comment.id}" aria-label="Delete comment">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      ` : ''}
    </div>
  `;
}

// ============================================
// RENDER EMPTY FEED
// ============================================
function renderEmptyFeed() {
  return `
    <div class="app-empty">
      <div class="app-empty-illustration">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="feed-empty" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#A5B4FC"/>
              <stop offset="100%" stop-color="#6366F1"/>
            </linearGradient>
          </defs>
          <rect x="30" y="20" width="60" height="80" rx="10" stroke="url(#feed-empty)" stroke-width="2.5" fill="none" opacity="0.4"/>
          <line x1="42" y1="42" x2="78" y2="42" stroke="url(#feed-empty)" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
          <line x1="42" y1="56" x2="78" y2="56" stroke="url(#feed-empty)" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
          <line x1="42" y1="70" x2="62" y2="70" stroke="url(#feed-empty)" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
          <circle cx="88" cy="88" r="16" fill="url(#feed-empty)"/>
          <line x1="88" y1="82" x2="88" y2="94" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="82" y1="88" x2="94" y2="88" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <h3 class="app-empty-title">No posts yet</h3>
      <p class="app-empty-text">Be the first to share what's on your mind.</p>
    </div>
  `;
}