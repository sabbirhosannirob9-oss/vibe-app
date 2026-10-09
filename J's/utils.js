/* ============================================
   VIBE — Utility Functions
============================================ */

// ============================================
// 1. Time Ago Formatter
// "5 minutes ago" / "2h ago" / "3d ago" type
// ============================================
function timeAgo(timestamp) {
  if (!timestamp) return 'Unknown';

  const now = new Date();
  const then = new Date(timestamp);
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)}d ago`;
  return 'long ago';
}

// ============================================
// 2. Active Status Calculator
// Returns: { status: 'online'|'active'|'away'|'offline', label, color }
// ============================================
function getActiveStatus(lastSeen) {
  if (!lastSeen) {
    return { status: 'offline', label: 'Offline', color: 'gray' };
  }

  const diffSec = Math.floor((Date.now() - new Date(lastSeen)) / 1000);

  if (diffSec < 60) {
    return { status: 'online', label: 'Online now', color: 'green' };
  }
  if (diffSec < 300) {  // 5 min
    return { status: 'active', label: 'Active recently', color: 'yellow' };
  }
  if (diffSec < 3600) {
    return { status: 'away', label: `Last seen ${timeAgo(lastSeen)}`, color: 'gray' };
  }
  if (diffSec < 86400) {
    return { status: 'away', label: `Last seen ${timeAgo(lastSeen)}`, color: 'gray' };
  }
  if (diffSec < 259200) {  // 3 days
    return { status: 'away', label: `Last seen ${timeAgo(lastSeen)}`, color: 'gray' };
  }
  return { status: 'hidden', label: 'Offline', color: 'gray' };
}

// ============================================
// 3. Keyword Filter (bad words)
// ============================================
const BLOCKED_WORDS = [
  // Basic English bad words (add more as needed)
  'fuck', 'shit', 'bitch', 'asshole', 'bastard',
  'dick', 'pussy', 'cunt', 'whore', 'slut',
  // Add Bengali bad words here later
  // 'xxx', 'yyy',
];

function containsBadWords(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some(word => lower.includes(word));
}

function filterMessage(text) {
  if (!text) return '';
  let filtered = text;
  BLOCKED_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  return filtered;
}

// ============================================
// 4. Email Validator
// ============================================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// 5. Password Validator (min 6 chars)
// ============================================
function isValidPassword(password) {
  return password && password.length >= 6;
}

// ============================================
// 6. Greeting based on time of day
// ============================================
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

// ============================================
// 7. Get mood details by id
// ============================================
function getMoodById(moodId) {
  return CONFIG.MOODS.find(m => m.id === moodId) || null;
}

// ============================================
// 8. Escape HTML (XSS protection)
// ============================================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// 9. Toast notification
// ============================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: ${type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#1A1A2E'};
    color: white;
    padding: 12px 24px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 90vw;
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
// ============================================
// VERIFIED BADGE HTML
// ============================================
function verifiedBadgeHTML(isVerified, size = 'default') {
  if (!isVerified) return '';
  
  const sizeClass = size === 'lg' ? 'badge-lg' 
                  : size === 'sm' ? 'badge-sm' 
                  : size === 'chat' ? 'badge-chat' 
                  : '';
  
  return `<span class="verified-badge ${sizeClass}" aria-label="Verified">
    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </span>`;
}