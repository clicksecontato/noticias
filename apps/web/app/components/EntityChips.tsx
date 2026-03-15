export interface EntityChipsProps {
  gameNames?: string[];
  tagNames?: string[];
  genreNames?: string[];
  platformNames?: string[];
  className?: string;
}

export function EntityChips({
  gameNames,
  tagNames,
  genreNames,
  platformNames,
  className = ""
}: EntityChipsProps) {
  const all = [
    ...(gameNames ?? []),
    ...(tagNames ?? []),
    ...(genreNames ?? []),
    ...(platformNames ?? [])
  ];
  if (all.length === 0) return null;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        marginTop: "0.5rem"
      }}
      aria-label="Jogos, tags, gêneros e plataformas"
    >
      {all.map((name) => (
        <span
          key={name}
          className="chip"
          style={{
            fontSize: "0.75rem",
            padding: "2px 8px",
            background: "var(--chip-bg, #334155)",
            color: "var(--chip-color, #e2e8f0)",
            borderRadius: 6
          }}
        >
          {name}
        </span>
      ))}
    </div>
  );
}
