/*!
 * CMP - Cookie Consent Manager
 * Version: 1.0.0
 * Lightweight, framework-free, GitHub-hostable
 */
(function (global) {
  'use strict';

  // ─── Constants ────────────────────────────────────────────────────────────
  const STORAGE_KEY = 'cmp_consent';
  const CATEGORIES = ['necessary', 'functionality', 'analytics', 'advertising'];

  // ─── Default config ───────────────────────────────────────────────────────
  const DEFAULT_CONFIG = {
    version: '1',
    theme: {
      bannerBackground: '#ffffff',
      bannerText: '#1f2937',
      primaryButtonBackground: '#111827',
      primaryButtonText: '#ffffff',
      secondaryButtonBackground: '#e5e7eb',
      secondaryButtonText: '#111827',
      linkColor: '#2563eb',
      overlayBackground: 'rgba(0,0,0,0.5)',
      toggleActive: '#111827',
      toggleInactive: '#d1d5db',
    },
    content: {
      bannerTitle: 'We value your privacy',
      bannerText: 'We use cookies to improve your experience, analyse traffic and personalise content. You can choose which categories to allow.',
      privacyPolicyUrl: '/privacy-policy',
      privacyPolicyText: 'Privacy Policy',
      acceptAllText: 'Accept all',
      rejectAllText: 'Reject all',
      manageText: 'Manage preferences',
      saveText: 'Save preferences',
      modalTitle: 'Cookie preferences',
      modalDescription: 'Choose which categories of cookies you allow us to use. Your choice will be saved for 365 days.',
      categories: {
        necessary: {
          label: 'Strictly necessary',
          description: 'These cookies are required for the website to function and cannot be disabled.',
        },
        functionality: {
          label: 'Functionality',
          description: 'These cookies allow the website to remember choices you make and provide enhanced features.',
        },
        analytics: {
          label: 'Analytics',
          description: 'These cookies help us understand how visitors interact with the website.',
        },
        advertising: {
          label: 'Advertising',
          description: 'These cookies are used to deliver relevant advertisements and track campaign performance.',
        },
      },
    },
    selectors: {
      reopenTrigger: '#cookie-settings',
    },
    googleConsentMode: false,
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function mergeDeep(target, source) {
    const out = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(function (key) {
        if (isObject(source[key])) {
          if (!target[key]) out[key] = source[key];
          else out[key] = mergeDeep(target[key], source[key]);
        } else {
          out[key] = source[key];
        }
      });
    }
    return out;
  }

  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + d.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
  }

  function getCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        try { return JSON.parse(decodeURIComponent(c.substring(nameEQ.length))); }
        catch (e) { return null; }
      }
    }
    return null;
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    root.style.setProperty('--cmp-banner-bg', theme.bannerBackground);
    root.style.setProperty('--cmp-banner-text', theme.bannerText);
    root.style.setProperty('--cmp-primary-bg', theme.primaryButtonBackground);
    root.style.setProperty('--cmp-primary-text', theme.primaryButtonText);
    root.style.setProperty('--cmp-secondary-bg', theme.secondaryButtonBackground);
    root.style.setProperty('--cmp-secondary-text', theme.secondaryButtonText);
    root.style.setProperty('--cmp-link', theme.linkColor);
    root.style.setProperty('--cmp-overlay', theme.overlayBackground);
    root.style.setProperty('--cmp-toggle-on', theme.toggleActive);
    root.style.setProperty('--cmp-toggle-off', theme.toggleInactive);
  }

  // ─── Consent Storage ──────────────────────────────────────────────────────
  function loadConsent(configVersion) {
    var stored = getCookie(STORAGE_KEY);
    if (!stored) {
      try {
        var ls = localStorage.getItem(STORAGE_KEY);
        if (ls) stored = JSON.parse(ls);
      } catch (e) {}
    }
    if (stored && stored.version === configVersion) return stored;
    return null;
  }

  function saveConsent(state, configVersion) {
    var payload = {
      version: configVersion,
      timestamp: Date.now(),
      categories: state,
    };
    try { setCookie(STORAGE_KEY, JSON.stringify(payload), 365); } catch (e) {}
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}
    return payload;
  }

  // ─── Google Consent Mode ──────────────────────────────────────────────────
  function updateGoogleConsent(state) {
    if (typeof global.gtag !== 'function') return;
    global.gtag('consent', 'update', {
      analytics_storage: state.analytics ? 'granted' : 'denied',
      ad_storage: state.advertising ? 'granted' : 'denied',
      ad_user_data: state.advertising ? 'granted' : 'denied',
      ad_personalization: state.advertising ? 'granted' : 'denied',
      functionality_storage: state.functionality ? 'granted' : 'denied',
      personalization_storage: state.functionality ? 'granted' : 'denied',
    });
  }

  // ─── Consent-gated element visibility ────────────────────────────────────
  function revealConsentElements(state) {
    var categories = ['functionality', 'analytics', 'advertising'];
    categories.forEach(function (cat) {
      document.querySelectorAll('[data-cmp-consent="' + cat + '"]').forEach(function (el) {
        if (state[cat]) {
          el.style.display = el.getAttribute('data-cmp-display') || 'block';
        } else {
          el.style.display = 'none';
        }
      });
    });
  }

  // ─── Script Activation ────────────────────────────────────────────────────
  var activatedScripts = [];

  function activateScripts(state) {
    // Blocked <script type="text/plain"> elements
    var blocked = document.querySelectorAll('script[type="text/plain"][data-cookie-consent]');
    blocked.forEach(function (el) {
      var cat = el.getAttribute('data-cookie-consent');
      if (cat === 'necessary' || state[cat]) {
        if (activatedScripts.indexOf(el) !== -1) return;
        activatedScripts.push(el);
        var newScript = document.createElement('script');
        Array.from(el.attributes).forEach(function (attr) {
          if (attr.name !== 'type' && attr.name !== 'data-cookie-consent') {
            newScript.setAttribute(attr.name, attr.value);
          }
        });
        newScript.type = 'text/javascript';
        if (el.src || el.getAttribute('src')) {
          newScript.src = el.src || el.getAttribute('src');
        } else {
          newScript.textContent = el.textContent;
        }
        el.parentNode.insertBefore(newScript, el.nextSibling);
      }
    });

    // Blocked iframes with data-src
    var iframes = document.querySelectorAll('iframe[data-cookie-consent][data-src]');
    iframes.forEach(function (el) {
      var cat = el.getAttribute('data-cookie-consent');
      if (cat === 'necessary' || state[cat]) {
        if (activatedScripts.indexOf(el) !== -1) return;
        activatedScripts.push(el);
        el.src = el.getAttribute('data-src');
        el.removeAttribute('data-src');
      }
    });
  }

  // ─── Banner & Modal HTML ──────────────────────────────────────────────────
  function buildUI(cfg) {
    var c = cfg.content;
    var cats = c.categories;

    // Banner
    var banner = document.createElement('div');
    banner.id = 'cmp-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', c.bannerTitle);
    banner.innerHTML =
      '<div class="cmp-banner-inner">' +
        '<div class="cmp-banner-content">' +
          '<h2 class="cmp-banner-title">' + escHtml(c.bannerTitle) + '</h2>' +
          '<p class="cmp-banner-text">' + escHtml(c.bannerText) + ' ' +
            '<a href="' + escHtml(c.privacyPolicyUrl) + '" class="cmp-link" target="_blank" rel="noopener">' + escHtml(c.privacyPolicyText) + '</a>' +
          '</p>' +
        '</div>' +
        '<div class="cmp-banner-actions">' +
          '<button id="cmp-accept-all" class="cmp-btn cmp-btn-primary">' + escHtml(c.acceptAllText) + '</button>' +
          '<button id="cmp-reject-all" class="cmp-btn cmp-btn-secondary">' + escHtml(c.rejectAllText) + '</button>' +
          '<button id="cmp-manage" class="cmp-btn cmp-btn-ghost">' + escHtml(c.manageText) + '</button>' +
        '</div>' +
      '</div>';

    // Modal
    var modal = document.createElement('div');
    modal.id = 'cmp-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', c.modalTitle);

    var togglesHtml = CATEGORIES.map(function (cat) {
      var info = cats[cat] || { label: cat, description: '' };
      var isNecessary = cat === 'necessary';
      return (
        '<div class="cmp-category">' +
          '<div class="cmp-category-header">' +
            '<div class="cmp-category-info">' +
              '<span class="cmp-category-label">' + escHtml(info.label) + '</span>' +
              (isNecessary ? '<span class="cmp-badge">Always on</span>' : '') +
            '</div>' +
            '<label class="cmp-toggle" aria-label="' + escHtml(info.label) + '">' +
              '<input type="checkbox" data-category="' + cat + '"' + (isNecessary ? ' checked disabled' : '') + '>' +
              '<span class="cmp-toggle-track"><span class="cmp-toggle-thumb"></span></span>' +
            '</label>' +
          '</div>' +
          '<p class="cmp-category-desc">' + escHtml(info.description) + '</p>' +
        '</div>'
      );
    }).join('');

    modal.innerHTML =
      '<div class="cmp-modal">' +
        '<div class="cmp-modal-header">' +
          '<h2 class="cmp-modal-title">' + escHtml(c.modalTitle) + '</h2>' +
          '<button class="cmp-modal-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="cmp-modal-body">' +
          '<p class="cmp-modal-desc">' + escHtml(c.modalDescription) + '</p>' +
          '<div class="cmp-categories">' + togglesHtml + '</div>' +
        '</div>' +
        '<div class="cmp-modal-footer">' +
          '<button id="cmp-modal-accept-all" class="cmp-btn cmp-btn-primary">' + escHtml(c.acceptAllText) + '</button>' +
          '<button id="cmp-modal-reject-all" class="cmp-btn cmp-btn-secondary">' + escHtml(c.rejectAllText) + '</button>' +
          '<button id="cmp-modal-save" class="cmp-btn cmp-btn-primary">' + escHtml(c.saveText) + '</button>' +
        '</div>' +
      '</div>';

    return { banner: banner, modal: modal };
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── Core CMP ─────────────────────────────────────────────────────────────
  function CMP() {
    this._cfg = mergeDeep(DEFAULT_CONFIG, global.CMP_CONFIG || {});
    this._state = null;
    this._banner = null;
    this._modal = null;
  }

  CMP.prototype.init = function () {
    var self = this;
    var cfg = this._cfg;

    applyTheme(cfg.theme);

    var stored = loadConsent(cfg.version);
    if (stored) {
      this._state = stored.categories;
      activateScripts(this._state);
      revealConsentElements(this._state);
      if (cfg.googleConsentMode) updateGoogleConsent(this._state);
    } else {
      this._showBanner();
    }

    // Reopen trigger
    var trigger = cfg.selectors && cfg.selectors.reopenTrigger;
    if (trigger) {
      document.querySelectorAll(trigger).forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          self.openPreferences();
        });
      });
    }
  };

  CMP.prototype._showBanner = function () {
    var self = this;
    var els = buildUI(this._cfg);
    this._banner = els.banner;
    this._modal = els.modal;

    document.body.appendChild(this._banner);
    document.body.appendChild(this._modal);

    // Slight delay to allow CSS transition
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        self._banner.classList.add('cmp-visible');
      });
    });

    this._bindEvents();
  };

  CMP.prototype._bindEvents = function () {
    var self = this;

    // Banner
    document.getElementById('cmp-accept-all').addEventListener('click', function () {
      self._accept();
    });
    document.getElementById('cmp-reject-all').addEventListener('click', function () {
      self._reject();
    });
    document.getElementById('cmp-manage').addEventListener('click', function () {
      self._openModal();
    });

    // Modal
    document.getElementById('cmp-modal-accept-all').addEventListener('click', function () {
      self._accept();
    });
    document.getElementById('cmp-modal-reject-all').addEventListener('click', function () {
      self._reject();
    });
    document.getElementById('cmp-modal-save').addEventListener('click', function () {
      self._saveFromModal();
    });
    document.querySelector('.cmp-modal-close').addEventListener('click', function () {
      self._closeModal();
    });
    this._modal.addEventListener('click', function (e) {
      if (e.target === self._modal) self._closeModal();
    });

    // Keyboard
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') self._closeModal();
    });
  };

  CMP.prototype._accept = function () {
    var state = { necessary: true, functionality: true, analytics: true, advertising: true };
    this._persist(state);
  };

  CMP.prototype._reject = function () {
    var state = { necessary: true, functionality: false, analytics: false, advertising: false };
    this._persist(state);
  };

  CMP.prototype._saveFromModal = function () {
    var state = { necessary: true };
    this._modal.querySelectorAll('input[data-category]').forEach(function (input) {
      var cat = input.getAttribute('data-category');
      if (cat !== 'necessary') state[cat] = input.checked;
    });
    this._persist(state);
    this._closeModal();
  };

  CMP.prototype._persist = function (state) {
    this._state = state;
    saveConsent(state, this._cfg.version);
    activateScripts(state);
    revealConsentElements(state);
    if (this._cfg.googleConsentMode) updateGoogleConsent(state);
    this._hideBanner();

    // Fire custom event
    document.dispatchEvent(new CustomEvent('cmp:consent', { detail: state }));
  };

  CMP.prototype._hideBanner = function () {
    var self = this;
    if (this._banner) {
      this._banner.classList.remove('cmp-visible');
      this._banner.classList.add('cmp-hiding');
      setTimeout(function () {
        if (self._banner && self._banner.parentNode) {
          self._banner.parentNode.removeChild(self._banner);
        }
      }, 400);
    }
    this._closeModal();
  };

  CMP.prototype._openModal = function () {
    var self = this;
    if (!this._modal) {
      var els = buildUI(this._cfg);
      this._modal = els.modal;
      document.body.appendChild(this._modal);
      this._bindModalEvents();
    }
    // Reflect current state in toggles
    var currentState = this._state || {};
    this._modal.querySelectorAll('input[data-category]').forEach(function (input) {
      var cat = input.getAttribute('data-category');
      if (cat !== 'necessary') {
        input.checked = !!currentState[cat];
      }
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        self._modal.classList.add('cmp-visible');
        document.body.classList.add('cmp-no-scroll');
      });
    });
  };

  CMP.prototype._bindModalEvents = function () {
    var self = this;
    document.getElementById('cmp-modal-accept-all').addEventListener('click', function () { self._accept(); });
    document.getElementById('cmp-modal-reject-all').addEventListener('click', function () { self._reject(); });
    document.getElementById('cmp-modal-save').addEventListener('click', function () { self._saveFromModal(); });
    document.querySelector('.cmp-modal-close').addEventListener('click', function () { self._closeModal(); });
    this._modal.addEventListener('click', function (e) { if (e.target === self._modal) self._closeModal(); });
  };

  CMP.prototype._closeModal = function () {
    if (this._modal) {
      this._modal.classList.remove('cmp-visible');
      document.body.classList.remove('cmp-no-scroll');
    }
  };

  // ─── Public API ───────────────────────────────────────────────────────────
  CMP.prototype.openPreferences = function () {
    if (!this._modal) {
      var els = buildUI(this._cfg);
      this._banner = this._banner || null;
      this._modal = els.modal;
      document.body.appendChild(this._modal);
      this._bindModalEvents();
    }
    this._openModal();
  };

  CMP.prototype.resetConsent = function () {
    try { document.cookie = STORAGE_KEY + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; } catch (e) {}
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    this._state = null;
    if (!this._banner) {
      var els = buildUI(this._cfg);
      this._banner = els.banner;
      this._modal = els.modal;
      document.body.appendChild(this._banner);
      document.body.appendChild(this._modal);
      var self = this;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          self._banner.classList.add('cmp-visible');
        });
      });
      this._bindEvents();
    }
  };

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    var cmp = new CMP();
    cmp.init();
    global.CMP = cmp;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window));
