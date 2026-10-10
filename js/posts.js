/* ============================================================
   Vibe App — Posts & Feed Module
   Version: 2.2.0
   Handles: Feed, Posts, Likes, Comments, Post Images
   ============================================================ */

/* ------------------------------------------------------------
   FETCH FEED (all users' posts)
   ------------------------------------------------------------ */
async function fetchFeed(limit = 20, offset = 0) {
  const { data: posts, error } = await sb
    .from('posts')
    .select('id, user_id, content, image_url, image_width, image_height, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('fetchFeed error:', error);
    return [];
  }

  if (!posts || posts.length === 0) return [];

  // Fetch authors
  const userIds = [...new Set(posts.map(p => p.user_id))];
  const { data: profiles } = await sb
    .from('profiles')
    .select('id, name, is_verified, avatar_url')
    .in('id', userIds);

  const profileMap = {};
  (profiles || []).forEach(p => profileMap[p.id] = p);

  // Fetch likes count
  const postIds = posts.map(p => p.id);

  const { data: likes } = await sb
    .from('post_likes')
    .select('post_id, user_id')
    .in('post_id', postIds);

  const likeCountMap = {};
  const likedByMeMap = {};
  (likes || []).forEach(l => {
    likeCountMap[l.post_id] = (likeCountMap[l.post_id] || 0) + 1;
    if (l.user_id === window.app?.user?.id) {
      likedByMeMap[l.post_id] = true;
    }
  });

  // Fetch comments count
  const { data: comments } = await sb
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds);

  const commentCountMap = {};
  (comments || []).forEach(c => {
    commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
  });

  return posts.map(p => {
    const profile = profileMap[p.user_id] || {};
    return {
      id: p.id,
      user_id: p.user_id,
      content: p.content || '',
      image_url: p.image_url || null,
      image_width: p.image_width || null,
      image_height: p.image_height || null,
      created_at: p.created_at,
      author_name: profile.name || 'User',
      author_verified: profile.is_verified || false,
      author_avatar: profile.avatar_url || null,
      like_count: likeCountMap[p.id] || 0,
      comment_count: commentCountMap[p.id] || 0,
      liked_by_me: !!likedByMeMap[p.id]
    };
  });
}

/* ------------------------------------------------------------
   FETCH USER POSTS (for profile page)
   ------------------------------------------------------------ */
async function fetchUserPosts(userId, limit = 20) {
  const { data: posts, error } = await sb
    .from('posts')
    .select('id, user_id, content, image_url, image_width, image_height, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchUserPosts error:', error);
    return [];
  }

  if (!posts || posts.length === 0) return [];

  // Fetch likes
  const postIds = posts.map(p => p.id);

  const { data: likes } = await sb
    .from('post_likes')
    .select('post_id, user_id')
    .in('post_id', postIds);

  const likeCountMap = {};
  const likedByMeMap = {};
  (likes || []).forEach(l => {
    likeCountMap[l.post_id] = (likeCountMap[l.post_id] || 0) + 1;
    if (l.user_id === window.app?.user?.id) {
      likedByMeMap[l.post_id] = true;
    }
  });

  // Fetch comments count
  const { data: comments } = await sb
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds);

  const commentCountMap = {};
  (comments || []).forEach(c => {
    commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
  });

  // Get author info (single user)
  const { data: profile } = await sb
    .from('profiles')
    .select('id, name, is_verified, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return posts.map(p => ({
    id: p.id,
    user_id: p.user_id,
    content: p.content || '',
    image_url: p.image_url || null,
    image_width: p.image_width || null,
    image_height: p.image_height || null,
    created_at: p.created_at,
    author_name: profile?.name || 'User',
    author_verified: profile?.is_verified || false,
    author_avatar: profile?.avatar_url || null,
    like_count: likeCountMap[p.id] || 0,
    comment_count: commentCountMap[p.id] || 0,
    liked_by_me: !!likedByMeMap[p.id]
  }));
}

/* ------------------------------------------------------------
   CREATE POST
   ------------------------------------------------------------ */
