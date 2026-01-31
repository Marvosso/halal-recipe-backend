import React from "react";
import { Globe } from "lucide-react";
import { t, setLanguage, getLanguage, getAvailableLanguages } from "../lib/i18n";
import "./LanguageSwitcher.css";

function LanguageSwitcher() {
  const currentLang = getLanguage();
  const languages = getAvailableLanguages();

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    // Reload page to apply translations (simple approach)
    window.location.reload();
  };

  return (
    <div className="language-switcher">
      <Globe className="language-icon" />
      <select
        className="language-select"
        value={currentLang}
        onChange={handleLanguageChange}
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSwitcher;
