// Each subject keeps its own colour, muted so subjects don't compete. The
// palette is fixed at 12 presets; the value stores the colour name.

export const SUBJECT_COLOURS = [
  "Teal", "Sky", "Indigo", "Violet", "Rose", "Amber",
  "Emerald", "Cyan", "Slate", "Fuchsia", "Orange", "Lime"
] as const;

export type SubjectColour = (typeof SUBJECT_COLOURS)[number];

const MUTED: Record<string, string> = {
  Teal: "hsl(184 45% 42%)",
  Sky: "hsl(203 55% 50%)",
  Indigo: "hsl(232 45% 55%)",
  Violet: "hsl(268 40% 55%)",
  Rose: "hsl(342 50% 52%)",
  Amber: "hsl(35 65% 48%)",
  Emerald: "hsl(152 45% 42%)",
  Cyan: "hsl(194 55% 45%)",
  Slate: "hsl(215 22% 48%)",
  Fuchsia: "hsl(292 40% 52%)",
  Orange: "hsl(22 65% 50%)",
  Lime: "hsl(88 40% 42%)"
};

export function colourValue(name: string | undefined): string {
  if (name && MUTED[name]) return MUTED[name] as string;
  return "hsl(184 45% 42%)";
}

export function colourSoft(name: string | undefined): string {
  return `color-mix(in srgb, ${colourValue(name)} 16%, transparent)`;
}
