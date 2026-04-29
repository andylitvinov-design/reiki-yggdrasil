import React, { createContext, useContext, useMemo, useState } from "react";

const dictionaries = {
  ru: {
    lang: "RU",
    profile: "Кабинет мастера",
    masters: "Мастера",
    signIn: "Войти",
    signOut: "Выйти",
    email: "Email",
    password: "Пароль",
    name: "Имя",
    save: "Сохранить",
    level: "Уровень",
    admin: "Админ"
  },
  en: {
    lang: "EN",
    profile: "Master Cabinet",
    masters: "Masters",
    signIn: "Sign in",
    signOut: "Sign out",
    email: "Email",
    password: "Password",
    name: "Name",
    save: "Save",
    level: "Level",
    admin: "Admin"
  }
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState("ru");
  const value = useMemo(() => {
    const t = (key) => dictionaries[locale][key] || dictionaries.en[key] || key;
    return { locale, setLocale, t, dictionaries };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
