/* ============================================
   VIBE — Daily Gifts & Streak System
   ============================================
   Custom SVG icons — no emoji
   Premium rarity-based design
============================================ */

// ============================================
// SVG ICON LIBRARY
// ============================================
const GIFT_SVGS = {
  // ---------- COMMON ----------
  star: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-star" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#94A3B8"/>
          <stop offset="100%" stop-color="#64748B"/>
        </linearGradient>
      </defs>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill="url(#grad-star)" stroke="#475569" stroke-width="1" stroke-linejoin="round"/>
    </svg>`,

  spark: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-spark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#CBD5E1"/>
          <stop offset="100%" stop-color="#94A3B8"/>
        </linearGradient>
      </defs>
      <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z"
        fill="url(#grad-spark)" stroke="#64748B" stroke-width="1" stroke-linejoin="round"/>
    </svg>`,

  fire: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-fire" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#F97316"/>
          <stop offset="100%" stop-color="#FBBF24"/>
        </linearGradient>
      </defs>
      <path d="M12 2C10 8 6 9 6 14C6 17.314 8.686 20 12 20C15.314 20 18 17.314 18 14C18 9 14 8 12 2ZM12 17C10.343 17 9 15.657 9 14C9 12 10 11 12 8C14 11 15 12 15 14C15 15.657 13.657 17 12 17Z"
        fill="url(#grad-fire)"/>
    </svg>`,

  moon: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-moon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#E2E8F0"/>
          <stop offset="100%" stop-color="#94A3B8"/>
        </linearGradient>
      </defs>
      <path d="M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79Z"
        fill="url(#grad-moon)" stroke="#64748B" stroke-width="1" stroke-linejoin="round"/>
    </svg>`,

  cloud: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#E2E8F0"/>
          <stop offset="100%" stop-color="#CBD5E1"/>
        </linearGradient>
      </defs>
      <path d="M18 10H17.5C17 6.5 14.5 4 11.5 4C9 4 7 5.5 6 8C3.5 8.5 2 10.5 2 13C2 15.8 4.2 18 7 18H18C20.2 18 22 16.2 22 14C22 11.8 20.2 10 18 10Z"
        fill="url(#grad-cloud)" stroke="#94A3B8" stroke-width="1"/>
    </svg>`,

  // ---------- UNCOMMON ----------
  heart: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-heart" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FB7185"/>
          <stop offset="100%" stop-color="#E11D48"/>
        </linearGradient>
      </defs>
      <path d="M20.84 4.61C19.62 3.39 18 2.72 16.27 2.72C14.54 2.72 12.92 3.39 11.7 4.61L12 4.91L12.3 4.61C11.08 3.39 9.46 2.72 7.73 2.72C6 2.72 4.38 3.39 3.16 4.61C0.72 7.05 0.72 11.01 3.16 13.45L12 22.29L20.84 13.45C23.28 11.01 23.28 7.05 20.84 4.61Z"
        fill="url(#grad-heart)"/>
    </svg>`,

  clover: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-clover" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#34D399"/>
          <stop offset="100%" stop-color="#059669"/>
        </linearGradient>
      </defs>
      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM12 18C13.1 18 14 18.9 14 20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20C10 18.9 10.9 18 12 18ZM6 12C6 10.9 6.9 10 8 10C9.1 10 10 10.9 10 12C10 13.1 9.1 14 8 14C6.9 14 6 13.1 6 12ZM18 12C18 13.1 17.1 14 16 14C14.9 14 14 13.1 14 12C14 10.9 14.9 10 16 10C17.1 10 18 10.9 18 12Z"
        fill="url(#grad-clover)"/>
    </svg>`,

  flower: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-flower" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F9A8D4"/>
          <stop offset="100%" stop-color="#EC4899"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="2.5" fill="#FBBF24"/>
      <path d="M12 9.5C12 6.5 10 4 12 2C14 4 12 6.5 12 9.5Z" fill="url(#grad-flower)"/>
      <path d="M12 14.5C12 17.5 14 20 12 22C10 20 12 17.5 12 14.5Z" fill="url(#grad-flower)"/>
      <path d="M9.5 12C6.5 12 4 10 2 12C4 14 6.5 12 9.5 12Z" fill="url(#grad-flower)"/>
      <path d="M14.5 12C17.5 12 20 14 22 12C20 10 17.5 12 14.5 12Z" fill="url(#grad-flower)"/>
    </svg>`,

  // ---------- RARE ----------
  diamond: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-diamond" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#60A5FA"/>
          <stop offset="50%" stop-color="#3B82F6"/>
          <stop offset="100%" stop-color="#1D4ED8"/>
        </linearGradient>
      </defs>
      <path d="M5 9L12 2L19 9L12 22L5 9Z" fill="url(#grad-diamond)" stroke="#1E40AF" stroke-width="0.8" stroke-linejoin="round"/>
      <path d="M5 9H19M12 2L9 9L12 22M12 2L15 9L12 22" stroke="#DBEAFE" stroke-width="0.8" opacity="0.5"/>
    </svg>`,

  crystal: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-crystal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#A5B4FC"/>
          <stop offset="50%" stop-color="#6366F1"/>
          <stop offset="100%" stop-color="#4338CA"/>
        </linearGradient>
      </defs>
      <path d="M12 2L20 8V16L12 22L4 16V8L12 2Z" fill="url(#grad-crystal)" stroke="#312E81" stroke-width="0.8"/>
      <path d="M12 2V22M4 8L20 16M20 8L4 16" stroke="#C7D2FE" stroke-width="0.6" opacity="0.5"/>
    </svg>`,

  rocket: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-rocket" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#60A5FA"/>
          <stop offset="100%" stop-color="#2563EB"/>
        </linearGradient>
      </defs>
      <path d="M12 2C12 2 17 6 17 13C17 17 15 20 12 22C9 20 7 17 7 13C7 6 12 2 12 2Z" fill="url(#grad-rocket)"/>
      <circle cx="12" cy="11" r="2" fill="#DBEAFE"/>
      <path d="M7 13L4 16L7 17M17 13L20 16L17 17" stroke="#F97316" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 22L11 20L12 18L13 20L12 22Z" fill="#FBBF24"/>
    </svg>`,

  // ---------- EPIC ----------
  crown: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-crown" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FCD34D"/>
          <stop offset="100%" stop-color="#D97706"/>
        </linearGradient>
      </defs>
      <path d="M3 8L7 12L12 5L17 12L21 8L19 20H5L3 8Z" fill="url(#grad-crown)" stroke="#92400E" stroke-width="0.8" stroke-linejoin="round"/>
      <circle cx="3" cy="8" r="1.5" fill="#FBBF24"/>
      <circle cx="21" cy="8" r="1.5" fill="#FBBF24"/>
      <circle cx="12" cy="5" r="1.5" fill="#FBBF24"/>
      <circle cx="12" cy="14" r="1" fill="#FEF3C7"/>
    </svg>`,

  unicorn: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-unicorn" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#C084FC"/>
          <stop offset="50%" stop-color="#A855F7"/>
          <stop offset="100%" stop-color="#7E22CE"/>
        </linearGradient>
      </defs>
      <path d="M5 15C5 11 7 9 10 9C13 9 15 11 15 14L20 14L20 18C20 19 19 20 18 20H8C6.34 20 5 18.66 5 17V15Z" fill="url(#grad-unicorn)"/>
      <path d="M10 9L12 3L14 9" fill="#FBBF24" stroke="#D97706" stroke-width="0.5"/>
      <circle cx="9" cy="13" r="0.8" fill="#1A1A2E"/>
      <path d="M20 14L22 15L20 16" fill="#FBBF24"/>
    </svg>`,

  theater: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-theater" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#C084FC"/>
          <stop offset="100%" stop-color="#7E22CE"/>
        </linearGradient>
      </defs>
      <path d="M4 4H11V12C11 14 9 16 7.5 16C6 16 4 14 4 12V4Z" fill="url(#grad-theater)"/>
      <path d="M13 4H20V12C20 14 18 16 16.5 16C15 16 13 14 13 12V4Z" fill="url(#grad-theater)"/>
      <circle cx="7.5" cy="10" r="1" fill="#FEF3C7"/>
      <circle cx="16.5" cy="10" r="1" fill="#FEF3C7"/>
      <path d="M4 4H11M13 4H20" stroke="#FBBF24" stroke-width="1.5"/>
      <path d="M3 19H21M3 21H21" stroke="#A855F7" stroke-width="1" opacity="0.5"/>
    </svg>`,

  // ---------- LEGENDARY ----------
  trophy: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-trophy" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FDE68A"/>
          <stop offset="50%" stop-color="#FBBF24"/>
          <stop offset="100%" stop-color="#B45309"/>
        </linearGradient>
      </defs>
      <path d="M7 3H17V7C17 10 15 12 12 12C9 12 7 10 7 7V3Z" fill="url(#grad-trophy)"/>
      <path d="M7 4H4V7C4 9 5.5 10 7 10V4Z" fill="#FBBF24" stroke="#B45309" stroke-width="0.6"/>
      <path d="M17 4H20V7C20 9 18.5 10 17 10V4Z" fill="#FBBF24" stroke="#B45309" stroke-width="0.6"/>
      <rect x="9" y="12" width="6" height="4" fill="#D97706"/>
      <rect x="7" y="16" width="10" height="3" rx="0.5" fill="#92400E"/>
      <rect x="6" y="19" width="12" height="2" rx="0.5" fill="#78350F"/>
    </svg>`,

  rainbow: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#EF4444"/>
          <stop offset="20%" stop-color="#F59E0B"/>
          <stop offset="40%" stop-color="#FBBF24"/>
          <stop offset="60%" stop-color="#10B981"/>
          <stop offset="80%" stop-color="#3B82F6"/>
          <stop offset="100%" stop-color="#8B5CF6"/>
        </linearGradient>
      </defs>
      <path d="M2 18C2 12 6.5 7 12 7C17.5 7 22 12 22 18" stroke="url(#grad-rainbow)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="4" cy="19" r="1.5" fill="#DBEAFE" opacity="0.5"/>
      <circle cx="20" cy="19" r="1.5" fill="#DBEAFE" opacity="0.5"/>
    </svg>`,

  genie: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-genie" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FDE68A"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
      </defs>
      <path d="M12 2C12 4 10 6 8 6C6 6 5 7 5 9C5 11 7 12 7 14L9 14L9 22H15L15 14L17 14C17 12 19 11 19 9C19 7 18 6 16 6C14 6 12 4 12 2Z" fill="url(#grad-genie)"/>
      <circle cx="9" cy="10" r="0.6" fill="#1A1A2E"/>
      <circle cx="15" cy="10" r="0.6" fill="#1A1A2E"/>
    </svg>`
};

// ============================================
// GIFT POOL (Rarity-based)
// ============================================
const GIFT_POOL = {
  common: {
    weight: 50,
    color: '#94A3B8',
    glow: 'rgba(148,163,184,0.4)',
    gifts: [
      { type: 'star', svg: 'star', name: 'Silver Star' },
      { type: 'spark', svg: 'spark', name: 'Sparkle' },
      { type: 'fire', svg: 'fire', name: 'Flame' },
      { type: 'moon', svg: 'moon', name: 'Moonlight' },
      { type: 'cloud', svg: 'cloud', name: 'Cloud' }
    ]
  },
  uncommon: {
    weight: 30,
    color: '#10B981',
    glow: 'rgba(16,185,129,0.4)',
    gifts: [
      { type: 'heart', svg: 'heart', name: 'Heart' },
      { type: 'clover', svg: 'clover', name: 'Lucky Clover' },
      { type: 'flower', svg: 'flower', name: 'Blossom' }
    ]
  },
  rare: {
    weight: 15,
    color: '#3B82F6',
    glow: 'rgba(59,130,246,0.5)',
    gifts: [
      { type: 'diamond', svg: 'diamond', name: 'Diamond' },
      { type: 'crystal', svg: 'crystal', name: 'Crystal' },
      { type: 'rocket', svg: 'rocket', name: 'Rocket' }
    ]
  },
  epic: {
    weight: 4,
    color: '#A855F7',
    glow: 'rgba(168,85,247,0.6)',
    gifts: [
      { type: 'crown', svg: 'crown', name: 'Golden Crown' },
      { type: 'unicorn', svg: 'unicorn', name: 'Unicorn' },
      { type: 'theater', svg: 'theater', name: 'Masquerade' }
    ]
  },
  legendary: {
    weight: 1,
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.7)',
    gifts: [
      { type: 'trophy', svg: 'trophy', name: 'Champion Trophy' },
      { type: 'rainbow', svg: 'rainbow', name: 'Rainbow' },
      { type: 'genie', svg: 'genie', name: 'Magic Genie' }
    ]
  }
};

// ============================================
// STREAK MILESTONES
// ============================================
const STREAK_MILESTONES = {
  3: { rarity: 'uncommon', label: '3-Day Starter' },
  7: { rarity: 'rare', label: '7-Day Warrior' },
  14: { rarity: 'epic', label: '14-Day Champion' },
  30: { rarity: 'legendary', label: '30-Day Legend' },
  100: { rarity: 'legendary', label: '100-Day Master' }
};

// ============================================
// PICK RANDOM GIFT
// ============================================
function pickRandomGift(forcedRarity = null) {
  let rarity = forcedRarity;

  if (!rarity) {
    const roll = Math.random() * 100;
    if (roll < 50) rarity = 'common';
    else if (roll < 80) rarity = 'uncommon';
    else if (roll < 95) rarity = 'rare';
    else if (roll < 99) rarity = 'epic';
    else rarity = 'legendary';
  }

  const pool = GIFT_POOL[rarity];
  const gift = pool.gifts[Math.floor(Math.random() * pool.gifts.length)];

  return {
    ...gift,
    rarity,
    color: pool.color,
    glow: pool.glow
  };
}

// ============================================
// CALCULATE STREAK
// ============================================
function calculateStreak(lastLoginDate, currentStreak) {
  if (!lastLoginDate) return { streak: 1, isNew: true };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = new Date(lastLoginDate);
  last.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { streak: currentStreak, isNew: false, alreadyToday: true };
  }

  if (diffDays === 1) {
    return { streak: currentStreak + 1, isNew: true };
  }

  return { streak: 1, isNew: true, reset: true };
}

// ============================================
// CHECK GIFT STATUS
// ============================================
async function checkGiftStatus(userId) {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await sb
    .from('daily_gifts')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  return data;
}

// ============================================
// CLAIM DAILY GIFT
// ============================================
async function claimDailyGift(userId) {
  const today = new Date().toISOString().split('T')[0];

  const existing = await checkGiftStatus(userId);
  if (existing) {
    return { alreadyClaimed: true, gift: existing };
  }

  const { data: profile, error: profErr } = await sb
    .from('profiles')
    .select('streak_count, longest_streak, last_login_date, total_gifts')
    .eq('id', userId)
    .single();

  if (profErr) throw profErr;

  const streakInfo = calculateStreak(profile.last_login_date, profile.streak_count || 0);

  let forcedRarity = null;
  let milestoneLabel = null;

  if (STREAK_MILESTONES[streakInfo.streak]) {
    forcedRarity = STREAK_MILESTONES[streakInfo.streak].rarity;
    milestoneLabel = STREAK_MILESTONES[streakInfo.streak].label;
  }

  const gift = pickRandomGift(forcedRarity);

  const { error: giftErr } = await sb
    .from('daily_gifts')
    .insert({
      user_id: userId,
      gift_type: gift.type,
      gift_emoji: gift.svg,
      gift_rarity: gift.rarity,
      gift_name: gift.name,
      date: today
    });

  if (giftErr) throw giftErr;

  const newLongest = Math.max(profile.longest_streak || 0, streakInfo.streak);
  const newTotal = (profile.total_gifts || 0) + 1;

  const { error: updateErr } = await sb
    .from('profiles')
    .update({
      streak_count: streakInfo.streak,
      longest_streak: newLongest,
      last_login_date: today,
      total_gifts: newTotal,
      gift_claimed_today: true
    })
    .eq('id', userId);

  if (updateErr) throw updateErr;

  return {
    alreadyClaimed: false,
    gift,
    streak: streakInfo.streak,
    isMilestone: !!milestoneLabel,
    milestoneLabel,
    totalGifts: newTotal,
    isNewStreak: streakInfo.isNew,
    wasReset: streakInfo.reset || false
  };
}

// ============================================
// GET USER GIFTS
// ============================================
async function getUserGifts(userId, limit = 20) {
  const { data, error } = await sb
    .from('daily_gifts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get gifts error:', error);
    return [];
  }

  return data || [];
}

// ============================================
// GET GIFT STATS
// ============================================
async function getGiftStats(userId) {
  const { data: profile } = await sb
    .from('profiles')
    .select('streak_count, longest_streak, total_gifts, gift_claimed_today, last_login_date')
    .eq('id', userId)
    .single();

  return profile || {
    streak_count: 0,
    longest_streak: 0,
    total_gifts: 0,
    gift_claimed_today: false,
    last_login_date: null
  };
}

// ============================================
// RENDER GIFT ITEM (SVG)
// ============================================
function renderGiftItem(gift, size = 'default') {
  const pool = GIFT_POOL[gift.gift_rarity || gift.rarity];
  const color = pool?.color || '#94A3B8';
  const svgKey = gift.gift_emoji || gift.svg || gift.gift_type;
  const svgContent = GIFT_SVGS[svgKey] || GIFT_SVGS.star;

  const sizeClass = size === 'sm' ? 'gift-item-sm'
                  : size === 'lg' ? 'gift-item-lg'
                  : '';

  return `
    <div class="gift-item ${sizeClass}" style="--gift-color: ${color};">
      ${svgContent}
    </div>
  `;
}

// ============================================
// GET RARITY LABEL
// ============================================
function getRarityLabel(rarity) {
  const labels = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary'
  };
  return labels[rarity] || rarity;
}

// ============================================
// RENDER GIFT SVG (raw)
// ============================================
function renderGiftSVG(giftKey) {
  return GIFT_SVGS[giftKey] || GIFT_SVGS.star;
}