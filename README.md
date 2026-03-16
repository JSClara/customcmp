# CMP — Lightweight Cookie Consent Manager

A tiny, framework-free, GitHub-hostable Cookie Management Platform (CMP) that supports:

- Category-based consent (necessary / functionality / analytics / advertising)
- Google Consent Mode v2
- Blocking scripts and iframes until consent
- Accept all / Reject all / Save preferences
- Preferences modal
- Reopening preferences from any button or link
- First-party cookie + localStorage storage
- Easy per-site configuration

---

## Repository structure

```
cmp/
├── dist/
│   ├── cmp.js          ← Main runtime (load in every site)
│   └── cmp.css         ← Styles (load in every site)
├── examples/
│   ├── standard-example.html   ← Standard site without GCM
│   ├── gcm-example.html        ← Site with Google Consent Mode v2
│   └── webflow-example.html    ← Webflow installation guide
├── snippets/
│   └── gcm-bootstrap.html      ← GCM bootstrap snippet template
└── README.md
```

---

## Publishing with GitHub Pages

1. Create a new GitHub repository (e.g. `cmp` or `cookie-consent`).
2. Push this project to the `main` branch.
3. Go to **Settings → Pages**.
4. Set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
5. Click **Save**. GitHub Pages will publish at:

```
https://YOUR-USERNAME.github.io/YOUR-REPO/
```

Your files will be available at:

```
https://YOUR-USERNAME.github.io/YOUR-REPO/dist/cmp.css
https://YOUR-USERNAME.github.io/YOUR-REPO/dist/cmp.js
```

> **Note:** GitHub Pages can take a few minutes to go live after the first publish.
> Test at the URLs above before adding them to production sites.

---

## Referencing the files from your websites

In every site's `<head>`, after your CMP config (see below):

```html
<link rel="stylesheet" href="https://YOUR-USERNAME.github.io/YOUR-REPO/dist/cmp.css">
```

Before `</body>` (or at the end of `<head>` with `defer`):

```html
<script src="https://YOUR-USERNAME.github.io/YOUR-REPO/dist/cmp.js"></script>
```

---

## Installation: standard site (no Google Consent Mode)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <!-- 1. Per-site configuration -->
  <script>
    window.CMP_CONFIG = {
      version: '1',
      googleConsentMode: false,
      theme: {
        bannerBackground:          '#ffffff',
        bannerText:                '#1f2937',
        primaryButtonBackground:   '#111827',
        primaryButtonText:         '#ffffff',
        secondaryButtonBackground: '#e5e7eb',
        secondaryButtonText:       '#111827',
        linkColor:                 '#2563eb',
      },
      content: {
        bannerTitle:       'We value your privacy',
        bannerText:        'We use cookies to improve your experience.',
        privacyPolicyUrl:  '/privacy-policy',
        privacyPolicyText: 'Privacy Policy',
        acceptAllText:     'Accept all',
        rejectAllText:     'Reject all',
        manageText:        'Manage preferences',
        saveText:          'Save preferences',
        modalTitle:        'Cookie preferences',
        modalDescription:  'Choose which cookies you allow.',
      },
      selectors: {
        reopenTrigger: '#cookie-settings',
      },
    };
  </script>

  <!-- 2. CMP styles -->
  <link rel="stylesheet" href="https://YOUR-USERNAME.github.io/YOUR-REPO/dist/cmp.css">
</head>
<body>

  <!-- 3. Blocked scripts in page (before cmp.js) -->
  <script type="text/plain" data-cookie-consent="analytics">
    console.log('Analytics loaded');
  </script>

  <!-- 4. CMP script -->
  <script src="https://YOUR-USERNAME.github.io/YOUR-REPO/dist/cmp.js"></script>

</body>
</html>
```

---

## Installation: with Google Consent Mode v2

**Critical install order — do not change:**

```html
<head>
  <!-- STEP 1: GCM bootstrap (MUST be first — before any Google scripts) -->
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      analytics_storage:       'denied',
      ad_storage:              'denied',
      ad_user_data:            'denied',
      ad_personalization:      'denied',
      functionality_storage:   'denied',
      personalization_storage: 'denied',
      wait_for_update:         500
    });
    gtag('set', 'url_passthrough', true);
    gtag('set', 'ads_data_redaction', true);
  </script>

  <!-- STEP 2: Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-XXXXXXX');</script>

  <!-- STEP 3: CMP configuration -->
  <script>
    window.CMP_CONFIG = {
      version: '1',
      googleConsentMode: true,   // ← Must be true
      // ... rest of config
    };
  </script>

  <!-- STEP 4: CMP styles -->
  <link rel="stylesheet" href="https://YOUR-USERNAME.github.io/YOUR-REPO/dist/cmp.css">
</head>
<body>
  <!-- STEP 5: CMP script (footer) -->
  <script src="https://YOUR-USERNAME.github.io/YOUR-REPO/dist/cmp.js"></script>
</body>
```

When using Google Consent Mode, you do **not** need to block the GTM script itself. Google tags operate in cookieless mode until consent is granted, then switch to full measurement automatically.

---

## Updating colours and text per site

Every site has its own `CMP_CONFIG` object. Change values directly:

```js
window.CMP_CONFIG = {
  theme: {
    primaryButtonBackground: '#e11d48',   // Red brand colour
    primaryButtonText:       '#ffffff',
    linkColor:               '#e11d48',
  },
  content: {
    bannerTitle: 'Cookie settings',
    bannerText:  'We use cookies. Choose what you accept.',
  },
};
```

Only override the values you need — defaults are merged automatically.

---

## Adding blocked scripts

### Inline script

```html
<script type="text/plain" data-cookie-consent="analytics">
  // Only runs after analytics consent
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### External script

