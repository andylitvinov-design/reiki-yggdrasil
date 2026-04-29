import React from "react";

export function SettingsSourcesCards({ settingsSources }) {
  return (
    <div className="settingsCardGrid">
      {settingsSources.map((source) => (
        <article className={`settingsSourceCard ${source.status !== "ready" ? "disabled" : ""}`} key={source.id}>
          <div className="settingsSourceMeta">
            <span>{source.sourceType}</span>
            <span>{source.level}</span>
          </div>
          <h3>{source.title}</h3>
          <p>{source.summary}</p>
          {source.status === "ready" ? (
            <a href={source.url} rel="noreferrer" target="_blank">
              {source.ctaLabel}
            </a>
          ) : (
            <button disabled type="button">
              Недоступно
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
