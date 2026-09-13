export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatDateId(value: string | null | undefined) {
  if (!value) return "–";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTimeId(value: string | null | undefined) {
  if (!value) return "–";
  return new Date(value).toLocaleString("id-ID");
}

export const levelBadge: Record<string, string> = {
  dasar: "bg-primary-fixed text-primary",
  menengah: "bg-secondary-container text-on-secondary-container",
  lanjut: "bg-tertiary-container text-on-tertiary-container",
};

export const difficultyBadge: Record<string, string> = {
  Mudah: "bg-primary-fixed text-primary",
  Sedang: "bg-secondary-container text-on-secondary-container",
  Sulit: "bg-error-container text-on-error-container",
};
