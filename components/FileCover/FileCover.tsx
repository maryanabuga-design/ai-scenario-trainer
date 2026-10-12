/** Plain square cover for a material without a gradient: the file type in small capitals. */
export function FileCover({ type, size = "md" }: { type: string; size?: "md" | "lg" }) {
  const label =
    type === "Word document"
      ? "DOC"
      : type.startsWith("PDF")
        ? "PDF"
        : type === "Link"
          ? "LINK"
          : type === "Image"
            ? "IMG"
            : type.startsWith("Text")
              ? "TXT"
              : type.slice(0, 4).toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-panel bg-surface-muted type-label text-text-secondary ${
        size === "lg" ? "h-24 w-24" : "h-14 w-14"
      }`}
    >
      {label}
    </span>
  );
}
