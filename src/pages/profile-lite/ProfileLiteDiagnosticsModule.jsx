import React from "react";

export default function ProfileLiteDiagnosticsModule({ diagnostics, moduleStates }) {
  return (
    <section className="profileLiteModule profileLiteDiagnostics" aria-label="Диагностика">
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
