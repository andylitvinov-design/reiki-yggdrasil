import React from "react";

export default function ProfileLiteDiagnosticsModule({ diagnostics, moduleStates, shellChrome }) {
  return (
    <section className="profileLiteModule profileLiteDiagnostics mandalaWorkspace" aria-label="Диагностика">
      <div className="mandalaHero">
        <div className="mandalaHeroSeal">⌁</div>
        <div>
          <p className="cabinetEyebrow">Диагностика</p>
          <h2>Safe debug</h2>
          <p>Показывает только безопасные статусы модулей без env values, токенов и приватных серверных ключей.</p>
        </div>
        <div className="mandalaHeroStats">
          <span><b>{diagnostics.length}</b> Checks</span>
          <span><b>{Object.keys(moduleStates).length}</b> Modules</span>
          <span><b>safe</b> Debug</span>
        </div>
      </div>
      {shellChrome}
      <div className="cabinetCard profileLiteDebug">
        <p className="cabinetEyebrow">Диагностика</p>
        <h2>Safe debug</h2>
        <dl>
          {diagnostics.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="cabinetCard profileLiteDebug">
        <p className="cabinetEyebrow">Модули</p>
        <h2>Inline status</h2>
        <dl>
          {Object.entries(moduleStates).map(([key, state]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{state.status}{state.error ? ` · needs verification: ${state.error}` : ""}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
