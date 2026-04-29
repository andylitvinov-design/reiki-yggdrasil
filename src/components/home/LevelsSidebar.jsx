import React from "react";

export function LevelsSidebar({
  programModules,
  expandedModules,
  activeModuleId,
  activeStageOrder,
  onToggleModule,
  onSelectStage
}) {
  return (
    <aside className="leftPiano">
      <div className="panelTitle">Структура программы</div>

      {programModules.map((module) => {
        const isExpanded = expandedModules.has(module.id);

        return (
          <div key={module.id}>
            <button
              className={module.id === programModules[0].id ? "rootLevel" : "closedLevel"}
              onClick={() => onToggleModule(module)}
            >
              <b>{module.index}</b>
              <span>
                <strong>{`Уровень ${module.index}. ${module.name}`}</strong>
                <small>{module.count} ступеней</small>
              </span>
              <em>{isExpanded ? "⌃" : "⌄"}</em>
            </button>

            {isExpanded && (
              <div className="keysList">
                {module.stages.map((stage) => {
                  const selected = activeModuleId === module.id && activeStageOrder === stage.order;

                  return (
                    <button
                      key={`${module.id}-${stage.order}`}
                      className={selected ? "pianoKey selected" : "pianoKey"}
                      onClick={() => onSelectStage(module.id, stage.order)}
                    >
                      <span className="keyStageName">{stage.label || `Ступень ${stage.order}`}</span>
                      <span className="keyStageTitle">{stage.navLabel || stage.title}</span>
                      {selected && <strong className="glowRune">✧</strong>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="sideActions">
        <div className="promoRune">♧</div>
        <p>Путь открыт как публичная схема. Практика и публикации продолжаются через кабинет мастера.</p>
      </div>
    </aside>
  );
}
