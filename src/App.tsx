"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { requestDevices } from "./live-devices";
import { devices, getSpecGroups, type Device } from "./devices";
import { scoreKeys, weightPresets, readPriorities, matchupUrl, comparisonStatus, type ScoreKey, type Weights } from "./match-state";

type LiveSummary = { slug: string; brand: string; name: string; image: string; detail: string; source?: string; catalogueId?: string; category?: "Phone" | "Laptop" };
type LiveState = "idle" | "searching" | "ready" | "offline";
type SearchScope = "Smart" | "Catalogue" | "Live web";
type DeviceKind = "All devices" | "Phones" | "Laptops";
type Currency = "USD" | "AED";
type Region = "UAE" | "International";
type PlatformChoice = "Any" | Device["os"];
type LibraryView = "Detailed" | "Compact";

const deviceName = (device: Device) => device.name.toLowerCase().startsWith(device.brand.toLowerCase()) ? device.name : `${device.brand} ${device.name}`;
const validImport = (value: unknown): value is Device => {
  if (!value || typeof value !== "object") return false;
  const device = value as Device;
  return device.source === "live" && typeof device.id === "string" && device.id.startsWith("live-")
    && typeof device.liveSlug === "string" && typeof device.brand === "string" && typeof device.name === "string"
    && ["Phone", "Laptop"].includes(device.category ?? "") && ["Android", "iOS", "Windows", "macOS", "ChromeOS", "Linux"].includes(device.os)
    && [device.display, device.chip, device.ram, device.storage, device.cameras, device.battery, device.charging, device.weight, device.durability, device.highlight].every(value => typeof value === "string")
    && Number.isFinite(device.year) && Number.isFinite(device.price) && Boolean(device.scores && typeof device.scores === "object");
};

const specRows: [string, keyof Device][] = [
  ["Platform", "os"], ["Display", "display"], ["Processor", "chip"], ["Memory", "ram"],
  ["Storage", "storage"], ["Camera system", "cameras"], ["Battery", "battery"],
  ["Charging", "charging"], ["Weight", "weight"], ["Protection", "durability"], ["Launch price", "price"],
];

const weightedAverage = (device: Device, weights: Weights) => {
  const totalWeight = scoreKeys.reduce((sum, key) => sum + weights[key], 0);
  return scoreKeys.reduce((sum, key) => sum + (device.scores[key] ?? 0) * weights[key], 0) / totalWeight;
};