async function createPost({ content, image_url, image_width, image_height }) {
  const { data, error } = await sb
    .from('posts')
    .insert({
      user_id: window.app.user.id,
      content: content || '',
      image_url: image_url || null,
      image_width: image_width || null,
      image_height: image_height || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------
   DELETE POST
   ------------------------------------------------------------ */
async function deletePost(postId) {
  const { error } = await sb
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', window.app.user.id);

  if (error) throw error;
  return true;
}

/* ------------------------------------------------------------
   TOGGLE LIKE
   ------------------------------------------------------------ */
async function toggleLike(postId, wasLiked) {
  const userId = window.app.user.id;

  if (wasLiked) {
    const { error } = await sb
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await sb
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }

  return true;
}

/* ------------------------------------------------------------
   FETCH COMMENTS
   ------------------------------------------------------------ */
async function fetchComments(postId) {
  const { data: comments, error } = await sb
    .from('post_comments')
    .select('id, user_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchComments error:', error);
    return [];
  }

  if (!comments || comments.length === 0) return [];

  const userIds = [...new Set(comments.map(c => c.user_id))];
  const { data: profiles } = await sb
    .from('profiles')
    .select('id, name, is_verified, avatar_url')
    .in('id', userIds);

  const profileMap = {};
  (profiles || []).forEach(p => profileMap[p.id] = p);

  return comments.map(c => {
    const profile = profileMap[c.user_id] || {};
    return {
      id: c.id,
      user_id: c.user_id,
      content: c.content,
      created_at: c.created_at,
      author_name: profile.name || 'User',
      author_verified: profile.is_verified || false,
      author_avatar: profile.avatar_url || null,
      is_mine: c.user_id === window.app.user.id
    };
  });
}

/* ------------------------------------------------------------
   ADD COMMENT
   ------------------------------------------------------------ */
async function addComment(postId, content) {
  const { data, error } = await sb
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: window.app.user.id,
      content: content
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------
   DELETE COMMENT
   ------------------------------------------------------------ */
async function deleteComment(commentId) {
  const { error } = await sb
    .from('post_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', window.app.user.id);

  if (error) throw error;
  return true;
}

/* ------------------------------------------------------------
   RENDER POST CARD
   ------------------------------------------------------------ */
function renderPostCard(post) {
  const isMine = post.user_id === window.app?.user?.id;
  const initial = (post.author_name || 'U').charAt(0).toUpperCase();

  // Avatar (image or fallback)
  const avatarHTML = post.author_avatar
    ? `<img src="${post.author_avatar}" class="post-card-avatar-img" alt="">`
    : `<span class="post-card-avatar-fallback">${initial}</span>`;

  // Content HTML (only if content exists)
  const contentHTML = post.content
    ? `<div class="post-card-content">${escapeHtml(post.content)}</div>`
    : '';

  // Image HTML (only if image exists)
  const imageHTML = post.image_url
    ? `<div class="post-card-image-wrap">
         <img src="${post.image_url}" 
              class="post-card-image" 
              alt="Post image"
              loading="lazy"
              onclick="event.stopPropagation(); openImageViewer('${post.image_url}')">
       </div>`
    : '';

  // Menu button (only for own posts)
  const menuBtnHTML = isMine
    ? `<button class="post-menu-btn" data-post-id="${post.id}" aria-label="Post options">
         <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
           <circle cx="12" cy="5" r="1.6"></circle>
           <circle cx="12" cy="12" r="1.6"></circle>
           <circle cx="12" cy="19" r="1.6"></circle>
         </svg>
       </button>`
    : '';

  return `
    <article class="post-card" data-post-id="${post.id}">
      <header class="post-card-header">
        <div class="post-card-avatar" data-user-id="${post.user_id}">
          ${avatarHTML}
        </div>
        <div class="post-card-author">
          <div class="post-card-name-row">
            <span class="post-card-name">${escapeHtml(post.author_name || 'User')}</span>
            ${post.author_verified ? `<span class="verified-badge badge-sm" aria-label="Verified">
              <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>` : ''}
          </div>
          <div class="post-card-time">${timeAgo(post.created_at)}</div>
        </div>
        ${menuBtnHTML}
      </header>

      ${contentHTML}
      ${imageHTML}

      <footer class="post-card-actions">
        <button class="post-action like-btn ${post.liked_by_me ? 'liked' : ''}" data-post-id="${post.id}">
          <svg viewBox="0 0 24 24" 
               fill="${post.liked_by_me ? 'currentColor' : 'none'}" 
               stroke="currentColor" 
               stroke-width="2" 
               stroke-linecap="round" 
               stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span class="action-count">${post.like_count || 0}</span>
        </button>

        <button class="post-action comment-btn" data-post-id="${post.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="action-count">${post.comment_count || 0}</span>
        </button>
      </footer>
    </article>
  `;
}

/* ------------------------------------------------------------
   RENDER COMMENT ITEM
   ------------------------------------------------------------ */
function renderCommentItem(comment) {
  const initial = (comment.author_name || 'U').charAt(0).toUpperCase();
  const avatarHTML = comment.author_avatar
    ? `<img src="${comment.author_avatar}" class="comment-avatar-img" alt="">`
    : `<span class="comment-avatar-fallback">${initial}</span>`;

  const deleteBtnHTML = comment.is_mine
    ? `<button class="comment-delete-btn" data-comment-id="${comment.id}" aria-label="Delete">
         <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <polyline points="3 6 5 6 21 6"></polyline>
           <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
         </svg>
       </button>`
    : '';

  return `
    <div class="comment-item" data-comment-id="${comment.id}">
      <div class="comment-avatar">${avatarHTML}</div>
      <div class="comment-body">
        <div class="comment-header">
          <span class="comment-name">${escapeHtml(comment.author_name || 'User')}</span>
          ${comment.author_verified ? `<span class="verified-badge badge-sm" aria-label="Verified">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>` : ''}
          <span class="comment-time">${timeAgo(comment.created_at)}</span>
        </div>
        <div class="comment-text">${escapeHtml(comment.content)}</div>
      </div>
      ${deleteBtnHTML}
    </div>
  `;
}

/* ------------------------------------------------------------
   RENDER EMPTY FEED
   ------------------------------------------------------------ */
function renderEmptyFeed() {
  return `
    <div class="app-empty">
      <div class="app-empty-illustration">
        <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <h3 class="app-empty-title">No posts yet</h3>
      <p class="app-empty-text">Be the first to share something. Tap the + button.</p>
    </div>
  `;
}

/* ------------------------------------------------------------
   EXPORT TO GLOBAL
   ------------------------------------------------------------ */
window.fetchFeed = fetchFeed;
window.fetchUserPosts = fetchUserPosts;
window.createPost = createPost;
window.deletePost = deletePost;
window.toggleLike = toggleLike;
window.fetchComments = fetchComments;
window.addComment = addComment;
window.deleteComment = deleteComment;
window.renderPostCard = renderPostCard;
window.renderCommentItem = renderCommentItem;
window.renderEmptyFeed = renderEmptyFeed;

console.log('[Vibe] posts.js loaded v2.2.0');