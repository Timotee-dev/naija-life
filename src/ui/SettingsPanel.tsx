import { useGame } from "../game/store";

function Choice<T extends string | number | boolean>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="setting">
      <span>{label}</span>
      <div className="seg">
        {options.map(([v, l]) => (
          <button key={String(v)} className={v === value ? "on" : ""} onClick={() => onChange(v)}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const s = useGame((st) => st.settings);
  const update = useGame((st) => st.updateSettings);
  return (
    <div className="settings">
      <h2 className="h2">Settings</h2>
      <Choice label="Graphics" value={s.quality} options={[["high", "High"], ["low", "Low (faster)"]]} onChange={(quality) => update({ quality })} />
      <Choice label="Shadows" value={s.shadows} options={[[true, "On"], [false, "Off"]]} onChange={(shadows) => update({ shadows })} />
      <Choice label="Time speed" value={s.timeSpeed} options={[[0.5, "Relaxed"], [1, "Normal"], [2, "Fast"]]} onChange={(timeSpeed) => update({ timeSpeed })} />
      <Choice label="Touch controls" value={s.touch} options={[["auto", "Auto"], ["on", "Always"], ["off", "Off"]]} onChange={(touch) => update({ touch })} />
      <p className="muted small">Normal speed: one game day lasts about 24 real minutes. Time stops while a menu or shop is open.</p>
    </div>
  );
}
