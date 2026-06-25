"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "pl";

interface Translations {
  [key: string]: {
    en: string;
    pl: string;
  };
}

const translations: Translations = {
  home: { en: "Home", pl: "Strona główna" },
  recruitment: { en: "Recruitment", pl: "Rekrutacja" },
  about: { en: "About Us", pl: "O nas" },
  heroTitle: { en: "Welcome to the ", pl: "Witaj w " },
  heroSquad: { en: "777 Clan", pl: "777 Clan" },
  heroSubtitle: { 
    en: "Do you have what it takes to survive? Join our elite unit, conquer the wasteland, and become part of a community built on trust and skill.", 
    pl: "Masz to, czego potrzeba, by przetrwać? Dołącz do naszej elitarnej jednostki, podbijaj pustkowia i stań się częścią społeczności opartej na zaufaniu i umiejętnościach." 
  },
  startApp: { en: "Start Application", pl: "Aplikuj teraz" },
  learnMore: { en: "Learn More", pl: "Dowiedz się więcej" },
  feat1Title: { en: "Elite Community", pl: "Elitarna Społeczność" },
  feat1Desc: { en: "Join a group of dedicated and experienced Unturned players focused on domination and teamwork.", pl: "Dołącz do grupy zaangażowanych i doświadczonych graczy Unturned, skupionych na dominacji i współpracy." },
  feat2Title: { en: "Secure Recruitment", pl: "Bezpieczna Rekrutacja" },
  feat2Desc: { en: "We verify stats directly through Steam and Discord to ensure only the best join our ranks.", pl: "Weryfikujemy statystyki bezpośrednio przez Steam i Discord, aby upewnić się, że dołączają tylko najlepsi." },
  feat3Title: { en: "Regular Events", pl: "Regularne Wydarzenia" },
  feat3Desc: { en: "Participate in clan wars, server raids, and internal tournaments with epic prizes.", pl: "Bierz udział w wojnach klanów, rajdach na serwerach i wewnętrznych turniejach z epickimi nagrodami." },
  rights: { en: "777 Clan. All rights reserved.", pl: "777 Clan. Wszelkie prawa zastrzeżone." },
  applyTitle: { en: "Recruitment Form", pl: "Formularz Rekrutacyjny" },
  authenticatedAs: { en: "Authenticated as: ", pl: "Zalogowano jako: " },
  step1: { en: "Step 1: Login required for identification (Discord) and hours verification (Steam).", pl: "Krok 1: Logowanie wymagane do weryfikacji tożsamości (Discord) i godzin w grze (Steam)." },
  logInFirst: { en: "Log in first to unlock the form.", pl: "Zaloguj się najpierw, aby odblokować formularz." },
  loadingForm: { en: "Loading form...", pl: "Ładowanie formularza..." },
  fillRequired: { en: "Please fill required field: ", pl: "Proszę wypełnić wymagane pole: " },
  successSubmit: { en: "Success! Your application has been sent.", pl: "Sukces! Twoja aplikacja została wysłana." },
  errorOccurred: { en: "An error occurred.", pl: "Wystąpił błąd." },
  errorSending: { en: "An error occurred during submission.", pl: "Wystąpił błąd podczas wysyłania." },
  submitApp: { en: "Submit Application", pl: "Wyślij Podanie" },
  submitting: { en: "Submitting...", pl: "Wysyłanie..." },
  connectDiscord: { en: "Connect with Discord", pl: "Połącz z Discord" },
  connectSteam: { en: "Connect with Steam", pl: "Połącz ze Steam" },
  logOut: { en: "LOG OUT", pl: "WYLOGUJ SIĘ" },
  aboutStory: { 
    en: "We are a group of friends who met in Unturned and founded the 777 clan in 2022. Since then, we've been regularly terrorizing the servers we play on.", 
    pl: "Jesteśmy grupką znajomych, którzy poznali się właśnie w Unturned i założyli w 2022 clan 777. Od tego czasu regularnie terroryzujemy serwery, na których gramy." 
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("pl");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang === "en" || savedLang === "pl") {
      setLanguageState(savedLang);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][language] || key;
  };

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: "pl", setLanguage, t: (k) => translations[k]?.pl || k }}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
