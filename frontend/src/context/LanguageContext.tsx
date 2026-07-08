"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "pl" | "ru";

interface Translations {
  [key: string]: {
    en: string;
    pl: string;
    ru: string;
  };
}

const translations: Translations = {
  home: { en: "Home", pl: "Strona główna", ru: "Главная" },
  recruitment: { en: "Recruitment", pl: "Rekrutacja", ru: "Рекрутинг" },
  about: { en: "About Us", pl: "O nas", ru: "О нас" },
  heroTitle: { en: "Welcome to the ", pl: "Witaj w ", ru: "Добро пожаловать в " },
  heroSquad: { en: "777 Clan", pl: "777 Clan", ru: "777 Clan" },
  heroSubtitle: { 
    en: "Do you have what it takes to survive? Join our elite unit, conquer the wasteland, and become part of a community built on trust and skill.", 
    pl: "Masz to, czego potrzeba, by przetrwać? Dołącz do naszej elitarnej jednostki, podbijaj pustkowia i stań się częścią społeczności opartej na zaufaniu i umiejętnościach.",
    ru: "У тебя есть все необходимое, чтобы выжить? Присоединяйся к нашему элитному подразделению, покоряй пустоши и стань частью сообщества, построенного на доверии и мастерстве." 
  },
  startApp: { en: "Start Application", pl: "Aplikuj teraz", ru: "Подать заявку" },
  learnMore: { en: "Learn More", pl: "Dowiedz się więcej", ru: "Узнать больше" },
  feat1Title: { en: "Elite Community", pl: "Elitarna Społeczność", ru: "Элитное сообщество" },
  feat1Desc: { en: "Join a group of dedicated and experienced Unturned players focused on domination and teamwork.", pl: "Dołącz do grupy zaangażowanych i doświadczonych graczy Unturned, skupionych na dominacji i współpracy.", ru: "Присоединяйся к группе преданных и опытных игроков Unturned, нацеленных на доминирование и командную работу." },
  feat2Title: { en: "Secure Recruitment", pl: "Bezpieczna Rekrutacja", ru: "Безопасный набор" },
  feat2Desc: { en: "We verify stats directly through Steam and Discord to ensure only the best join our ranks.", pl: "Weryfikujemy statystyki bezpośrednio przez Steam i Discord, aby upewnić się, że dołączają tylko najlepsi.", ru: "Мы проверяем статистику напрямую через Steam и Discord, чтобы убедиться, что к нам присоединяются только лучшие." },
  feat3Title: { en: "Regular Events", pl: "Regularne Wydarzenia", ru: "Регулярные события" },
  feat3Desc: { en: "Participate in clan wars, server raids, and internal tournaments with epic prizes.", pl: "Bierz udział w wojnach klanów, rajdach na serwerach i wewnętrznych turniejach z epickimi nagrodami.", ru: "Участвуй в клановых войнах, рейдах на серверах и внутренних турнирах с эпическими призами." },
  rights: { en: "777 Clan. All rights reserved.", pl: "777 Clan. Wszelkie prawa zastrzeżone.", ru: "777 Clan. Все права защищены." },
  applyTitle: { en: "Recruitment Form", pl: "Formularz Rekrutacyjny", ru: "Форма набора" },
  authenticatedAs: { en: "Authenticated as: ", pl: "Zalogowano jako: ", ru: "Вы вошли как: " },
  step1: { en: "Step 1: Login required for identification (Discord) and hours verification (Steam).", pl: "Krok 1: Logowanie wymagane do weryfikacji tożsamości (Discord) i godzin w grze (Steam).", ru: "Шаг 1: Требуется авторизация для идентификации (Discord) и проверки часов (Steam)." },
  logInFirst: { en: "Log in first to unlock the form.", pl: "Zaloguj się najpierw, aby odblokować formularz.", ru: "Сначала войдите, чтобы разблокировать форму." },
  loadingForm: { en: "Loading form...", pl: "Ładowanie formularza...", ru: "Загрузка формы..." },
  fillRequired: { en: "Please fill required field: ", pl: "Proszę wypełnić wymagane pole: ", ru: "Пожалуйста, заполните обязательное поле: " },
  successSubmit: { en: "Success! Your application has been sent.", pl: "Sukces! Twoja aplikacja została wysłana.", ru: "Успех! Ваша заявка отправлена." },
  errorOccurred: { en: "An error occurred.", pl: "Wystąpił błąd.", ru: "Произошла ошибка." },
  errorSending: { en: "An error occurred during submission.", pl: "Wystąpił błąd podczas wysyłania.", ru: "Произошла ошибка при отправке." },
  submitApp: { en: "Submit Application", pl: "Wyślij Podanie", ru: "Отправить заявку" },
  submitting: { en: "Submitting...", pl: "Wysyłanie...", ru: "Отправка..." },
  connectDiscord: { en: "Connect with Discord", pl: "Połącz z Discord", ru: "Подключить Discord" },
  connectSteam: { en: "Connect with Steam", pl: "Połącz ze Steam", ru: "Подключить Steam" },
  logOut: { en: "LOG OUT", pl: "WYLOGUJ SIĘ", ru: "ВЫЙТИ" },
  aboutStory: { 
    en: "We are a group of friends who met in Unturned and founded the 777 clan in 2022. Since then, we've been regularly terrorizing the servers we play on.", 
    pl: "Jesteśmy grupką znajomych, którzy poznali się właśnie w Unturned i założyli w 2022 clan 777. Od tego czasu regularnie terroryzujemy serwery, na których gramy.",
    ru: "Мы — группа друзей, которые познакомились в Unturned и основали клан 777 в 2022 году. С тех пор мы регулярно терроризируем серверы, на которых играем." 
  },
  
  builder_materials: { en: "Building Blocks", pl: "Budulec", ru: "Строительные блоки" },
  builder_cost: { en: "Total Cost", pl: "Materiały (Koszt)", ru: "Общая стоимость" },
  builder_empty: { en: "No structures placed.", pl: "Brak postawionych struktur.", ru: "Нет размещенных структур." },
  builder_instructions_title: { en: "Building Instructions:", pl: "Instrukcja Budowania:", ru: "Инструкции по строительству:" },
  builder_instructions_1: { en: "- Select an item from the left. (Press [ESC] to deselect).", pl: "- Wybierz element z listy po lewej. (Wciśnij [ESC] by odznaczyć).", ru: "- Выберите элемент слева. (Нажмите [ESC], чтобы отменить выбор)." },
  builder_instructions_2: { en: "- Hover over a placed object's edge to snap the next one.", pl: "- Najedź na krawędź postawionego obiektu, by \"przykleić\" (Snap) kolejny.", ru: "- Наведите на край размещенного объекта, чтобы привязать (Snap) следующий." },
  builder_instructions_3: { en: "- Press [R] to change edge / rotate element.", pl: "- Wciśnij [R], aby zmienić krawędź / obrócić element.", ru: "- Нажмите [R], чтобы изменить край / повернуть элемент." },
  builder_instructions_4: { en: "- Hold [Right Click] on background to pan camera.", pl: "- Przytrzymaj Prawy Przycisk Myszy (PPM) na tle, by przesuwać kamerę.", ru: "- Удерживайте Правую кнопку мыши (ПКМ) на фоне, чтобы перемещать камеру." },
  builder_instructions_5: { en: "- To delete an object, hold [Left Click] on it for 2 seconds (when no item is selected).", pl: "- Aby usunąć obiekt, przytrzymaj na nim Lewy Przycisk Myszy (LPM) przez 2 sekundy (gdy nie masz wybranego klocka w ręce).", ru: "- Чтобы удалить объект, удерживайте на нем Левую кнопку мыши (ЛКМ) 2 секунды (когда не выбран элемент)." },
  builder_instructions_6: { en: "- Scroll wheel to zoom in/out.", pl: "- Kółko myszy przybliża/oddala widok.", ru: "- Колесико мыши для приближения/отдаления." },
  clear_project_confirm: { en: "Are you sure you want to clear the entire project?", pl: "Czy na pewno chcesz wyczyścić cały projekt?", ru: "Вы уверены, что хотите очистить весь проект?" },
  builder_projects_title: { en: "Base Projects (Planner)", pl: "Projekty Baz (Planner)", ru: "Проекты Баз (Планировщик)" },
  builder_new_project: { en: "New Project", pl: "Nowy Projekt", ru: "Новый проект" },
  builder_join_group: { en: "Join group project", pl: "Dołącz do projektu grupowego", ru: "Присоединиться к групповому проекту" },
  builder_join_desc: { en: "Enter the access code to co-create with friends.", pl: "Wpisz kod dostępu, aby współtworzyć bazę ze znajomymi.", ru: "Введите код доступа, чтобы создавать базу с друзьями." },
  builder_join_placeholder: { en: "Code e.g. ABC123XYZ", pl: "Kod np. ABC123XYZ", ru: "Код напр. ABC123XYZ" },
  builder_join_btn: { en: "Join", pl: "Dołącz", ru: "Присоединиться" },
  builder_your_projects: { en: "Your and shared projects", pl: "Twoje i współdzielone projekty", ru: "Ваши и общие проекты" },
  builder_no_projects: { en: "No projects", pl: "Brak projektów", ru: "Нет проектов" },
  builder_no_projects_desc: { en: "Create a new project to start building.", pl: "Utwórz nowy projekt, aby zacząć budować.", ru: "Создайте новый проект, чтобы начать строительство." },
  builder_updated: { en: "Updated: ", pl: "Zaktualizowano: ", ru: "Обновлено: " },
  builder_code: { en: "Code: ", pl: "Kod: ", ru: "Код: " },
  builder_painting: { en: "PAINTING (COLORING)", pl: "KOLOROWANIE (MALOWANIE)", ru: "РАСКРАСКА (ОКРАШИВАНИЕ)" },
  builder_clear_project: { en: "Clear project", pl: "Wyczyść projekt", ru: "Очистить проект" },
  builder_saving: { en: "Saving...", pl: "Zapisywanie...", ru: "Сохранение..." },
  builder_edit: { en: "(Edit)", pl: "(Edytuj)", ru: "(Изменить)" },
  builder_off: { en: "OFF", pl: "OFF", ru: "ВЫКЛ" },
  prompt_new_name: { en: "Enter project name:", pl: "Podaj nazwę projektu:", ru: "Введите название проекта:" },
  prompt_new_desc: { en: "Enter a short description (optional):", pl: "Podaj krótki opis (opcjonalnie):", ru: "Введите краткое описание (необязательно):" },
  prompt_edit_name: { en: "Change project name:", pl: "Zmień nazwę projektu:", ru: "Изменить название проекта:" },
  prompt_edit_desc: { en: "Change project description:", pl: "Zmień opis projektu:", ru: "Изменить описание проекта:" },
  prompt_join_error: { en: "Failed to join. Check the code.", pl: "Nie udało się dołączyć. Sprawdź kod.", ru: "Не удалось присоединиться. Проверьте код." },
  builder_toggle_beds: { en: "Toggle Bed Areas", pl: "Obszar łóżek", ru: "Зоны кроватей" },
  
  pine_plank: { en: "Pine Plank", pl: "Sosnowa Deska", ru: "Сосновая доска" },
  metal_sheet: { en: "Metal Sheet", pl: "Metalowa Płyta", ru: "Металлический лист" },
  brick: { en: "Brick", pl: "Cegła", ru: "Кирпич" },
  
  w_found: { en: "Pine Foundation", pl: "Sosnowy Fundament", ru: "Сосновый фундамент" },
  w_found_tri: { en: "Pine Tri Foundation", pl: "Sosnowy Trój. Fundament", ru: "Соснов. треуг. фундамент" },
  w_roof: { en: "Pine Roof", pl: "Sosnowy Dach", ru: "Сосновая крыша" },
  w_roof_tri: { en: "Pine Tri Roof", pl: "Sosnowy Trój. Dach", ru: "Соснов. треуг. крыша" },
  w_hole: { en: "Pine Hole", pl: "Sosnowa Dziura", ru: "Сосновое отверстие" },

  m_found: { en: "Metal Foundation", pl: "Metalowy Fundament", ru: "Мет. фундамент" },
  m_found_tri: { en: "Metal Tri Foundation", pl: "Metalowy Trój. Fundament", ru: "Мет. треуг. фундамент" },
  m_roof: { en: "Metal Roof", pl: "Metalowy Dach", ru: "Мет. крыша" },
  m_roof_tri: { en: "Metal Tri Roof", pl: "Metalowy Trój. Dach", ru: "Мет. треуг. крыша" },
  m_hole: { en: "Metal Hole", pl: "Metalowa Dziura", ru: "Мет. отверстие" },

  b_found: { en: "Brick Foundation", pl: "Ceglany Fundament", ru: "Кирпичный фундамент" },
  b_found_tri: { en: "Brick Tri Foundation", pl: "Ceglany Trój. Fundament", ru: "Кирпич. треуг. фундамент" },
  b_roof: { en: "Brick Roof", pl: "Ceglany Dach", ru: "Кирпичная крыша" },
  b_roof_tri: { en: "Brick Tri Roof", pl: "Ceglany Trój. Dach", ru: "Кирпич. треуг. крыша" },
  b_hole: { en: "Brick Hole", pl: "Ceglana Dziura", ru: "Кирпичное отверстие" },
  
  c_roof: { en: "Roof", pl: "Dach", ru: "Крыша" },
  c_roof_tri: { en: "Triangle Roof", pl: "Trójkątny Dach", ru: "Треугольная крыша" },
  f_bed: { en: "Claim Bed", pl: "Łóżko", ru: "Кровать" }
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
    if (savedLang === "en" || savedLang === "pl" || savedLang === "ru") {
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
