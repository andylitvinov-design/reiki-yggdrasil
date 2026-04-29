const fallbackMasters = [
  {
    user_id: "school-mentor-1",
    name: "Школа Иггдрасиль",
    bio: "Публичный проводник по базовым ступеням и практическим маршрутам школы.",
    training_info: "Открытый вводный контур",
    master_level: 5,
    show_contacts: false,
    contacts: ""
  },
  {
    user_id: "school-mentor-2",
    name: "Северная линия",
    bio: "Практики по рунам, мировому древу и настройкам старших модулей.",
    training_info: "Скандинавские мистерии",
    master_level: 4,
    show_contacts: false,
    contacts: ""
  },
  {
    user_id: "school-mentor-3",
    name: "Таро и Сефирот",
    bio: "Проводник по арканам, диагностике и прикладным техникам старших ступеней.",
    training_info: "Таро и Древо Сефирот",
    master_level: 4,
    show_contacts: false,
    contacts: ""
  }
];

export function normalizeMasterPreview(master) {
  return {
    user_id: master.user_id,
    name: master.name || "Без имени",
    bio: master.bio || "Описание пока не добавлено",
    training_info: master.training_info || "—",
    master_level: master.master_level || 1,
    show_contacts: Boolean(master.show_contacts),
    contacts: master.contacts || "",
    avatarLabel: (master.name || "M").slice(0, 1).toUpperCase()
  };
}

export function sortMasterPreviews(masters) {
  return masters
    .slice()
    .map(normalizeMasterPreview)
    .sort((a, b) => (b.master_level || 1) - (a.master_level || 1) || a.name.localeCompare(b.name, "ru"));
}

export function getFallbackMasterPreviews() {
  return fallbackMasters.map(normalizeMasterPreview);
}

export function getLimitedMasterPreviews(masters, limit = 3) {
  return sortMasterPreviews(masters).slice(0, limit);
}