```html
<script
  type="text/plain"
  data-cookie-consent="analytics"
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
  async>
</script>
```

### Blocked iframe

```html
<iframe
  data-cookie-consent="functionality"
  data-src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
  width="560"
  height="315"
  frameborder="0"
  allowfullscreen>
</iframe>
```

The `src` will be populated from `data-src` only after consent is given for the specified category.

### Available categories

| Value           | Description                          |
|-----------------|--------------------------------------|
| `necessary`     | Always active — cannot be blocked    |
| `functionality` | Enhanced features, preferences       |
| `analytics`     | Traffic measurement, session data    |
| `advertising`   | Ad targeting, conversion tracking    |

---

## Adding a cookie settings button

Add any element with the ID or selector you set in `CMP_CONFIG.selectors.reopenTrigger`:

```html
<!-- In your footer -->
<a href="#" id="cookie-settings">Cookie settings</a>
```

Or a button:

```html
<button id="cookie-settings">Cookie settings</button>
```

The CMP automatically prevents the default click action and opens the preferences modal.

If you want multiple elements to trigger it, use a class:

```js
selectors: {
  reopenTrigger: '.cookie-settings-btn',
}
```

```html
<a href="#" class="cookie-settings-btn">Cookie settings</a>
<button class="cookie-settings-btn">Manage cookies</button>
```

---

## JavaScript API

```js
// Open the preferences modal from your own code
window.CMP.openPreferences();

// Clear stored consent and show the banner again
window.CMP.resetConsent();
```

### Consent event

The CMP fires a custom DOM event when the user saves consent:

```js
document.addEventListener('cmp:consent', function (e) {
  console.log('Consent state:', e.detail);
  // e.detail = { necessary: true, functionality: false, analytics: true, advertising: false }
});
```

---

## Testing the setup

1. Open your site in a browser.
2. Open DevTools → **Application → Cookies** (or **Local Storage**).
3. Verify no `cmp_consent` cookie/localStorage entry exists before interaction.
4. Accept all → check the consent cookie is set.
5. Check that blocked `<script type="text/plain">` elements have been replaced with active `<script>` tags (visible in the Elements panel).
6. Hard-refresh — banner should **not** reappear if valid consent exists.
7. Test `window.CMP.resetConsent()` in the console — banner should reappear.

### Testing Google Consent Mode

1. Install the [Google Tag Assistant](https://tagassistant.google.com/) extension.
2. Load the page and observe that GTM fires but consent signals are `denied` initially.
3. Accept consent in the banner.
4. Observe `gtag('consent', 'update', {...})` is called with `granted` values.

---

## Versioning updates safely

The `cmp.js` and `cmp.css` files are hosted on GitHub Pages directly from the `main` branch. To release updates safely:

### Option A: Version folders (recommended for production)

Use versioned paths in your `dist/` folder:

```
dist/
  v1/
    cmp.js
    cmp.css
  v2/
    cmp.js
    cmp.css
```

Reference specific versions in your sites:

```html
<link rel="stylesheet" href="https://...github.io/repo/dist/v1/cmp.css">
<script src="https://...github.io/repo/dist/v1/cmp.js"></script>
```

When you're ready to update a site, change `v1` to `v2`.

### Option B: Rolling main (simpler)

Keep overwriting `dist/cmp.js` and `dist/cmp.css` on `main`. All sites update automatically. Lower overhead but no per-site control.

### Option C: GitHub Releases + jsDelivr CDN

Tag releases and reference via jsDelivr for automatic CDN caching:

```
https://cdn.jsdelivr.net/gh/YOUR-USERNAME/YOUR-REPO@1.0.0/dist/cmp.js
```

Replace `1.0.0` with your Git tag.

---

## Forcing a consent reset with version change

If you change your cookie policy, data categories, or third-party tools in a way that requires fresh consent, bump the `version` field in your `CMP_CONFIG`:

```js
window.CMP_CONFIG = {
  version: '2',   // Changed from '1' — forces all users to re-consent
  // ...
};
```

Stored consent with a different version is ignored and the banner is shown again.

---

## Webflow installation

See `examples/webflow-example.html` for the full Webflow guide.

**Summary:**

1. **Site Settings → Custom Code → Head Code:**
   - GCM bootstrap (if using GCM)
   - GTM snippet (if using GCM and GTM)
   - `CMP_CONFIG` script block
   - `<link>` tag for `cmp.css`

2. **Site Settings → Custom Code → Footer Code:**
   - Any `<script type="text/plain" data-cookie-consent="...">` blocked scripts
   - `<script src="...cmp.js">` at the very end

3. **To add a "Cookie settings" button:**
   - Add a Text Link or Button element in the Designer.
   - Set its **ID** to `cookie-settings` in Element Settings.

4. **To block iframes** (e.g. YouTube embeds):
   - Use an Embed element.
   - Write the `<iframe>` with `data-src` instead of `src`.
   - Add `data-cookie-consent="functionality"`.

---

## File sizes

| File      | Approx. size |
|-----------|-------------|
| `cmp.js`  | ~6–7 KB     |
| `cmp.css` | ~4–5 KB     |

No dependencies. No frameworks. No build step required.

---

## Browser support

All modern browsers. IE11 is not supported.

---

## Licence

MIT — use freely in client and commercial projects.
