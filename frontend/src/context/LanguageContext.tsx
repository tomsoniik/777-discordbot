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
  },
  
  builder_materials: { en: "Building Blocks", pl: "Budulec" },
  builder_cost: { en: "Total Cost", pl: "Materiały (Koszt)" },
  builder_empty: { en: "No structures placed.", pl: "Brak postawionych struktur." },
  builder_instructions_title: { en: "Building Instructions:", pl: "Instrukcja Budowania:" },
  builder_instructions_1: { en: "- Select an item from the left. (Press [ESC] to deselect).", pl: "- Wybierz element z listy po lewej. (Wciśnij [ESC] by odznaczyć)." },
  builder_instructions_2: { en: "- Hover over a placed object's edge to snap the next one.", pl: "- Najedź na krawędź postawionego obiektu, by \"przykleić\" (Snap) kolejny." },
  builder_instructions_3: { en: "- Press [R] to change edge / rotate element.", pl: "- Wciśnij [R], aby zmienić krawędź / obrócić element." },
  builder_instructions_4: { en: "- Hold [Right Click] on background to pan camera.", pl: "- Przytrzymaj Prawy Przycisk Myszy (PPM) na tle, by przesuwać kamerę." },
  builder_instructions_5: { en: "- To delete an object, hold [Left Click] on it for 2 seconds (when no item is selected).", pl: "- Aby usunąć obiekt, przytrzymaj na nim Lewy Przycisk Myszy (LPM) przez 2 sekundy (gdy nie masz wybranego klocka w ręce)." },
  builder_instructions_6: { en: "- Scroll wheel to zoom in/out.", pl: "- Kółko myszy przybliża/oddala widok." },
  clear_project_confirm: { en: "Are you sure you want to clear the entire project?", pl: "Czy na pewno chcesz wyczyścić cały projekt?" },
  
  pine_plank: { en: "Pine Plank", pl: "Sosnowa Deska" },
  metal_sheet: { en: "Metal Sheet", pl: "Metalowa Płyta" },
  brick: { en: "Brick", pl: "Cegła" },
  
  w_found: { en: "Pine Foundation", pl: "Sosnowy Fundament" },
  w_found_tri: { en: "Pine Tri Foundation", pl: "Sosnowy Trój. Fundament" },
  w_roof: { en: "Pine Roof", pl: "Sosnowy Dach" },
  w_roof_tri: { en: "Pine Tri Roof", pl: "Sosnowy Trój. Dach" },
  w_hole: { en: "Pine Hole", pl: "Sosnowa Dziura" },

  m_found: { en: "Metal Foundation", pl: "Metalowy Fundament" },
  m_found_tri: { en: "Metal Tri Foundation", pl: "Metalowy Trój. Fundament" },
  m_roof: { en: "Metal Roof", pl: "Metalowy Dach" },
  m_roof_tri: { en: "Metal Tri Roof", pl: "Metalowy Trój. Dach" },
  m_hole: { en: "Metal Hole", pl: "Metalowa Dziura" },

  b_found: { en: "Brick Foundation", pl: "Ceglany Fundament" },
  b_found_tri: { en: "Brick Tri Foundation", pl: "Ceglany Trój. Fundament" },
  b_roof: { en: "Brick Roof", pl: "Ceglany Dach" },
  b_roof_tri: { en: "Brick Tri Roof", pl: "Ceglany Trój. Dach" },
  b_hole: { en: "Brick Hole", pl: "Ceglana Dziura" }
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
