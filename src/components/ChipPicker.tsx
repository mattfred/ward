"use client";

export function ChipPicker({
  options,
  selected,
  onToggle,
  allowCustom,
  onAddCustom,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  allowCustom?: boolean;
  onAddCustom?: (value: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "0.55rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="chip"
            data-on={selected.includes(option)}
            onClick={() => onToggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {allowCustom && onAddCustom ? (
        <input
          placeholder="Add your own, press Enter"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const value = (e.target as HTMLInputElement).value.trim();
            if (!value) return;
            onAddCustom(value);
            (e.target as HTMLInputElement).value = "";
          }}
        />
      ) : null}
    </div>
  );
}
