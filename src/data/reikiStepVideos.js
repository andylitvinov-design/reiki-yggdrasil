export const reikiStepVideos = {
  "RY-L01-S01": {
    title: "Видео к уровню 1: Здоровье · Интуиция · Защита",
    url: "needs verification",
    sourcePage: "https://psimaster.net/service?shs_term_node_tid_depth=12346",
    sourceStatus: "needs_psimaster_youtube_url_verification"
  },
  "RY-L01-S02": {
    title: "Видео к уровню 2: Очищение · Денежная активация",
    url: "needs verification",
    sourcePage: "https://psimaster.net/service?shs_term_node_tid_depth=12346",
    sourceStatus: "needs_psimaster_youtube_url_verification"
  },
  "RY-L01-S03": {
    title: "Видео к уровню 3: Предопределение · Сила",
    url: "needs verification",
    sourcePage: "https://psimaster.net/service?shs_term_node_tid_depth=12346",
    sourceStatus: "needs_psimaster_youtube_url_verification"
  },
  "RY-L01-S04": {
    title: "Видео к уровню 4: Сверхчувственное видение",
    url: "needs verification",
    sourcePage: "https://psimaster.net/service?shs_term_node_tid_depth=12346",
    sourceStatus: "needs_psimaster_youtube_url_verification"
  },
  "RY-L01-S05": {
    title: "Видео к уровню 5: Уровень мастера",
    url: "needs verification",
    sourcePage: "https://psimaster.net/service?shs_term_node_tid_depth=12346",
    sourceStatus: "needs_psimaster_youtube_url_verification"
  }
};

export function getStepVideo(stepId) {
  return reikiStepVideos[stepId] || null;
}
