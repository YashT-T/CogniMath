import { LANGS, currentLang, chooseLang } from '../lib/translate.js';

/* Language menu. Choosing a language reloads the page, translated by Google Translate. */
export default function LanguagePicker() {
  return (
    <label className="shell-lang">
      <span className="shell-lang-l">🌐 Language</span>
      <select className="shell-select" value={currentLang()} onChange={e => chooseLang(e.target.value)} aria-label="Translate this page">
        {LANGS.map(([code, name]) => <option key={code} value={code} translate="no">{name}</option>)}
      </select>
    </label>
  );
}
