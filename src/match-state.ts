export const scoreKeys = ["Camera", "Battery", "Performance", "Display", "Value"] as const;
export type ScoreKey = (typeof scoreKeys)[number];
export type Weights = Record<ScoreKey, number>;

export const weightPresets: Record<string, Weights> = {
  Balanced: { Camera: 1, Battery: 1, Performance: 1, Display: 1, Value: 1 },
  "Camera first": { Camera: 2.4, Battery: 0.8, Performance: 1, Display: 1.2, Value: 0.7 },
  "Long-haul": { Camera: 0.7, Battery: 2.5, Performance: 0.9, Display: 0.9, Value: 1.2 },
  Gaming: { Camera: 0.6, Battery: 1.3, Performance: 2.4, Display: 1.8, Value: 0.8 },
  Value: { Camera: 0.8, Battery: 1.1, Performance: 1, Display: 0.9, Value: 2.7 },
};

export function readPriorities(params: URLSearchParams) {
  const preset = params.get("focus") ?? "Balanced";
  const values = params.get("weights")?.split(",").map(Number);
  if (preset === "Custom" && values?.length === scoreKeys.length && values.every(value => Number.isFinite(value) && value >= 0.5 && value <= 3)) {
    return { preset, weights: Object.fromEntries(scoreKeys.map((key, index) => [key, values[index]])) as Weights };
  }
  return Object.hasOwn(weightPresets, preset)
    ? { preset, weights: weightPresets[preset] }
    : { preset: "Balanced", weights: weightPresets.Balanced };
}

export function matchupUrl(href: string, state: {
  left: { id: string; liveSlug?: string }; right: { id: string; liveSlug?: string };
  preset: string; weights: Weights; currency: string; region: string;
}) {
  const url = new URL(href);
  url.searchParams.set("a", state.left.id);
  url.searchParams.set("b", state.right.id);
  url.searchParams.set("focus", state.preset);
  url.searchParams.set("currency", state.currency);
  url.searchParams.set("region", state.region);
  for (const [key, device] of [["aSlug", state.left], ["bSlug", state.right]] as const) {
    if (device.liveSlug) url.searchParams.set(key, device.liveSlug);
    else url.searchParams.delete(key);
  }
  if (state.preset === "Custom") url.searchParams.set("weights", scoreKeys.map(key => state.weights[key]).join(","));
  else url.searchParams.delete("weights");
  return url;
}

export function comparisonStatus(left: { id: string; category?: string; source?: string }, right: { id: string; category?: string; source?: string }, gap: number) {
  if (left.id === right.id) return "same";
  if ((left.category ?? "Phone") !== (right.category ?? "Phone")) return "mixed";
  if (left.source === "live" || right.source === "live") return "unscored";
  return gap < 0.3 ? "close" : "ranked";
}
