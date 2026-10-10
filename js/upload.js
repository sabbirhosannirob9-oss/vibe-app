/* ============================================================
   Vibe App — Image Upload & Resize Module
   Version: 2.2.0
   Handles: Avatar, Cover, Chat Photo, Post Image uploads
   ============================================================ */

/* ------------------------------------------------------------
   CONFIG
   ------------------------------------------------------------ */
const UPLOAD_CONFIG = {
  avatar: {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.85,
    bucket: 'avatars',
    folder: 'avatar',
    maxSizeMB: 1
  },
  cover: {
    maxWidth: 1200,
    maxHeight: 400,
    quality: 0.85,
    bucket: 'avatars',
    folder: 'cover',
    maxSizeMB: 1.5
  },
  chat: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
    bucket: 'chat-photos',
    folder: 'chat',
    maxSizeMB: 1.5
  },
  post: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
    bucket: 'post-images',
    folder: 'post',
    maxSizeMB: 1.5
  }
};

/* ------------------------------------------------------------
   IMAGE RESIZE (Canvas-based, no external libs)
   ------------------------------------------------------------ */
function resizeImage(file, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85
  } = options;

  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid image file'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------
   GET BLOB DIMENSIONS
   ------------------------------------------------------------ */
function getBlobDimensions(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

/* ------------------------------------------------------------
   UPLOADING OVERLAY
   ------------------------------------------------------------ */
function showUploadingOverlay(text = 'Uploading...') {
  let overlay = document.getElementById('uploadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'uploadingOverlay';
    overlay.className = 'uploading-overlay';
    overlay.innerHTML = `
      <div class="uploading-spinner">
        <svg viewBox="0 0 50 50" width="48" height="48">
          <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(37,99,235,0.15)" stroke-width="5"/>
          <circle cx="25" cy="25" r="20" fill="none" stroke="#2563EB" stroke-width="5"
                  stroke-linecap="round" stroke-dasharray="90 150">
            <animateTransform attributeName="transform" type="rotate"
              from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>
        <p class="uploading-text">${text}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    const txt = overlay.querySelector('.uploading-text');
    if (txt) txt.textContent = text;
    overlay.classList.add('active');
  }

  requestAnimationFrame(() => overlay.classList.add('active'));
}

function hideUploadingOverlay() {
  const overlay = document.getElementById('uploadingOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      if (overlay && !overlay.classList.contains('active')) {
        overlay.remove();
      }
    }, 300);
  }
}

/* ------------------------------------------------------------
   SUPABASE UPLOAD HELPER
   ------------------------------------------------------------ */
async function uploadToSupabase(blob, bucket, path) {
  const supabase = window.supabaseClient || window.supabase || window.sb;
  if (!supabase) throw new Error('Supabase client not found');

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '3600'
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

async function deleteFromSupabase(bucket, path) {
  const supabase = window.supabaseClient || window.supabase || window.sb;
  if (!supabase) return;
  try {
    await supabase.storage.from(bucket).remove([path]);
  } catch (e) {
    console.warn('Delete failed:', e);
  }
}

/* ------------------------------------------------------------
   GET CURRENT USER ID
   ------------------------------------------------------------ */
async function getCurrentUserId() {
  const supabase = window.supabaseClient || window.supabase || window.sb;
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

/* ------------------------------------------------------------
   AVATAR UPLOAD
   ------------------------------------------------------------ */
async function uploadAvatar(file) {
  try {
    showUploadingOverlay('Uploading avatar...');

    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const blob = await resizeImage(file, UPLOAD_CONFIG.avatar);

    if (blob.size > UPLOAD_CONFIG.avatar.maxSizeMB * 1024 * 1024) {
      throw new Error(`Image too large (max ${UPLOAD_CONFIG.avatar.maxSizeMB}MB)`);
    }

    const path = `${userId}/avatar-${Date.now()}.jpg`;
    const publicUrl = await uploadToSupabase(blob, 'avatars', path);

    const supabase = window.supabaseClient || window.supabase || window.sb;
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    // Update local state
    if (window.app?.profile) window.app.profile.avatar_url = publicUrl;

    if (typeof updateAvatarUI === 'function') {
      updateAvatarUI(publicUrl);
    }

    hideUploadingOverlay();
    if (typeof showToast === 'function') showToast('Avatar updated', 'success');
    return publicUrl;

  } catch (err) {
    console.error('uploadAvatar error:', err);
    hideUploadingOverlay();
    if (typeof showToast === 'function') showToast(err.message || 'Upload failed', 'error');
    throw err;
  }
}

/* ------------------------------------------------------------
   COVER UPLOAD
   ------------------------------------------------------------ */
async function uploadCover(file) {
  try {
    showUploadingOverlay('Uploading cover...');

    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const blob = await resizeImage(file, UPLOAD_CONFIG.cover);

    if (blob.size > UPLOAD_CONFIG.cover.maxSizeMB * 1024 * 1024) {
      throw new Error(`Image too large (max ${UPLOAD_CONFIG.cover.maxSizeMB}MB)`);
    }

    const path = `${userId}/cover-${Date.now()}.jpg`;
    const publicUrl = await uploadToSupabase(blob, 'avatars', path);

    const supabase = window.supabaseClient || window.supabase || window.sb;
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ cover_url: publicUrl })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    if (window.app?.profile) window.app.profile.cover_url = publicUrl;

    if (typeof updateCoverUI === 'function') {
      updateCoverUI(publicUrl);
    }

    hideUploadingOverlay();
    if (typeof showToast === 'function') showToast('Cover updated', 'success');
    return publicUrl;

  } catch (err) {
    console.error('uploadCover error:', err);
    hideUploadingOverlay();
    if (typeof showToast === 'function') showToast(err.message || 'Upload failed', 'error');
    throw err;
  }
}

/* ------------------------------------------------------------
   CHAT PHOTO UPLOAD
   ------------------------------------------------------------ */
async function uploadChatPhoto(file, roomId) {
  try {
    showUploadingOverlay('Sending photo...');

    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    if (!roomId) throw new Error('No active chat room');

    const blob = await resizeImage(file, UPLOAD_CONFIG.chat);

    if (blob.size > UPLOAD_CONFIG.chat.maxSizeMB * 1024 * 1024) {
      throw new Error(`Image too large (max ${UPLOAD_CONFIG.chat.maxSizeMB}MB)`);
    }

    const path = `${roomId}/${userId}-${Date.now()}.jpg`;
    const publicUrl = await uploadToSupabase(blob, 'chat-photos', path);

    const supabase = window.supabaseClient || window.supabase || window.sb;
    const { data: inserted, error: insertErr } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: userId,
        message: '📷 Photo',
        image_url: publicUrl,
        message_type: 'image'
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    hideUploadingOverlay();

    if (typeof appendMessage === 'function' && inserted) {
      appendMessage(inserted);
    }

    return publicUrl;

  } catch (err) {
    console.error('uploadChatPhoto error:', err);
    hideUploadingOverlay();
    if (typeof showToast === 'function') showToast(err.message || 'Photo send failed', 'error');
    throw err;
  }
}

/* ------------------------------------------------------------
   POST IMAGE UPLOAD (v2.2.0)
   ------------------------------------------------------------ */
async function uploadPostImage(file) {
  try {
    showUploadingOverlay('Uploading photo...');

    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const blob = await resizeImage(file, UPLOAD_CONFIG.post);

    if (blob.size > UPLOAD_CONFIG.post.maxSizeMB * 1024 * 1024) {
      throw new Error(`Image too large (max ${UPLOAD_CONFIG.post.maxSizeMB}MB)`);
    }

    const dims = await getBlobDimensions(blob);
    const path = `${userId}/post-${Date.now()}.jpg`;
    const publicUrl = await uploadToSupabase(blob, 'post-images', path);

    hideUploadingOverlay();

    return {
      url: publicUrl,
      width: dims.width,
      height: dims.height
    };

  } catch (err) {
    console.error('uploadPostImage error:', err);
    hideUploadingOverlay();
    if (typeof showToast === 'function') showToast(err.message || 'Upload failed', 'error');
    throw err;
  }
}

/* ------------------------------------------------------------
   REMOVE AVATAR
   ------------------------------------------------------------ */
async function removeAvatar() {
  try {
    showUploadingOverlay('Removing avatar...');

    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const supabase = window.supabaseClient || window.supabase || window.sb;
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId);

    if (error) throw error;

    if (window.app?.profile) window.app.profile.avatar_url = null;

    if (typeof updateAvatarUI === 'function') {
      updateAvatarUI(null);
    }

    hideUploadingOverlay();
    if (typeof showToast === 'function') showToast('Avatar removed', 'success');

  } catch (err) {
    console.error('removeAvatar error:', err);
    hideUploadingOverlay();
    if (typeof showToast === 'function') showToast(err.message || 'Remove failed', 'error');
  }
}

/* ------------------------------------------------------------
   HANDLE IMAGE UPLOAD (generic router)
   ------------------------------------------------------------ */
async function handleImageUpload(file, type, roomId) {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    if (typeof showToast === 'function') showToast('Please select an image', 'error');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    if (typeof showToast === 'function') showToast('Image too large (max 10MB)', 'error');
    return;
  }

  switch (type) {
    case 'avatar':
      await uploadAvatar(file);
      break;
    case 'cover':
      await uploadCover(file);
      break;
    case 'chat':
      await uploadChatPhoto(file, roomId);
      break;
    case 'post':
      return await uploadPostImage(file);
    default:
      console.warn('Unknown upload type:', type);
  }
}

/* ------------------------------------------------------------
   IMAGE VIEWER (full screen)
   ------------------------------------------------------------ */
function openImageViewer(url) {
  let viewer = document.getElementById('imageViewer');
  if (!viewer) {
    viewer = document.createElement('div');
    viewer.id = 'imageViewer';
    viewer.className = 'image-viewer';
    viewer.innerHTML = `
      <button class="image-viewer-close" aria-label="Close">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <img class="image-viewer-img" src="" alt="Preview"/>
    `;
    viewer.addEventListener('click', (e) => {
      if (e.target === viewer || e.target.closest('.image-viewer-close')) {
        closeImageViewer();
      }
    });
    document.body.appendChild(viewer);
  }

  const img = viewer.querySelector('.image-viewer-img');
  img.src = url;
  viewer.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeImageViewer() {
  const viewer = document.getElementById('imageViewer');
  if (viewer) {
    viewer.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ------------------------------------------------------------
   UI HELPERS
   ------------------------------------------------------------ */
function updateAvatarUI(url) {
  // Own profile page
  const avatarImg = document.getElementById('profileAvatarImg');
  const avatarFallback = document.getElementById('profileAvatarFallback');

  if (url) {
    if (avatarImg) {
      avatarImg.src = url;
      avatarImg.style.display = 'block';
    }
    if (avatarFallback) avatarFallback.style.display = 'none';
  } else {
    if (avatarImg) {
      avatarImg.src = '';
      avatarImg.style.display = 'none';
    }
    if (avatarFallback) {
      avatarFallback.textContent = (window.app?.profile?.name || 'U').charAt(0).toUpperCase();
      avatarFallback.style.display = 'flex';
    }
  }

  // Header avatar (if exists)
  const headerAvatar = document.getElementById('headerAvatarImg');
  if (headerAvatar && url) headerAvatar.src = url;
}

function updateCoverUI(url) {
  const coverImg = document.getElementById('profileCoverImg');
  if (!coverImg) return;
  if (url) {
    coverImg.src = url;
    coverImg.style.display = 'block';
  } else {
    coverImg.src = '';
    coverImg.style.display = 'none';
  }
}

/* ------------------------------------------------------------
   EXPORT TO GLOBAL
   ------------------------------------------------------------ */
window.VibeUpload = {
  resizeImage,
  getBlobDimensions,
  uploadAvatar,
  uploadCover,
  uploadChatPhoto,
  uploadPostImage,
  removeAvatar,
  handleImageUpload,
  showUploadingOverlay,
  hideUploadingOverlay,
  openImageViewer,
  closeImageViewer,
  updateAvatarUI,
  updateCoverUI,
  UPLOAD_CONFIG
};

// Also expose as globals
window.resizeImage = resizeImage;
window.getBlobDimensions = getBlobDimensions;
window.uploadAvatar = uploadAvatar;
window.uploadCover = uploadCover;
window.uploadChatPhoto = uploadChatPhoto;
window.uploadPostImage = uploadPostImage;
window.removeAvatar = removeAvatar;
window.handleImageUpload = handleImageUpload;
window.openImageViewer = openImageViewer;
window.closeImageViewer = closeImageViewer;
window.updateAvatarUI = updateAvatarUI;
window.updateCoverUI = updateCoverUI;

console.log('[Vibe] upload.js loaded v2.2.0');