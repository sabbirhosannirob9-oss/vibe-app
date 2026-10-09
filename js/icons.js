/* ============================================
   VIBE — SVG Icon Library
   ============================================
   All decorative icons as SVG. No emoji.
============================================ */

const ICONS = {

  // ============================================
  // EMPTY STATES
  // ============================================
  empty_moon: `
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="moon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FCD34D"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
        <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FBBF24" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#FBBF24" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Glow -->
      <circle cx="60" cy="60" r="55" fill="url(#moon-glow)"/>

      <!-- Stars -->
      <circle cx="20" cy="25" r="2" fill="#FCD34D" opacity="0.8">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="95" cy="30" r="2.5" fill="#FCD34D" opacity="0.6">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="30" cy="95" r="1.5" fill="#FCD34D" opacity="0.7">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="100" cy="90" r="2" fill="#FCD34D" opacity="0.5">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="15" cy="65" r="1.5" fill="#FCD34D" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.2s" repeatCount="indefinite"/>
      </circle>

      <!-- Moon crescent -->
      <path d="M75 30 C55 35 45 55 50 75 C55 90 75 100 85 95 C70 95 60 80 60 60 C60 45 68 34 75 30 Z"
        fill="url(#moon-grad)"/>
    </svg>
  `,

  empty_chat: `
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#93C5FD"/>
          <stop offset="100%" stop-color="#6366F1"/>
        </linearGradient>
      </defs>
      <path d="M30 30 H90 C97 30 103 36 103 43 V75 C103 82 97 88 90 88 H50 L35 100 V88 H30 C23 88 17 82 17 75 V43 C17 36 23 30 30 30 Z"
        fill="url(#chat-grad)" opacity="0.15" stroke="url(#chat-grad)" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="48" cy="59" r="4" fill="url(#chat-grad)"/>
      <circle cx="60" cy="59" r="4" fill="url(#chat-grad)"/>
      <circle cx="72" cy="59" r="4" fill="url(#chat-grad)"/>
    </svg>
  `,

  empty_wave: `
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FDE68A"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
      </defs>
      <path d="M30 50 L30 35 C30 30 35 30 35 35 L35 48 M35 48 L35 28 C35 23 40 23 40 28 L40 48 M40 48 L40 25 C40 20 45 20 45 25 L45 48 M45 48 L45 30 C45 25 50 25 50 30 L50 55 L55 50 C58 45 65 48 63 55 L58 70 C56 80 48 88 38 88 C28 88 22 82 22 72 L22 55 C22 48 30 50 30 55 L30 50 Z"
        fill="url(#wave-grad)" stroke="#D97706" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="85" cy="35" r="3" fill="#FBBF24" opacity="0.7">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="95" cy="55" r="2" fill="#FBBF24" opacity="0.5">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="90" cy="75" r="2.5" fill="#FBBF24" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.8s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `,

  empty_search: `
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="search-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#A5B4FC"/>
          <stop offset="100%" stop-color="#6366F1"/>
        </linearGradient>
      </defs>
      <circle cx="55" cy="55" r="28" stroke="url(#search-grad)" stroke-width="4" fill="none" opacity="0.3"/>
      <circle cx="55" cy="55" r="28" stroke="url(#search-grad)" stroke-width="4" stroke-dasharray="120 60" fill="none"/>
      <line x1="76" y1="76" x2="92" y2="92" stroke="url(#search-grad)" stroke-width="5" stroke-linecap="round"/>
    </svg>
  `,

  // ============================================
  // PROFILE META ICONS
  // ============================================
  meta_age: `
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <defs>
        <linearGradient id="age-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FB7185"/>
          <stop offset="100%" stop-color="#E11D48"/>
        </linearGradient>
      </defs>
      <path d="M6 4 V2 M14 4 V2 M4 7 H16 M4 5 H16 C16.6 5 17 5.4 17 6 V16 C17 16.6 16.6 17 16 17 H4 C3.4 17 3 16.6 3 16 V6 C3 5.4 3.4 5 4 5 Z"
        stroke="url(#age-grad)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      <circle cx="8" cy="11" r="0.8" fill="url(#age-grad)"/>
      <circle cx="12" cy="11" r="0.8" fill="url(#age-grad)"/>
    </svg>
  `,

  meta_male: `
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <defs>
        <linearGradient id="male-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#60A5FA"/>
          <stop offset="100%" stop-color="#2563EB"/>
        </linearGradient>
      </defs>
      <circle cx="9" cy="12" r="5" stroke="url(#male-grad)" stroke-width="1.5" fill="none"/>
      <path d="M13 8 L17 4 M14 4 H17 V7" stroke="url(#male-grad)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  meta_female: `
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <defs>
        <linearGradient id="female-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F472B6"/>
          <stop offset="100%" stop-color="#DB2777"/>
        </linearGradient>
      </defs>
      <circle cx="10" cy="8" r="5" stroke="url(#female-grad)" stroke-width="1.5" fill="none"/>
      <line x1="10" y1="13" x2="10" y2="18" stroke="url(#female-grad)" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="7" y1="16" x2="13" y2="16" stroke="url(#female-grad)" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,

  meta_other: `
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <defs>
        <linearGradient id="other-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#C084FC"/>
          <stop offset="100%" stop-color="#7E22CE"/>
        </linearGradient>
      </defs>
      <circle cx="10" cy="10" r="7" stroke="url(#other-grad)" stroke-width="1.5" fill="none"/>
      <circle cx="10" cy="10" r="3" fill="url(#other-grad)"/>
    </svg>
  `,

  meta_city: `
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <defs>
        <linearGradient id="city-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#34D399"/>
          <stop offset="100%" stop-color="#059669"/>
        </linearGradient>
      </defs>
      <path d="M10 18 C10 18 16 12 16 8 C16 4.7 13.3 2 10 2 C6.7 2 4 4.7 4 8 C4 12 10 18 10 18 Z"
        stroke="url(#city-grad)" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
      <circle cx="10" cy="8" r="2.5" stroke="url(#city-grad)" stroke-width="1.5" fill="none"/>
    </svg>
  `,

  // ============================================
  // GENDER AVATARS (Setup)
  // ============================================
  gender_male: `
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <defs>
        <linearGradient id="g-male" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#60A5FA"/>
          <stop offset="100%" stop-color="#2563EB"/>
        </linearGradient>
      </defs>
      <circle cx="30" cy="22" r="9" fill="url(#g-male)"/>
      <path d="M12 50 C12 40 20 34 30 34 C40 34 48 40 48 50" stroke="url(#g-male)" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>
  `,

  gender_female: `
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <defs>
        <linearGradient id="g-female" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F472B6"/>
          <stop offset="100%" stop-color="#DB2777"/>
        </linearGradient>
      </defs>
      <circle cx="30" cy="22" r="9" fill="url(#g-female)"/>
      <path d="M14 50 C14 42 20 36 30 36 C40 36 46 42 46 50" stroke="url(#g-female)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M22 25 C22 32 38 32 38 25" stroke="url(#g-female)" stroke-width="0" fill="none"/>
    </svg>
  `,

  gender_other: `
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <defs>
        <linearGradient id="g-other" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#C084FC"/>
          <stop offset="100%" stop-color="#7E22CE"/>
        </linearGradient>
      </defs>
      <circle cx="30" cy="22" r="9" fill="url(#g-other)"/>
      <path d="M14 50 C14 42 20 36 30 36 C40 36 46 42 46 50" stroke="url(#g-other)" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>
  `,

  // ============================================
  // MOOD TAGS (Match cards)
  // ============================================
  mood_tag: `
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
      <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <circle cx="4.5" cy="5" r="0.6" fill="currentColor"/>
      <circle cx="7.5" cy="5" r="0.6" fill="currentColor"/>
      <path d="M4 7.5 C5 8.5 7 8.5 8 7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none"/>
    </svg>
  `,

  // ============================================
  // UI ICONS
  // ============================================
  ui_search: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
      <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="20" x2="16" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  ui_gift: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
      <polyline points="20 12 20 22 4 22 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="2" y="7" width="20" height="5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <line x1="12" y1="22" x2="12" y2="7" stroke="currentColor" stroke-width="2"/>
      <path d="M12 7 H7.5 A2.5 2.5 0 0 1 7.5 2 C11 2 12 7 12 7 Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>
      <path d="M12 7 H16.5 A2.5 2.5 0 0 0 16.5 2 C13 2 12 7 12 7 Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>
    </svg>
  `,

  ui_streak: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
      <defs>
        <linearGradient id="streak-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#F97316"/>
          <stop offset="100%" stop-color="#FBBF24"/>
        </linearGradient>
      </defs>
      <path d="M12 2 C10 8 6 9 6 14 C6 17.314 8.686 20 12 20 C15.314 20 18 17.314 18 14 C18 9 14 8 12 2 Z M12 17 C10.343 17 9 15.657 9 14 C9 12 10 11 12 8 C14 11 15 12 15 14 C15 15.657 13.657 17 12 17 Z"
        fill="url(#streak-grad)"/>
    </svg>
  `
};

// ============================================
// HELPER: GET ICON SVG
// ============================================
function getIcon(name) {
  return ICONS[name] || '';
}

// ============================================
// HELPER: RENDER ICON IN ELEMENT
// ============================================
function renderIcon(elementId, iconName, customSize = null) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const svg = ICONS[iconName];
  if (!svg) return;

  if (customSize) {
    el.innerHTML = svg.replace(/width="[^"]*"/g, `width="${customSize}"`)
                      .replace(/height="[^"]*"/g, `height="${customSize}"`);
  } else {
    el.innerHTML = svg;
  }
}