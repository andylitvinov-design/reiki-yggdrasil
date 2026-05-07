export const reikiStepVideos = {
  "RY-L01-S01": {
    title: "Видео к уровню 1: Здоровье · Интуиция · Защита",
    primaryUrl: "https://www.youtube.com/watch?v=-pvYoNZ0mCw",
    sourcePage: "https://reiki-yggdrasil.com/rejki-iggdrasil/struktura.html",
    sourceStatus: "source_verified",
    sourceNote: "Структура системы Рейки-Иггдрасиль: видео по 1-ой ступени.",
    videos: [
      {
        title: "1-ая ступень Базового блока Рейки-Иггдрасиль",
        label: "Санкт-Петербург, 2015",
        url: "https://www.youtube.com/watch?v=-pvYoNZ0mCw"
      },
      {
        title: "1-ая ступень Базового блока Рейки-Иггдрасиль",
        label: "Москва, 2016",
        url: "https://www.youtube.com/watch?v=4ptK7Bl6Qis"
      },
      {
        title: "1-ая ступень Базового блока Рейки-Иггдрасиль",
        label: "Санкт-Петербург, 2016",
        url: "https://www.youtube.com/watch?v=cAePALD1HkE"
      }
    ]
  },
  "RY-L01-S02": {
    title: "Видео к уровню 2: Очищение · Денежная активация",
    primaryUrl: "https://youtu.be/_oH1w-zE15A",
    sourcePage: "https://reiki-yggdrasil.com/rejki-iggdrasil/struktura.html",
    sourceStatus: "source_verified",
    sourceNote: "Структура системы Рейки-Иггдрасиль: видео по 2-ой ступени.",
    videos: [
      {
        title: "2-ая ступень Базового блока Рейки-Иггдрасиль",
        label: "Санкт-Петербург, 2015",
        url: "https://youtu.be/_oH1w-zE15A"
      },
      {
        title: "2-ая ступень Базового блока Рейки-Иггдрасиль",
        label: "Москва, 2016",
        url: "https://www.youtube.com/watch?v=UD3zdSAp27o"
      },
      {
        title: "2-ая ступень Базового блока Рейки-Иггдрасиль",
        label: "Санкт-Петербург, 2016",
        url: "https://www.youtube.com/watch?v=tTWkKwbDAK4"
      }
    ]
  },
  "RY-L01-S03": {
    title: "Видео к уровню 3: Предопределение · Сила",
    primaryUrl: "https://youtu.be/FxOE-cEAnP4",
    sourcePage: "https://reiki-yggdrasil.com/rejki-iggdrasil/struktura.html",
    sourceStatus: "source_verified",
    sourceNote: "Структура системы Рейки-Иггдрасиль: видео по 3-ей ступени.",
    videos: [
      {
        title: "3-я ступень Базового блока Рейки-Иггдрасиль",
        label: "Санкт-Петербург, 2015",
        url: "https://youtu.be/FxOE-cEAnP4"
      },
      {
        title: "3-я ступень Базового блока Рейки-Иггдрасиль",
        label: "Москва, 2016",
        url: "https://www.youtube.com/watch?v=W_2Iikp1iug"
      },
      {
        title: "3-я ступень Базового блока Рейки-Иггдрасиль",
        label: "Санкт-Петербург, 2016",
        url: "https://www.youtube.com/watch?v=T99pjfnY7E4"
      }
    ]
  },
  "RY-L01-S04": {
    title: "Видео к уровню 4: Сверхчувственное видение",
    primaryUrl: "https://youtu.be/tHHFU-I6IBU",
    sourcePage: "https://reiki-yggdrasil.com/rejki-iggdrasil/struktura.html",
    sourceStatus: "source_verified",
    sourceNote: "Структура системы Рейки-Иггдрасиль: видео по 4-ой ступени.",
    videos: [
      {
        title: "4-ая ступень Базового блока Рейки-Иггдрасиль",
        label: "Санкт-Петербург, 2015",
        url: "https://youtu.be/tHHFU-I6IBU"
      },
      {
        title: "4-ая ступень Базового блока Рейки-Иггдрасиль",
        label: "Москва, 2016",
        url: "https://www.youtube.com/watch?v=KTdPx0lFa3U"
      },
      {
        title: "4-ая ступень Базового блока Рейки-Иггдрасиль",
        label: "Санкт-Петербург, 2016",
        url: "https://www.youtube.com/watch?v=Qf_I5uBIhV4"
      }
    ]
  },
  "RY-L01-S05": {
    title: "Видео к уровню 5: Уровень мастера",
    primaryUrl: "https://www.youtube.com/watch?v=ZqvaHKqtnNs",
    sourcePage: "https://reiki-yggdrasil.com/rejki-iggdrasil/struktura.html",
    sourceStatus: "source_verified",
    sourceNote: "Структура системы Рейки-Иггдрасиль: видео по 5-ой ступени.",
    videos: [
      {
        title: "5-ая ступень Базового блока Рейки-Иггдрасиль",
        label: "Санкт-Петербург, 2015",
        url: "https://www.youtube.com/watch?v=ZqvaHKqtnNs"
      },
      {
        title: "5-ая ступень Базового блока Рейки-Иггдрасиль",
        label: "Москва, 2016",
        url: "https://www.youtube.com/watch?v=EbyWm_T33NI"
      },
      {
        title: "5-ая ступень Базового блока Рейки-Иггдрасиль",
        label: "Санкт-Петербург, 2016",
        url: "https://www.youtube.com/watch?v=SIpBvbplUDY"
      }
    ]
  }
};

export function getStepVideo(stepId) {
  return reikiStepVideos[stepId] || null;
}
