/* ============================================
   VIBE — Theme Manager
   ============================================
   Handles: Light / Dark / Auto (system)
   Persists in localStorage
============================================ */

const THEME_KEY = 'vibe_theme';
const THEMES = ['light', 'dark', 'auto'];

// ============================================
// INIT — Apply theme as early as possible
// ============================================
(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'auto';
  applyTheme(saved, false);
})();

// ============================================
// APPLY THEME
// ============================================
function applyTheme(theme, save = true) {
  if (!THEMES.includes(theme)) theme = 'auto';

  document.documentElement.setAttribute('data-theme', theme);

  if (save) {
    localStorage.setItem(THEME_KEY, theme);
  }

  // Update meta theme-color for browser UI
  updateThemeColor(theme);

  // Notify listeners
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

// ============================================
// GET CURRENT THEME
// ============================================
function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'auto';
}

// ============================================
// RESOLVE THEME (auto → light/dark)
// ============================================
function resolveTheme(theme) {
  if (theme !== 'auto') return theme;

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

// ============================================
// UPDATE META THEME-COLOR
// ============================================
function updateThemeColor(theme) {
  const resolved = resolveTheme(theme);
  const color = resolved === 'dark' ? '#0F1A3D' : '#FFFFFF';

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);
}

// ============================================
// LISTEN FOR SYSTEM THEME CHANGE
// ============================================
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getCurrentTheme() === 'auto') {
      updateThemeColor('auto');
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: 'auto' } }));
    }
  });
}

// ============================================
// TOGGLE (light ↔ dark quick toggle)
// ============================================
function toggleTheme() {
  const current = getCurrentTheme();
  const resolved = resolveTheme(current);
  const newTheme = resolved === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  return newTheme;
}

// ============================================
// UI — Render theme selector
// ============================================
function renderThemeSelector(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const current = getCurrentTheme();

  const options = [
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'dark', label: 'Dark', icon: '🌙' },
    { id: 'auto', label: 'Auto', icon: '⚙️' }
  ];

  container.innerHTML = options.map(opt => `
    <button class="theme-option ${opt.id === current ? 'selected' : ''}" data-theme="${opt.id}">
      <div class="theme-preview ${opt.id}"></div>
      <span class="theme-option-label">${opt.icon} ${opt.label}</span>
    </button>
  `).join('');

  // Attach handlers
  container.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      applyTheme(theme);

      // Update selected state
      container.querySelectorAll('.theme-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      // Update profile settings row value if exists
      updateProfileThemeValue(theme);
    });
  });
}

// ============================================
// UPDATE PROFILE ROW VALUE
// ============================================
function updateProfileThemeValue(theme) {
  const el = document.getElementById('themeRowValue');
  if (!el) return;

  const labels = {
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto'
  };
  el.textContent = labels[theme] || 'Auto';
}