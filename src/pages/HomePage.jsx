import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { LevelsSidebar } from "../components/home/LevelsSidebar";
import { PracticePanel } from "../components/home/PracticePanel";
import { StageDetails } from "../components/home/StageDetails";
import { buildStagePracticeItems, programModules, tabs } from "../data/homeData";
import { getAudioPlaybackUrl, listPracticeAudio } from "../lib/mediaService";
import { isSupabaseConfigured } from "../lib/supabaseClient";

export function HomePage() {
  const [activeModuleId, setActiveModuleId] = useState(programModules[0].id);
  const [activeStageOrder, setActiveStageOrder] = useState(null);
  const [expandedModules, setExpandedModules] = useState(() => new Set([programModules[0].id]));
  const [activeMainTab, setActiveMainTab] = useState("overview");
  const [audioMeditations, setAudioMeditations] = useState([]);
  const [audioError, setAudioError] = useState("");
  const practiceRef = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    listPracticeAudio(3)
      .then(async (items) => {
        const withPlayback = await Promise.all(
          items.map(async (item) => ({
            ...item,
            playbackUrl: await getAudioPlaybackUrl(item)
          }))
        );
        setAudioMeditations(withPlayback.filter((item) => item.playbackUrl));
      })
      .catch((error) => setAudioError(error.message));
  }, []);

  const currentModule = programModules.find((module) => module.id === activeModuleId) ?? programModules[0];
  const currentStage =
    currentModule.stages.find((stage) => stage.order === activeStageOrder) ?? null;
  const isModuleOverview = currentStage === null;
  const practiceItems = useMemo(
    () => buildStagePracticeItems(currentModule, currentStage),
    [currentModule, currentStage]
  );

  const handleToggleModule = (module) => {
    setExpandedModules((previous) => {
      const next = new Set(previous);
      if (next.has(module.id)) next.delete(module.id);
      else next.add(module.id);
      return next;
    });
    setActiveModuleId(module.id);
    setActiveStageOrder(null);
  };

  const handleSelectStage = (moduleId, stageOrder) => {
    setActiveModuleId(moduleId);
    setActiveStageOrder(stageOrder);
    setExpandedModules((previous) => {
      const next = new Set(previous);
      next.add(moduleId);
      return next;
    });
  };

  const handleStartPractice = () => {
    setActiveMainTab("practice");
    practiceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="appShell">
      <div className="pianoStrings" />
      <AppHeader />

      <main className={`dashboard dashboard-${activeMainTab}`}>
        <LevelsSidebar
          activeModuleId={activeModuleId}
          activeStageOrder={activeStageOrder}
          expandedModules={expandedModules}
          onSelectStage={handleSelectStage}
          onToggleModule={handleToggleModule}
          programModules={programModules}
        />

        <section className="contentPane">
          <div className="mainTabs" aria-label="Основные вкладки сайта">
            {tabs.map(([id, label]) => (
              <button
                className={activeMainTab === id ? "mainTab active" : "mainTab"}
                key={id}
                onClick={() => setActiveMainTab(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {activeMainTab !== "practice" ? (
            <StageDetails
              currentModule={currentModule}
              currentStage={currentStage}
              isModuleOverview={isModuleOverview}
              mode={activeMainTab}
              onSelectStage={handleSelectStage}
              onStartPractice={handleStartPractice}
            />
          ) : (
          <PracticePanel
            audioError={audioError}
            audioMeditations={audioMeditations}
            audioReady={isSupabaseConfigured}
            isModuleOverview={isModuleOverview}
            practiceItems={practiceItems}
            variant="full"
          />
          )}
        </section>

        {activeMainTab === "overview" && (
          <div ref={practiceRef} className="rightPane">
            <PracticePanel
              audioError={audioError}
              audioMeditations={audioMeditations}
              audioReady={isSupabaseConfigured}
              isModuleOverview={isModuleOverview}
              practiceItems={practiceItems}
              variant="compact"
            />
          </div>
        )}

        {activeMainTab !== "overview" && <div ref={practiceRef} className="rightPaneAnchor" aria-hidden="true" />}
      </main>
    </div>
  );
}
