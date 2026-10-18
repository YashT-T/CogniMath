/* Page translation using the free Google Website Translator.
   Nothing is loaded for English. When another language is chosen we set Google's "googtrans" cookie,
   reload, and load Google's script, which then translates the whole page (including the games). */
export const LANGS = [
  ['en', 'English'], ['hi', 'हिन्दी (Hindi)'], ['kn', 'ಕನ್ನಡ (Kannada)'], ['ta', 'தமிழ் (Tamil)'], ['te', 'తెలుగు (Telugu)'],
  ['ml', 'മലയാളം (Malayalam)'], ['mr', 'मराठी (Marathi)'], ['bn', 'বাংলা (Bengali)'], ['gu', 'ગુજરાતી (Gujarati)'],
  ['pa', 'ਪੰਜਾਬੀ (Punjabi)'], ['ur', 'اردو (Urdu)'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'],
  ['ar', 'العربية (Arabic)'], ['zh-CN', '中文 (Chinese)'], ['ja', '日本語 (Japanese)']
];

export function currentLang() {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]*\/([^;]+)/);
  const code = m ? decodeURIComponent(m[1]) : 'en';
  return LANGS.some(l => l[0] === code) ? code : 'en';
}

export function chooseLang(code) {
  const expire = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  const host = location.hostname;
  // Clear any old value (Google may have set it on the bare host or the parent domain), then set the new one.
  for (const d of ['', `; domain=${host}`, `; domain=.${host}`]) document.cookie = `googtrans=; ${expire}; path=/${d}`;
  if (code !== 'en') document.cookie = `googtrans=/en/${code}; path=/`;
  location.reload();
}

// Call once at startup. Does nothing for English.
export function startTranslator() {
  if (currentLang() === 'en') return;
  // Google replaces text nodes with <font> wrappers. React and the game code then sometimes try to remove a node
  // that has moved; ignoring that one case stops the page from crashing.
  const rc = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) { return child.parentNode !== this ? child : rc.apply(this, arguments); };
  const ib = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (node, ref) { return ref && ref.parentNode !== this ? node : ib.apply(this, arguments); };

  window.googleTranslateElementInit = () => {
    try { new window.google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element'); } catch (e) {}
  };
  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.async = true;
  document.head.appendChild(s);
}