const strongestTraits = (device: Device) => scoreKeys
  .map(key => ({ key, score: device.scores[key] ?? 0 }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 2)
  .map(item => metricLabel(item.key, device).toLowerCase());

const parseWeight = (value: string) => Math.max(0.5, Math.min(3, Number(value)));
const deviceCategory = (device: Device) => device.category ?? "Phone";
const metricLabel = (key: ScoreKey, device: Device) => key === "Camera" && deviceCategory(device) === "Laptop" ? "Graphics" : key;

const analyseDevice = (device: Device) => {
  const laptop = deviceCategory(device) === "Laptop";
  const ranked = scoreKeys.map(key => ({ key, score: device.scores[key] ?? 0 })).sort((a, b) => b.score - a.score);
  const strengths = ranked.slice(0, 2).map(item => metricLabel(item.key, device).toLowerCase());
  const watchouts: string[] = [];
  if (/\b8\s*gb\b/i.test(device.ram)) watchouts.push("8GB memory may limit heavier multitasking");
  if (/\b128\s*gb\b/i.test(device.storage)) watchouts.push("128GB storage can fill quickly");
  if (laptop && /integrated/i.test(device.details?.graphics ?? "") && device.scores.Camera < 8.5) watchouts.push("integrated graphics are not intended for demanding 3D work");
  if (!laptop && !/120|144|165|185|ProMotion/i.test(device.display)) watchouts.push("display refresh rate is below current high-refresh flagships");
  if (device.price >= 1500) watchouts.push("premium pricing needs a clear workload justification");
  const bestFor = laptop
    ? device.scores.Camera >= 9.3 ? "gaming, 3D, video and GPU-accelerated creation" : device.scores.Battery >= 9.1 ? "mobile work, study and all-day productivity" : "general productivity and professional workflows"
    : device.scores.Camera >= 9.4 ? "photography, video and flagship imaging" : device.scores.Battery >= 9.3 ? "long days, travel and heavy mobile use" : "balanced everyday use";
  return { strengths, watchouts: watchouts.slice(0, 2), bestFor };
};

const analyseSpecificationText = (value: string, kind: "Phone" | "Laptop") => {
  const text = value.trim();
  if (text.length < 20) return null;
  const strengths: string[] = [];
  const watchouts: string[] = [];
  const detected: string[] = [];
  const ram = text.match(/\b(\d{1,3})\s*GB\s*(?:LPDDR\w*|DDR\w*|RAM|memory)/i)?.[1];
  const storage = text.match(/\b(\d+(?:\.\d+)?)\s*(TB|GB)\s*(?:SSD|NVMe|UFS|storage)/i);
  const refresh = text.match(/\b(\d{2,3})\s*Hz\b/i)?.[1];
  const battery = text.match(/\b(\d{2,5})\s*(mAh|Wh)\b/i);
  const chip = text.match(/(?:Apple\s+M\d(?:\s+(?:Pro|Max))?|Snapdragon\s+[\w+ -]+|Intel\s+Core\s+Ultra\s+\w+|AMD\s+Ryzen\s+[\w ]+|Dimensity\s+\d+)/i)?.[0];
  const gpu = text.match(/(?:RTX\s*\d{4}|Radeon\s+\w+|Intel\s+Arc\s*\w*|Apple\s+\d+-core\s+GPU)/i)?.[0];
  if (chip) { detected.push(chip); strengths.push("processor platform identified"); }
  if (ram) {
    detected.push(`${ram}GB memory`);
    if (Number(ram) >= (kind === "Laptop" ? 32 : 12)) strengths.push("strong multitasking memory");
    else if (Number(ram) <= 8) watchouts.push("memory may be tight for demanding multitasking");
  } else watchouts.push("memory capacity was not detected");
  if (storage) detected.push(`${storage[1]}${storage[2].toUpperCase()} storage`);
  else watchouts.push("storage capacity was not detected");
  if (refresh) {
    detected.push(`${refresh}Hz display`);
    if (Number(refresh) >= 120) strengths.push("smooth high-refresh display");
  }
  if (battery) detected.push(`${battery[1]}${battery[2]} battery`);
  if (gpu) { detected.push(gpu); strengths.push("named graphics identified; check its workload suitability"); }
  if (!battery) watchouts.push("battery capacity or endurance was not detected");
  return { strengths: Array.from(new Set(strengths)).slice(0, 3), watchouts: Array.from(new Set(watchouts)).slice(0, 3), detected: detected.slice(0, 6) };
};

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const profileSheet = useRef<HTMLElement>(null);
  const [leftId, setLeftId] = useState("s26u");
  const [rightId, setRightId] = useState("i17pm");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | Device["os"]>("All");
  const [categoryFilter, setCategoryFilter] = useState<DeviceKind>("All devices");
  const [brandFilter, setBrandFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [maxPrice, setMaxPrice] = useState(2200);
  const [sort, setSort] = useState("score");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [liveQuery, setLiveQuery] = useState("");
  const [liveResults, setLiveResults] = useState<LiveSummary[]>([]);
  const [liveDevices, setLiveDevices] = useState<Device[]>([]);
  const [liveState, setLiveState] = useState<LiveState>("idle");
  const [liveMessage, setLiveMessage] = useState("Search a model to collect current specifications.");
  const [liveSource, setLiveSource] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("Smart");
  const [searchKind, setSearchKind] = useState<DeviceKind>("All devices");
  const [manualKind, setManualKind] = useState<"Phone" | "Laptop">("Laptop");
  const [manualSpecs, setManualSpecs] = useState("");
  const [collectedAt, setCollectedAt] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [liveRefresh, setLiveRefresh] = useState(0);
  const [preset, setPreset] = useState("Balanced");
  const [weights, setWeights] = useState<Weights>(weightPresets.Balanced);
  const [matchBudget, setMatchBudget] = useState(1200);
  const [matchOs, setMatchOs] = useState<PlatformChoice>("Any");
  const [matchKind, setMatchKind] = useState<DeviceKind>("Phones");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [region, setRegion] = useState<Region>("UAE");
  const [shareMessage, setShareMessage] = useState("Share matchup");
  const [libraryView, setLibraryView] = useState<LibraryView>("Compact");
  const [visibleCount, setVisibleCount] = useState(12);

  const catalogue = useMemo(() => [...devices, ...liveDevices], [liveDevices]);
  const left = catalogue.find(device => device.id === leftId) ?? devices[0];
  const right = catalogue.find(device => device.id === rightId) ?? devices[1];
  const profile = profileId ? catalogue.find(device => device.id === profileId) ?? null : null;
  const brands = useMemo(() => ["All", ...Array.from(new Set(catalogue.map(device => device.brand))).sort()], [catalogue]);
  const years = useMemo(() => ["All", ...Array.from(new Set(catalogue.filter(device => device.year > 0).map(device => String(device.year)))).sort().reverse()], [catalogue]);
  const catalogueStats = useMemo(() => {
    const phoneCount = catalogue.filter(device => deviceCategory(device) === "Phone").length;
    const laptopCount = catalogue.length - phoneCount;
    const platforms = new Set(catalogue.map(device => device.os)).size;
    const specPoints = catalogue.reduce((total, device) => total + getSpecGroups(device).reduce((count, group) => count + group.rows.length, 0), 0);
    const knownYears = catalogue.map(device => device.year).filter(year => year > 0);
    const yearsCovered = knownYears.length ? Math.max(...knownYears) - Math.min(...knownYears) + 1 : 0;
    return { phoneCount, laptopCount, platforms, specPoints, yearsCovered };
  }, [catalogue]);

  const priceLabel = (device: Device) => {
    if (device.price <= 0) return "Check local price";
    if (currency === "AED") return `AED ${Math.round(device.price * 3.6725).toLocaleString()}`;
    return `$${device.price.toLocaleString()}`;
  };
  const budgetLabel = (value: number) => currency === "AED" ? `AED ${Math.round(value * 3.6725).toLocaleString()}` : `$${value.toLocaleString()}`;
  const platforms = Array.from(new Set(catalogue.filter(device => matchKind === "All devices" || deviceCategory(device) === matchKind.slice(0, -1)).map(device => device.os)));

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const result = catalogue.filter(device =>
      (filter === "All" || device.os === filter)
      && (categoryFilter === "All devices" || deviceCategory(device) === categoryFilter.slice(0, -1))
      && (brandFilter === "All" || device.brand === brandFilter)
      && (yearFilter === "All" || String(device.year) === yearFilter)
      && (device.price === 0 || device.price <= maxPrice)
      && (!search || `${device.brand} ${device.name} ${device.chip} ${device.cameras} ${device.details?.graphics ?? ""}`.toLowerCase().includes(search))
    );

    return result.sort((a, b) => {
      if (sort === "price-low") return (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER);
      if (sort === "newest") return b.year - a.year || weightedAverage(b, weights) - weightedAverage(a, weights);
      if (sort === "camera") return (b.scores.Camera ?? 0) - (a.scores.Camera ?? 0);
      if (sort === "battery") return (b.scores.Battery ?? 0) - (a.scores.Battery ?? 0);
      if (sort === "performance") return (b.scores.Performance ?? 0) - (a.scores.Performance ?? 0);
      if (sort === "value") return (b.scores.Value ?? 0) - (a.scores.Value ?? 0);
      return weightedAverage(b, weights) - weightedAverage(a, weights);
    });
  }, [catalogue, filter, categoryFilter, brandFilter, yearFilter, maxPrice, query, sort, weights]);

  const smartMatches = useMemo(() => devices
    .filter(device =>
      (matchKind === "All devices" || deviceCategory(device) === matchKind.slice(0, -1))
      && (matchOs === "Any" || device.os === matchOs)
      && device.price > 0 && device.price <= matchBudget
    )
    .sort((a, b) => weightedAverage(b, weights) - weightedAverage(a, weights) || b.year - a.year)
    .slice(0, 3), [matchBudget, matchOs, matchKind, weights]);

  const savedDevices = useMemo(() => favorites
    .map(id => catalogue.find(device => device.id === id))
    .filter((device): device is Device => Boolean(device)), [catalogue, favorites]);

  const scopedLiveResults = useMemo(() => liveResults.filter(result => {
    if (searchScope === "Catalogue") return Boolean(result.catalogueId) || result.source === "Catalogue";
    if (searchScope === "Live web") return !result.catalogueId && result.source !== "Catalogue";
    return true;
  }), [liveResults, searchScope]);
  const manualAnalysis = useMemo(() => analyseSpecificationText(manualSpecs, manualKind), [manualSpecs, manualKind]);
  const profileAnalysis = profile ? analyseDevice(profile) : null;
  const quickSearches = searchKind === "Laptops"
    ? ["MacBook Air M4", "Surface Laptop 7", "ThinkPad X1 Carbon", "ROG Zephyrus G14", "Framework Laptop 13"]
    : searchKind === "Phones"
      ? ["Galaxy S25 Ultra", "iPhone 15 Pro", "Pixel 9 Pro", "OnePlus 13", "Xiaomi 15"]
      : ["MacBook Air M4", "Galaxy S25 Ultra", "Surface Laptop 7", "iPhone 15 Pro", "ROG Zephyrus G14"];

  const leftWeighted = weightedAverage(left, weights);
  const rightWeighted = weightedAverage(right, weights);
  const scoreGap = Math.abs(leftWeighted - rightWeighted);
  const status = comparisonStatus(left, right, scoreGap);
  const canScore = status === "ranked" || status === "close";
  const winner = status === "ranked" ? (leftWeighted > rightWeighted ? left : right) : null;
  const resultTitle = status === "same" ? "Same device selected" : status === "mixed" ? "Different device types" : status === "unscored" ? "Specifications only" : status === "close" ? "Too close to call" : `${winner!.name} leads`;
  const resultDetail = status === "same" ? "Choose a different model for device B." : status === "mixed" ? "Phone cameras and laptop graphics cannot share a ranking." : status === "unscored" ? "Web imports have no reviewed scores or confirmed prices." : status === "close" ? `${scoreGap.toFixed(1)} points apart · price and ecosystem can break the tie.` : `${scoreGap.toFixed(1)} points apart · based on your priorities.`;
  const winnerCount = scoreKeys.reduce((count, key) => count + ((left.scores[key] ?? 0) > (right.scores[key] ?? 0) ? 1 : 0), 0);
  const rightWinnerCount = scoreKeys.reduce((count, key) => count + ((right.scores[key] ?? 0) > (left.scores[key] ?? 0) ? 1 : 0), 0);
  const priceDifference = left.price > 0 && right.price > 0 ? Math.abs(left.price - right.price) : null;
  const decisiveMetrics = scoreKeys
    .map(key => ({ key, impact: Math.abs((left.scores[key] ?? 0) - (right.scores[key] ?? 0)) * weights[key] }))
    .sort((a, b) => b.impact - a.impact)
    .filter(item => item.impact > 0)
    .slice(0, 2)
    .map(item => metricLabel(item.key, winner ?? left).toLowerCase());
  const bothLaptops = deviceCategory(left) === "Laptop" && deviceCategory(right) === "Laptop";
  const comparisonRows: Array<[string, string, string]> = bothLaptops ? [
    ["Platform", left.os, right.os],
    ["Display", left.display, right.display],
    ["Processor", left.chip, right.chip],
    ["Graphics", left.details?.graphics ?? "See full profile", right.details?.graphics ?? "See full profile"],
    ["Memory", left.ram, right.ram],
    ["Storage", left.storage, right.storage],
    ["Webcam", left.cameras, right.cameras],
    ["Battery", left.battery, right.battery],
    ["Power", left.charging, right.charging],
    ["Weight", left.weight, right.weight],
    ["Construction", left.durability, right.durability],
    [`Reference price (${currency})`, priceLabel(left), priceLabel(right)],
  ] : specRows.map(([label, key]) => [key === "price" ? `Reference price (${currency})` : label === "Camera system" && status === "mixed" ? "Camera / webcam" : label, key === "price" ? priceLabel(left) : String(left[key]), key === "price" ? priceLabel(right) : String(right[key])]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(window.location.search);
    const frame = window.requestAnimationFrame(async () => {
      let imports: Device[] = [];
      try {
        const stored = JSON.parse(window.localStorage.getItem("device-match-saved") ?? "[]") as unknown;
        if (Array.isArray(stored)) setFavorites(stored.filter(item => typeof item === "string"));
        const storedImports: unknown = JSON.parse(window.localStorage.getItem("device-match-imports") ?? "[]");
        if (Array.isArray(storedImports)) imports = storedImports.filter(validImport).map(device => ({ ...device, scores: {} }));
      } catch { /* Ignore malformed local data. */ }
      const restored = await Promise.all(["a", "b"].map(async key => {
        const id = params.get(key);
        if (!id?.startsWith("live-") || imports.some(device => device.id === id)) return null;
        const slug = params.get(`${key}Slug`) ?? id.slice(5);
        if (!slug || slug.length > 300) return null;
        try {
          const response = await requestDevices(new URLSearchParams({ slug }), controller.signal);
          const payload = await response.json() as { device?: unknown };
          return response.ok && validImport(payload.device) && payload.device.id === id ? payload.device as Device : null;
        } catch { return null; }
      }));
      if (controller.signal.aborted) return;
      imports = Array.from(new Map([...imports, ...restored.filter((device): device is Device => Boolean(device))].map(device => [device.id, device])).values());
      setLiveDevices(imports);
      for (const [key, setter] of [["a", setLeftId], ["b", setRightId]] as const) {
        const id = params.get(key);
        if (id && [...devices, ...imports].some(device => device.id === id)) setter(id);
        else if (id) setSaveMessage("A shared device could not be restored. Choose a model from the catalogue.");
      }
      const priorities = readPriorities(params);
      setPreset(priorities.preset);
      setWeights(priorities.weights);
      if (params.get("currency") === "AED") setCurrency("AED");
      if (params.get("region") === "International") setRegion("International");
      setHydrated(true);
    });
    return () => { controller.abort(); window.cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const url = matchupUrl(window.location.href, { left, right, preset, weights, currency, region });
    window.history.replaceState({}, "", url);
  }, [hydrated, left, right, preset, weights, currency, region]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("device-match-saved", JSON.stringify(favorites));
      window.localStorage.setItem("device-match-imports", JSON.stringify(liveDevices));
    } catch { setSaveMessage("Saved for this visit. Browser storage is unavailable for the next visit."); }
  }, [hydrated, favorites, liveDevices]);

  useEffect(() => { setVisibleCount(12); }, [query, filter, categoryFilter, brandFilter, yearFilter, maxPrice, sort]);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = window.setTimeout(() => setSaveMessage(""), 6000);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  useEffect(() => {
    if (!profileId) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const sheet = profileSheet.current;
    const focusable = () => Array.from(sheet?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], select, input, textarea, [tabindex="0"]') ?? []);
    focusable()[0]?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileId(null);
      if (event.key === "Tab") {
        const elements = focusable();
        const first = elements[0]; const last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [profileId]);

  useEffect(() => {
    const search = liveQuery.trim();
    if (search.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLiveState("searching");
      setLiveMessage("Collecting current device records…");
      try {
        const category = searchKind === "Phones" ? "phone" : searchKind === "Laptops" ? "laptop" : "all";
        const response = await requestDevices(new URLSearchParams({ q: search, category }), controller.signal);
        const payload = await response.json() as { ok: boolean; results?: LiveSummary[]; collectedAt?: string; source?: string; warning?: string; error?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Live source unavailable");
        setLiveResults(payload.results ?? []);
        setCollectedAt(payload.collectedAt ?? new Date().toISOString());
        setLiveSource(payload.source ?? "");
        setLiveState("ready");
        setLiveMessage(payload.results?.length
          ? `${payload.results.length} ranked match${payload.results.length === 1 ? "" : "es"} found${payload.warning ? "; one source was unavailable" : ""}.`
          : "No exact record matched. Try the brand and model without storage, colour or region terms.");
      } catch (error) {
        if (controller.signal.aborted) return;
        setLiveState("offline");
        setLiveResults([]);
        setLiveSource("");
        setLiveMessage(error instanceof Error ? error.message : "Live source unavailable. Curated data remains online.");
      }
    }, 450);

    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [liveQuery, liveRefresh, searchKind]);

  const importLiveDevice = async (result: LiveSummary) => {
    if (result.catalogueId) {
      setRightId(result.catalogueId);
      setProfileId(result.catalogueId);
      setLiveMessage(`${result.brand} ${result.name} opened from the curated catalogue.`);
      return;
    }

    const existing = liveDevices.find(device => device.liveSlug === result.slug);
    if (existing) {
      setRightId(existing.id);
      setProfileId(existing.id);
      return;
    }

    setImporting(result.slug);
    try {
      const response = await requestDevices(new URLSearchParams({ slug: result.slug }));
      const payload = await response.json() as { ok: boolean; device?: Device; collectedAt?: string; error?: string };
      if (!response.ok || !payload.ok || !validImport(payload.device)) throw new Error(payload.error || "Could not collect specifications.");
      setLiveDevices(current => [...current.filter(device => device.id !== payload.device!.id), { ...payload.device!, scores: {} }]);
      setRightId(payload.device.id);
      setProfileId(payload.device.id);
      setCollectedAt(payload.collectedAt ?? new Date().toISOString());
      setLiveMessage(`${payload.device.brand} ${payload.device.name} is ready to compare.`);
    } catch (error) {
      setLiveState("offline");
      setLiveMessage(error instanceof Error ? error.message : "Could not collect specifications.");
    } finally {
      setImporting(null);
    }
  };

  const scrollToCompare = () => document.getElementById("compare")?.scrollIntoView({ behavior: "smooth" });
  const updateLiveQuery = (value: string) => {
    setLiveQuery(value);
    if (value.trim().length < 2) {
      setLiveState("idle");
      setLiveResults([]);
      setLiveSource("");
      setLiveMessage("Search a model to collect current specifications.");
    }
  };
  const chooseForComparison = (device: Device) => {
    if (device.id !== leftId && device.id !== rightId) {
      setRightId(device.id);
      if (deviceCategory(left) !== deviceCategory(device)) {
        const alternative = devices.find(item => deviceCategory(item) === deviceCategory(device) && item.id !== device.id);
        if (alternative) setLeftId(alternative.id);
      }
    }
    scrollToCompare();
  };
  const applyPreset = (name: string) => {
    setPreset(name);
    setWeights(weightPresets[name]);
  };
  const updateWeight = (key: ScoreKey, value: string) => {
    setPreset("Custom");
    setWeights(current => ({ ...current, [key]: parseWeight(value) }));
  };
  const toggleFavorite = (id: string) => {
    setSaveMessage(favorites.includes(id) ? "Device removed from your shortlist." : "Device added to your shortlist.");
    setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };
  const shareComparison = async () => {
    try {
      const url = matchupUrl(window.location.href, { left, right, preset, weights, currency, region });
      url.hash = "compare";
      await navigator.clipboard.writeText(url.href);
      setShareMessage("Link copied ✓");
      window.setTimeout(() => setShareMessage("Share matchup"), 1800);
    } catch {
      setShareMessage("Copy from the address bar");
    }
  };
  const resetLibrary = () => { setQuery(""); setFilter("All"); setCategoryFilter("All devices"); setBrandFilter("All"); setYearFilter("All"); setMaxPrice(2200); setSort("score"); };
  const deviceOptions = <>{(["Phone", "Laptop"] as const).map(kind => <optgroup key={kind} label={`${kind}s`}>{catalogue.filter(device => deviceCategory(device) === kind).map(device => <option key={device.id} value={device.id}>{device.source === "live" ? "Web import · " : ""}{deviceName(device)}</option>)}</optgroup>)}</>;

  return <main>
    <a className="skip-link" href="#match">Skip to Smart Match</a>
    <nav className="nav" aria-label="Primary navigation">
      <a className="brand" href="#top" aria-label="Device Match home">DEVICE<span>{"//"}</span>MATCH</a>
      <div className="navlinks"><a href="#match">Smart match</a><a href="#compare">Compare</a><a href="#finder">Explore</a><a href="#live">Analyze</a><a href="#saved">Saved <b>{savedDevices.length}</b></a></div>
    </nav>

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow">PHONE + LAPTOP ANALYZER</p>
        <h1>CHOOSE WITH<br/>CLARITY.</h1>
        <div className="coral-line" />
        <p className="lede">Find the phone or laptop that fits your budget, priorities and everyday use.</p>
        <div className="hero-actions"><a className="cta" href="#match">Find my best fit</a><a className="text-cta" href="#live">Analyze a model</a></div>
        <div className="trust-row" aria-label="About the rankings"><span>No sponsored rankings</span><span>{devices.length} devices</span><span>Adjustable priorities</span></div>
      </div>
      <div className="quick-match">
        <div className="quick-match-heading"><div><p className="section-kicker">QUICK COMPARISON</p><h2>Your current matchup</h2></div><img src="./hero-devices-v2.png" alt="" width="90" height="75" /></div>
        <label>Device A<select aria-label="Quick comparison device A" value={left.id} onChange={event => setLeftId(event.target.value)}>{deviceOptions}</select></label>
        <label>Device B<select aria-label="Quick comparison device B" value={right.id} onChange={event => setRightId(event.target.value)}>{deviceOptions}</select></label>
        <div className="quick-verdict" aria-live="polite"><strong>{resultTitle}</strong><span>{resultDetail}</span></div>
        <button className="quick-details" onClick={scrollToCompare}>View full comparison</button>
      </div>
    </section>

    <section className="match-lab" id="match">
      <div className="match-heading">
        <div><p className="section-kicker">SMART MATCH</p><h2>What matters<br/>to you?</h2></div>
        <p>Set your budget and priorities. See the strongest fits from the catalogue, then compare the details.</p>
      </div>
      <div className="match-layout">
        <div className="preference-panel">
          <div className="preset-head"><h3>What matters most?</h3><span>{preset}</span></div>
          <div className="preset-grid">{Object.keys(weightPresets).map(name => <button key={name} className={preset === name ? "active" : ""} aria-pressed={preset === name} onClick={() => applyPreset(name)}>{name === "Camera first" && matchKind === "Laptops" ? "Graphics first" : name}</button>)}</div>
          <div className="weight-list">{scoreKeys.map(key => <label key={key}><span>{key === "Camera" && matchKind === "Laptops" ? "Graphics" : key}<b>{weights[key].toFixed(1)}×</b></span><input aria-label={`${key === "Camera" && matchKind === "Laptops" ? "Graphics" : key} importance`} type="range" min="0.5" max="3" step="0.1" value={weights[key]} onChange={event => updateWeight(key, event.target.value)} /></label>)}</div>
          <div className="match-filters">
            <label>DEVICE TYPE<select value={matchKind} onChange={event => { setMatchKind(event.target.value as DeviceKind); setMatchOs("Any"); }}><option>Phones</option><option>Laptops</option><option>All devices</option></select></label>
            <label>PLATFORM<select value={matchOs} onChange={event => setMatchOs(event.target.value as PlatformChoice)}><option>Any</option>{platforms.map(platform => <option key={platform}>{platform}</option>)}</select></label>
            <label className="price-control"><span>MAX BUDGET <b>{budgetLabel(matchBudget)}</b></span><input aria-label="Smart Match budget" type="range" min="300" max="2200" step="100" value={matchBudget} onChange={event => setMatchBudget(Number(event.target.value))} /></label>
          </div>
        </div>
        <div className="match-results">
          <div className="results-head"><div><small>SMART MATCH · STEP 2 OF 2</small><h3>Your strongest fits</h3></div><span>Based on {preset.toLowerCase()} priorities</span></div>
          {smartMatches.length ? smartMatches.map((device, index) => <article className="match-card" key={device.id}>
            <div className="match-rank">0{index + 1}</div>
            <div className="match-copy"><small>{device.brand} · {device.os} · {device.year}</small><h4>{device.name}</h4><p>{priceLabel(device)} · strongest in {strongestTraits(device).join(" and ")}.</p></div>
            <div className="match-score"><strong>{Math.round(weightedAverage(device, weights) * 10)}%</strong><span>match</span></div>
            <div className="match-actions"><button className={favorites.includes(device.id) ? "saved" : ""} onClick={() => toggleFavorite(device.id)}>{favorites.includes(device.id) ? "Saved ✓" : "+ Save"}</button><button onClick={() => chooseForComparison(device)}>Compare</button></div>
          </article>) : <p className="empty">No device fits this budget and platform. Raise the budget or choose any platform.</p>}
        </div>
      </div>
      <p className="method-note light-note">Match is a weighted editorial score out of 100, not a purchase probability. Budget fits use listed reference prices; imports with unknown prices are excluded.</p>
    </section>

    <section className="compare" id="compare">
      <div className="section-kicker">HEAD TO HEAD · {preset.toUpperCase()} LENS</div>
      <div className="section-title"><h2>Side by side.</h2><p>Compare specifications and tradeoffs using your priorities. Scored verdicts apply to reviewed devices of the same type.</p></div>
      <div className="compare-toolbar"><div className="currency-toggle" aria-label="Price currency">{(["USD", "AED"] as Currency[]).map(value => <button key={value} className={currency === value ? "active" : ""} aria-pressed={currency === value} onClick={() => setCurrency(value)}>{value}</button>)}</div><button className="share-button" onClick={shareComparison}>{shareMessage}</button></div>
      <div className="selectors">
        <label>DEVICE A<select value={left.id} onChange={event => setLeftId(event.target.value)}>{deviceOptions}</select></label>
        <button className="versus" aria-label="Swap compared devices" onClick={() => { setLeftId(right.id); setRightId(left.id); }}>⇄</button>
        <label>DEVICE B<select value={right.id} onChange={event => setRightId(event.target.value)}>{deviceOptions}</select></label>
      </div>
      <div className="device-heads">
        {[left, right].map((device, index) => <div key={`${index}-${device.id}`}><small>{index === 0 ? "A" : "B"} · {deviceCategory(device)} · {device.brand} · {device.os} · {device.year || "Year unconfirmed"} {device.source === "live" ? "· WEB IMPORT" : ""}</small><h3>{device.name}</h3><p>{device.highlight}</p><button className={favorites.includes(device.id) ? "head-save saved" : "head-save"} onClick={() => toggleFavorite(device.id)}>{favorites.includes(device.id) ? "♥ Saved" : "♡ Save"}</button>{device.specSources && <p className="device-source">Checked {device.verifiedAt} · {device.specSources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>)}</p>}</div>)}
      </div>
      <div className="comparison-summary">
        <div><small>{preset.toUpperCase()} RESULT</small><strong>{resultTitle}</strong><span>{resultDetail}</span></div>
        <div><small>CATEGORY WINS · A / B</small><strong>{canScore ? `${winnerCount} / ${rightWinnerCount}` : "—"}</strong><span>{canScore ? "Higher editorial scores; ties excluded" : "Scored verdict unavailable"}</span></div>
        <div><small>BIGGEST SEPARATORS</small><strong>{canScore && decisiveMetrics.length ? decisiveMetrics.join(" + ") : "See specifications"}</strong><span>{canScore ? "Weighted by your priorities" : "Compare the details for your use"}</span></div>
        <div><small>PRICE GAP</small><strong>{priceDifference === null ? "Check locally" : currency === "AED" ? `AED ${Math.round(priceDifference * 3.6725).toLocaleString()}` : `$${priceDifference.toLocaleString()}`}</strong><span>Based on listed launch prices</span></div>
      </div>
      <div className="spec-table">{comparisonRows.map(([label, leftValue, rightValue]) => <div className="spec-row" key={label}><div className="spec-label">{label}</div><div>{leftValue}</div><div>{rightValue}</div></div>)}</div>
      {canScore && <div className="score-compare">{scoreKeys.map(metricName => {
        const leftScore = left.scores[metricName] ?? 0; const rightScore = right.scores[metricName] ?? 0;
        return <div className="metric" key={metricName}><div className={leftScore > rightScore ? "metric-winner" : ""}><span>{metricLabel(metricName, left)}<em>{weights[metricName].toFixed(1)}×</em></span><b>{leftScore.toFixed(1)}</b></div><div className="bars"><i style={{ width: `${leftScore * 10}%` }} /><i style={{ width: `${rightScore * 10}%` }} /></div><div className={rightScore > leftScore ? "metric-winner" : ""}><b>{rightScore.toFixed(1)}</b><span>{metricLabel(metricName, right)}<em>{weights[metricName].toFixed(1)}×</em></span></div></div>;
      })}</div>}
      <details className="methodology"><summary>How the scores work</summary><p>Each reviewed device has editorial ratings from 0 to 10. The overall match is the sum of each rating × your weight, divided by the total weight, then multiplied by 10. Camera becomes graphics for laptops. Differences below 0.3 points are treated as a close call. These ratings are decision aids, not laboratory benchmarks. Raw specifications do not automatically determine camera quality or battery life.</p><p>Reference prices describe listed entry configurations. AED values are conversions at 3.6725 per USD, not local retailer quotes. Web imports are unscored because their specifications, prices and completeness have not been reviewed.</p></details>
    </section>

    <section className="finder" id="finder">
      <div><div><p className="section-kicker">PHONE + LAPTOP LIBRARY</p><h2>Explore your options.</h2><p className="library-intro">Filter by model, platform and price. Open a full profile for specifications and buying context.</p></div><div className="catalogue-count"><strong>{catalogue.length}</strong><span>{catalogueStats.phoneCount} phones · {catalogueStats.laptopCount} laptops<br/>{brands.length - 1} brands</span></div></div>
      <div className="library-stats" aria-label="Device library coverage">
        <article><small>SPECIFICATION POINTS</small><strong>{catalogueStats.specPoints.toLocaleString()}+</strong><span>organized into scannable profile groups</span></article>
        <article><small>PLATFORMS</small><strong>{catalogueStats.platforms}</strong><span>Android, iOS, Windows, macOS and more</span></article>
        <article><small>MODEL YEARS</small><strong>{catalogueStats.yearsCovered}</strong><span>years represented in the current library</span></article>
        <article><small>DETAIL LEVEL</small><strong>12–14</strong><span>profile sections for phones and laptops</span></article>
      </div>
      <div className="filter-panel">
        <div className="search-row"><input aria-label="Search devices" placeholder="Search brand, model or processor…" value={query} onChange={event => setQuery(event.target.value)} /><button className="reset-filters" onClick={resetLibrary}>Reset filters</button></div>
        <div className="filter-grid">
          <label>DEVICE TYPE<select value={categoryFilter} onChange={event => { setCategoryFilter(event.target.value as DeviceKind); setFilter("All"); }}><option>All devices</option><option>Phones</option><option>Laptops</option></select></label>
          <label>PLATFORM<select value={filter} onChange={event => setFilter(event.target.value as typeof filter)}><option>All</option>{Array.from(new Set(catalogue.filter(device => categoryFilter === "All devices" || deviceCategory(device) === categoryFilter.slice(0, -1)).map(device => device.os))).map(platform => <option key={platform}>{platform}</option>)}</select></label>
          <label>BRAND<select value={brandFilter} onChange={event => setBrandFilter(event.target.value)}>{brands.map(brand => <option key={brand}>{brand}</option>)}</select></label>
          <label>YEAR<select value={yearFilter} onChange={event => setYearFilter(event.target.value)}>{years.map(year => <option key={year}>{year}</option>)}</select></label>
          <label>SORT BY<select value={sort} onChange={event => setSort(event.target.value)}><option value="score">My match score</option><option value="price-low">Lowest price</option><option value="newest">Newest</option><option value="camera">{categoryFilter === "Laptops" ? "Graphics" : "Camera / graphics"}</option><option value="battery">Battery</option><option value="performance">Performance</option><option value="value">Value</option></select></label>
          <label className="price-control"><span>MAX PRICE <b>{budgetLabel(maxPrice)}</b></span><input aria-label="Library price limit" type="range" min="300" max="2200" step="100" value={maxPrice} onChange={event => setMaxPrice(Number(event.target.value))} /></label>
        </div>
      </div>
      <div className="library-results"><p className="results-line" aria-live="polite">Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} devices{sort === "score" ? ` · ${preset.toLowerCase()} priorities` : ""}</p><div className="library-view" aria-label="Library card detail"><span>Card detail</span>{(["Detailed", "Compact"] as LibraryView[]).map(view => <button key={view} className={libraryView === view ? "active" : ""} aria-pressed={libraryView === view} onClick={() => setLibraryView(view)}>{view}</button>)}</div></div>
      <div className="device-grid">{filtered.slice(0, visibleCount).map(device => <article className={`device-card ${deviceCategory(device).toLowerCase()}-card`} key={device.id}>
        <div className={`os-dot ${deviceCategory(device) === "Laptop" ? "laptop" : device.os === "Android" ? "android" : "ios"}`} />
        <button className={favorites.includes(device.id) ? "favorite-toggle saved" : "favorite-toggle"} aria-label={`${favorites.includes(device.id) ? "Remove" : "Add"} ${device.name} ${favorites.includes(device.id) ? "from" : "to"} saved devices`} aria-pressed={favorites.includes(device.id)} onClick={() => toggleFavorite(device.id)}>{favorites.includes(device.id) ? "♥" : "♡"}</button>
        <small>{deviceCategory(device)} · {device.brand} · {device.year || "Year unconfirmed"} {device.source === "live" ? "· WEB IMPORT" : ""}</small><h3>{device.name}</h3><p>{device.highlight}</p>
        <dl><div><dt>Display</dt><dd>{device.display}</dd></div><div><dt>Processor</dt><dd>{device.chip}</dd></div>{libraryView === "Detailed" && <><div><dt>Memory</dt><dd>{device.ram}</dd></div><div><dt>Storage</dt><dd>{device.storage}</dd></div><div><dt>{deviceCategory(device) === "Laptop" ? "Graphics" : "Cameras"}</dt><dd>{deviceCategory(device) === "Laptop" ? device.details?.graphics ?? "Integrated graphics" : device.cameras}</dd></div><div><dt>Battery</dt><dd>{device.battery}</dd></div><div><dt>Charging</dt><dd>{device.charging}</dd></div><div><dt>Weight</dt><dd>{device.weight}</dd></div></>}<div><dt>Reference price</dt><dd>{priceLabel(device)}</dd></div><div><dt>Your match</dt><dd>{device.source === "live" ? "Not scored" : `${Math.round(weightedAverage(device, weights) * 10)}%`}</dd></div></dl>
        <div className="card-actions"><button onClick={() => setProfileId(device.id)}>Full specifications</button><button onClick={() => chooseForComparison(device)}>Compare</button></div>
      </article>)}</div>
      {visibleCount < filtered.length && <div className="load-more"><button onClick={() => setVisibleCount(count => count + 12)}>Show {Math.min(12, filtered.length - visibleCount)} more devices</button><span>{filtered.length - visibleCount} remaining</span></div>}
      {!filtered.length && <p className="empty">No matching devices. Increase the price limit, clear a filter, or search the live feed below.</p>}
      <div className="library-method"><div><strong>What a full profile includes</strong><span>Platform, display, memory, storage, camera or graphics, battery, charging, connectivity, construction, pricing context and model-specific notes.</span></div><p>Configurations, launch prices and regional features can vary. Treat the library as a decision aid and confirm the exact local model code before purchase.</p></div>
    </section>

    <section className="region-guide" id="region">
      <div className="region-heading"><div><p className="section-kicker">REGION CHECK</p><h2>Before you buy,<br/>check the variant.</h2></div><div className="region-toggle" aria-label="Buying region">{(["UAE", "International"] as Region[]).map(value => <button key={value} className={region === value ? "active" : ""} aria-pressed={region === value} onClick={() => { setRegion(value); setCurrency(value === "UAE" ? "AED" : "USD"); }}>{value}</button>)}</div></div>
      <p className="region-intro">The same phone name can hide different radios, SIM setups, software features and support terms. Use this checklist against the exact model code before checkout.</p>
      <div className="region-grid">
        <article><span>01</span><h3>Network + power</h3><p>{region === "UAE" ? "For phones, confirm UAE carrier bands and VoLTE. For laptops, verify Wi-Fi generation, cellular options, charger plug and local voltage compatibility." : "Match cellular, Wi-Fi and power specifications to the country and networks where the device will be used."}</p></article>
        <article><span>02</span><h3>Services + layout</h3><p>{region === "UAE" ? "Check SIM/eSIM and regional service availability on phones; check keyboard layout, OS edition and bundled power adapter on laptops." : "Account services, radio options, keyboard layouts and bundled accessories can differ by sales region."}</p></article>
        <article><span>03</span><h3>Warranty + parts</h3><p>{region === "UAE" ? "Ask whether the phone has official UAE warranty. Grey imports may depend on the seller or require service in another country." : "Confirm whether manufacturer warranty and authorized repair coverage travel with an imported device."}</p></article>
        <article><span>04</span><h3>Real checkout price</h3><p>{region === "UAE" ? "AED estimates use 3.6725 per USD. Add local VAT, retailer margin, storage tier and bundle differences." : "Launch prices are reference points. Include tax, delivery, trade-in terms and the exact storage configuration."}</p></article>
      </div>
    </section>

    <section className="saved-section" id="saved">
      <div className="saved-heading"><div><p className="section-kicker">YOUR SHORTLIST</p><h2>Keep the good ones close.</h2></div><span>{savedDevices.length} saved</span></div>
      {savedDevices.length ? <div className="saved-grid">{savedDevices.map(device => <article key={device.id}><div><small>{deviceCategory(device)} · {device.brand} · {device.os}</small><h3>{device.name}</h3><p>{device.source === "live" ? "Unscored web import" : `${Math.round(weightedAverage(device, weights) * 10)}% match`} · {priceLabel(device)}</p></div><div><button onClick={() => { setLeftId(device.id); scrollToCompare(); }}>Use as A</button><button onClick={() => { setRightId(device.id); scrollToCompare(); }}>Use as B</button><button aria-label={`Remove ${device.name} from saved devices`} onClick={() => toggleFavorite(device.id)}>×</button></div></article>)}</div> : <div className="saved-empty"><span>♡</span><div><h3>Your shortlist is ready.</h3><p>Save phones or laptops from Smart Match, the catalogue or a comparison. They stay on this device for your next visit.</p></div><a href="#finder">Explore devices</a></div>}
    </section>

    <section className="live-section" id="live">
      <div className="live-heading"><div><p className="section-kicker">UNIFIED SMART SEARCH</p><h2>Search wider.<br/>Match faster.</h2></div><div className={`feed-status ${liveState}`}><i /><span>{liveState === "searching" ? "SEARCHING SOURCES" : liveState === "offline" ? "RETRY AVAILABLE" : "SMART SEARCH"}</span></div></div>
      <p className="live-intro">Search a phone or laptop model. Open a catalogue profile or collect an unscored specification record from the web.</p>
      <div className="device-kind-switch" aria-label="Device search category">{(["All devices", "Phones", "Laptops"] as DeviceKind[]).map(kind => <button key={kind} className={searchKind === kind ? "active" : ""} aria-pressed={searchKind === kind} onClick={() => setSearchKind(kind)}><span>{kind === "Phones" ? "▯" : kind === "Laptops" ? "▱" : "✦"}</span>{kind}</button>)}</div>
      <form className="live-search" role="search" onSubmit={event => { event.preventDefault(); setLiveRefresh(value => value + 1); }}><input aria-label="Search phone and laptop data" placeholder="Brand + model, e.g. MacBook Air M4 or OnePlus 13" value={liveQuery} onChange={event => updateLiveQuery(event.target.value)} /><button type="submit" disabled={liveQuery.trim().length < 2 || liveState === "searching"}>{liveState === "searching" ? "Searching…" : "Analyze device"}</button></form>
      <div className="search-tools"><div className="search-scopes" aria-label="Search result source">{(["Smart", "Catalogue", "Live web"] as SearchScope[]).map(scope => <button key={scope} className={searchScope === scope ? "active" : ""} aria-pressed={searchScope === scope} onClick={() => setSearchScope(scope)}>{scope}</button>)}</div><span>{liveSource || "Catalogue + live web"}</span></div>
      <div className="quick-searches"><span>TRY:</span>{quickSearches.map(term => <button key={term} onClick={() => { updateLiveQuery(term); setLiveRefresh(value => value + 1); }}>{term}</button>)}</div>
      <div className="live-meta" aria-live="polite"><p>{liveMessage}</p>{collectedAt && <time dateTime={collectedAt}>Updated {new Date(collectedAt).toLocaleString()}</time>}</div>
      {scopedLiveResults.length > 0 && <div className="live-grid">{scopedLiveResults.map(result => {
        const added = liveDevices.some(device => device.liveSlug === result.slug);
        return <article className="live-card" key={result.slug}>
          <div className="live-image">{result.image ? <img src={result.image} alt="" onError={event => { event.currentTarget.style.display = "none"; }} /> : <span>▯</span>}</div>
          <div><div className="result-labels"><small>{result.category || "Device"} · {result.brand || "RESULT"}</small><em>{result.source || (result.catalogueId ? "Catalogue" : "Live web")}</em></div><h3>{result.name}</h3><p>{result.detail || "Full specifications available from the current record."}</p></div>
          <button disabled={importing === result.slug} onClick={() => importLiveDevice(result)}>{importing === result.slug ? "Collecting…" : result.catalogueId ? "Open analysis" : added ? "Analyze again" : "Collect specs + analyze"}</button>
        </article>;
      })}</div>}
      {liveResults.length > 0 && !scopedLiveResults.length && <div className="scope-empty"><strong>No {searchScope.toLowerCase()} results in this set.</strong><span>Switch to Smart to see all {liveResults.length} matches.</span></div>}
      <p className="source-note">Smart search combines the curated Device Match catalogue, current Wikipedia device records and a secondary community phone feed. Regional configurations can differ; confirm a purchase against the manufacturer’s local product page.</p>
      <div className="paste-analyzer">
        <div className="paste-heading"><div><span>PASTE-ANYTHING ANALYZER</span><h3>Already have a specification sheet?</h3><p>Paste the key specifications and get an instant completeness, strength and risk scan.</p></div><select aria-label="Specification category" value={manualKind} onChange={event => setManualKind(event.target.value as "Phone" | "Laptop")}><option>Phone</option><option>Laptop</option></select></div>
        <div className="paste-workspace"><textarea aria-label="Paste device specifications" placeholder="Paste processor, RAM, storage, display, graphics/camera, battery and weight here…" value={manualSpecs} onChange={event => setManualSpecs(event.target.value)} /><div className="analysis-output">{manualAnalysis ? <>
          <div><small>DETECTED</small><p>{manualAnalysis.detected.length ? manualAnalysis.detected.join(" · ") : "No structured specifications detected yet."}</p></div>
          <div><small>STRENGTHS</small><ul>{manualAnalysis.strengths.length ? manualAnalysis.strengths.map(item => <li key={item}>{item}</li>) : <li>Add more processor, display or graphics detail.</li>}</ul></div>
          <div><small>CHECK BEFORE BUYING</small><ul>{manualAnalysis.watchouts.map(item => <li key={item}>{item}</li>)}</ul></div>
        </> : <div className="analysis-placeholder"><strong>Paste at least a few specification lines.</strong><span>The analyzer runs locally in your browser and updates as you type.</span></div>}</div></div>
      </div>
    </section>

    {profile && <div className="profile-backdrop" role="presentation" onClick={() => setProfileId(null)}><section ref={profileSheet} className="profile-sheet" role="dialog" aria-modal="true" aria-label={`${profile.name} full specifications`} onClick={event => event.stopPropagation()}>
      <header><div><p>{deviceCategory(profile)} · {profile.brand} · {profile.year || "Year unconfirmed"} {profile.source === "live" ? "· WEB IMPORT" : ""}</p><h2>{profile.name}</h2><span>{profile.highlight}</span></div><button aria-label="Close full specifications" onClick={() => setProfileId(null)}>×</button></header>
      {profile.image && <div className="profile-image"><img src={profile.image} alt={profile.name} /></div>}
      <div className="profile-score"><strong>{profile.source === "live" ? "—" : weightedAverage(profile, weights).toFixed(1)}</strong><span>{profile.source === "live" ? "Unscored" : preset}<br/>profile</span><button className={favorites.includes(profile.id) ? "saved" : ""} onClick={() => toggleFavorite(profile.id)}>{favorites.includes(profile.id) ? "♥ Saved" : "♡ Save device"}</button><button onClick={() => { setRightId(profile.id); setProfileId(null); scrollToCompare(); }}>Add to comparison</button></div>
      {profileAnalysis && profile.source !== "live" && <div className="profile-analysis"><div><small>BEST FOR</small><strong>{profileAnalysis.bestFor}</strong></div><div><small>STRENGTHS</small><strong>{profileAnalysis.strengths.join(" + ")}</strong></div><div><small>WATCHOUTS</small><strong>{profileAnalysis.watchouts.length ? profileAnalysis.watchouts.join(" · ") : "Check regional configuration, software support and current price"}</strong></div></div>}
      <div className="profile-groups">{getSpecGroups(profile).map(group => <div className="profile-group" key={group.name}><h3>{group.name}</h3><dl>{group.rows.map(([label, value], index) => <div key={`${label}-${index}`}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl></div>)}</div>
      {profile.specSources && <p className="profile-note">Manufacturer specifications checked {profile.verifiedAt}: {profile.specSources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label} </a>)}</p>}<p className="profile-note">Specifications and prices can vary by region, carrier, storage configuration and software version. Confirm purchasing details with the manufacturer or retailer.</p>
    </section></div>}

    <section className="verdict" id="verdict"><p className="section-kicker">YOUR CURRENT MATCHUP</p><h2>{resultTitle}</h2><p>{resultDetail} {canScore ? "Check price, size, software support and the ecosystem you use before choosing." : "Use the specification profiles to assess each device."}</p><button className="cta" onClick={scrollToCompare}>Refine matchup</button></section>
    <div className="save-status" role="status">{saveMessage}</div>

    <footer><a className="brand" href="#top">DEVICE<span>{"//"}</span>MATCH</a><div><p>Independent guidance for a more confident device decision. Scores are adjustable aids, not paid placements.</p><p className="footer-links"><a href="#match">Smart Match</a><a href="#compare">Compare</a><a href="#live">Analyzer</a><a href="#region">Region check</a></p></div></footer>
  </main>;
}
