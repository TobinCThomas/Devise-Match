import { devices, type Device } from "./devices.ts";

const API_BASES = [
  "https://phone-specs-api-2.azharimm.dev/v2",
  "https://api-mobilespecs.azharimm.dev/v2",
];
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";

type UnknownRecord = Record<string, unknown>;
type SearchCategory = "phone" | "laptop" | "all";

const deviceCategory = (device: Device) => device.category ?? "Phone";

const record = (value: unknown): UnknownRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

const list = (value: unknown) => Array.isArray(value) ? value : [];

const getPayload = (payload: unknown) => {
  const root = record(payload);
  return record(root.data ?? root);
};

const normaliseSummary = (item: unknown) => {
  const phone = record(item);
  const name = text(phone.phone_name ?? phone.name ?? phone.title);
  const slug = text(phone.slug ?? phone.id);
  const detail = text(phone.detail ?? phone.description);
  const brand = text(phone.brand) || name.split(" ")[0] || "Unknown";

  return {
    slug,
    brand,
    name,
    image: text(phone.image ?? phone.thumbnail),
    detail,
    source: "Community specifications feed",
    category: "Phone",
  };
};

const normaliseSearchValue = (value: string) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const resultKey = (value: string) => normaliseSearchValue(value.replace(/\+/g, " plus "));

const searchCatalogue = (query: string, category: SearchCategory) => {
  const terms = normaliseSearchValue(query).split(" ").filter(term => term.length > 1 || /^\d+$/.test(term));
  if (!terms.length) return [];

  return devices.filter(device => category === "all" || deviceCategory(device).toLowerCase() === category).map(device => {
    const haystack = normaliseSearchValue(`${device.brand} ${device.name}`);
    const overlap = terms.filter(term => haystack.includes(term)).length;
    const exact = haystack === normaliseSearchValue(query);
    return { device, overlap, exact };
  })
    .filter(item => item.overlap === terms.length)
    .sort((a, b) => Number(b.exact) - Number(a.exact) || b.device.year - a.device.year)
    .slice(0, 8)
    .map(({ device }) => ({
      slug: `catalogue-${device.id}`,
      catalogueId: device.id,
      brand: device.brand,
      name: device.name,
      image: device.image ?? "",
      detail: `${device.highlight} · Curated comparison profile already in the catalogue.`,
      source: "Catalogue",
      category: deviceCategory(device),
    }));
};

const catalogueDevice = (slug: string): Device | null => {
  const id = slug.replace(/^catalogue-/, "");
  return devices.find(device => device.id === id) ?? null;
};

const findSpec = (groups: unknown[], groupPattern: RegExp, keyPattern: RegExp) => {
  for (const rawGroup of groups) {
    const group = record(rawGroup);
    const title = text(group.title ?? group.name);
    if (!groupPattern.test(title)) continue;

    const rows = list(group.specs ?? group.rows);
    for (const rawRow of rows) {
      const row = record(rawRow);
      const key = text(row.key ?? row.label);
      if (!keyPattern.test(key)) continue;
      const values = list(row.val ?? row.value).map(text).filter(Boolean);
      return values.join(" · ") || text(row.val ?? row.value);
    }
  }
  return "";
};



const numberFrom = (value: string) => {
  const match = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const batteryCapacityFrom = (value: string) => {
  const capacities = Array.from(value.replace(/,/g, "").matchAll(/(\d{3,5})\s*mAh/gi), match => Number(match[1]));
  return capacities.length ? Math.max(...capacities) : numberFrom(value);
};

const normaliseDetail = (payload: unknown, requestedSlug: string) => {
  const data = getPayload(payload);
  const groups = list(data.specifications);
  const name = text(data.phone_name ?? data.name) || requestedSlug.replace(/[-_]/g, " ");
  const brand = text(data.brand) || name.split(" ")[0] || "Unknown";
  const osText = text(data.os) || findSpec(groups, /platform/i, /os/i);
  const display = findSpec(groups, /display/i, /type|size/i) || "See live specification profile";
  const resolution = findSpec(groups, /display/i, /resolution/i);
  const chip = findSpec(groups, /platform/i, /chipset/i) || "See live specification profile";
  const ram = findSpec(groups, /memory/i, /ram/i) || "Configuration varies";
  const storage = text(data.storage) || findSpec(groups, /memory/i, /internal|storage/i) || "Configuration varies";
  const cameras = findSpec(groups, /main camera/i, /triple|dual|quad|single|camera|modules/i)
    || findSpec(groups, /main camera/i, /wide/i) || "See camera specification";
  const battery = findSpec(groups, /battery/i, /type|capacity/i) || "See battery specification";
  const charging = findSpec(groups, /battery/i, /charging/i) || "See charging specification";
  const weight = findSpec(groups, /body/i, /weight/i) || "See body specification";
  const protection = findSpec(groups, /body|features/i, /resistance|protection|build/i) || "Market specification varies";
  const release = text(data.release_date) || findSpec(groups, /launch/i, /announced|released/i);
  const yearMatch = release.match(/20\d{2}/);
  const year = yearMatch ? Number(yearMatch[0]) : 0;
  const scores = {};

  return {
    id: `live-${requestedSlug}`,
    liveSlug: requestedSlug,
    source: "live" as const,
    sourceLabel: "Live phone specifications feed",
    category: "Phone" as const,
    brand,
    name,
    os: /ios/i.test(osText) || /iphone/i.test(name) ? "iOS" : "Android",
    year,
    price: 0,
    display,
    chip,
    ram,
    storage,
    cameras,
    battery,
    charging,
    weight,
    durability: protection,
    highlight: "Imported from the live device feed; verify regional configuration and retail price.",
    image: text(data.thumbnail) || list(data.phone_images).map(text).find(Boolean) || "",
    scores,
    details: {
      network: findSpec(groups, /network/i, /technology/i),
      dimensions: text(data.dimension) || findSpec(groups, /body/i, /dimensions/i),
      sim: findSpec(groups, /body|network/i, /sim/i),
      resolution,
      software: osText,
      cardSlot: findSpec(groups, /memory/i, /card slot/i),
      video: findSpec(groups, /main camera/i, /video/i),
      selfie: findSpec(groups, /selfie/i, /single|dual|camera/i),
      audio: findSpec(groups, /sound/i, /loudspeaker/i),
      wifi: findSpec(groups, /comms|communications/i, /wlan|wi-fi/i),
      bluetooth: findSpec(groups, /comms|communications/i, /bluetooth/i),
      nfc: findSpec(groups, /comms|communications/i, /nfc/i),
      usb: findSpec(groups, /comms|communications/i, /usb/i),
      sensors: findSpec(groups, /features/i, /sensors/i),
      colors: findSpec(groups, /misc/i, /colors/i),
    },
    liveGroups: groups.map(rawGroup => {
      const group = record(rawGroup);
      return {
        name: text(group.title ?? group.name) || "Specifications",
        rows: list(group.specs ?? group.rows).map(rawRow => {
          const row = record(rawRow);
          const values = list(row.val ?? row.value).map(text).filter(Boolean);
          return [text(row.key ?? row.label) || "Detail", values.join(" · ") || text(row.val ?? row.value) || "—"];
        }).filter(row => row[1] !== "—"),
      };
    }).filter(group => group.rows.length),
  };
};

async function fetchJson(url: string, signal?: AbortSignal) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    credentials: "omit",
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(5500)]) : AbortSignal.timeout(5500),
  });
  if (!response.ok) throw new Error(`Upstream response ${response.status}`);
  return response.json();
}

async function fetchPhoneFeed(path: string, signal?: AbortSignal) {
  try {
    return await Promise.any(API_BASES.map(base => fetchJson(`${base}${path}`, signal)));
  } catch {
    throw new Error("Community phone feeds unavailable");
  }
}

const cleanWikiText = (value: string) => {
  let result = value
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref\b[^>]*\/>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\[(?:https?:\/\/\S+)\s+([^\]]+)\]/g, "$1")
    .replace(/<br\s*\/?>/gi, " · ")
    .replace(/\n\s*\*\s*/g, " · ");

  for (let pass = 0; pass < 6; pass += 1) {
    result = result
      .replace(/\{\{(?:start date(?: and age)?|start-date)[^|}]*\|(\d{4})\|(\d{1,2})\|(\d{1,2})[^{}]*\}\}/gi, "$1-$2-$3")
      .replace(/\{\{(?:convert|cvt)\s*\|([^|{}]+)\|([^|{}]+)[^{}]*\}\}/gi, "$1 $2")
      .replace(/\{\{\s*(?:nowrap|ubl|unbulleted list|plainlist|flatlist|small)\s*\|([^{}]+)\}\}/gi, (_match, body: string) => body.replace(/\|/g, " · "))
      .replace(/\{\{[^{}]*\}\}/g, "");
  }

  return result
    .replace(/'{2,}/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s*\|\s*/g, " · ")
    .replace(/\b(?:abbr=on|lk=on)\b/gi, "")
    .replace(/\{\{|\}\}/g, "")
    .replace(/(?:\s*·\s*){2,}/g, " · ")
    .replace(/\s+/g, " ")
    .replace(/^\s*·|·\s*$/g, "")
    .trim();
};

const extractInfobox = (wikitext: string) => {
  const start = wikitext.search(/\{\{Infobox (?:mobile phone|information appliance|product)/i);
  if (start < 0) return wikitext.slice(0, 18000);
  let depth = 0;
  for (let index = start; index < wikitext.length - 1; index += 1) {
    const pair = wikitext.slice(index, index + 2);
    if (pair === "{{") { depth += 1; index += 1; continue; }
    if (pair === "}}") {
      depth -= 1;
      index += 1;
      if (depth === 0) return wikitext.slice(start, index + 1);
    }
  }
  return wikitext.slice(start, start + 24000);
};

const parseWikipediaInfobox = (wikitext: string) => {
  const values: Record<string, string> = {};
  const infobox = extractInfobox(wikitext);
  const matches = infobox.matchAll(/^\|\s*([a-zA-Z0-9_ ]+?)\s*=\s*([\s\S]*?)(?=^\|\s*[a-zA-Z0-9_ ]+?\s*=|\n\}\}$)/gm);
  for (const match of matches) {
    const currentKey = match[1].trim().toLowerCase().replace(/\s+/g, "_");
    values[currentKey] = cleanWikiText(match[2]);
  }
  return values;
};

const tidySpec = (value: string) => value
  .replace(/^\{\{?(?:ubl|unbulleted list|plainlist|flatlist)\s*·?\s*/i, "")
  .replace(/\}\}$/g, "")
  .replace(/&nbsp;/gi, " ")
  .replace(/\s*·\s*(?:mm|abbr=on|0)(?=\s|$)/gi, "")
  .replace(/\s+/g, " ")
  .trim();

const decodeHtml = (value: string) => value
  .replace(/&nbsp;|&#160;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, "\"")
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));

const renderedText = (value: string) => decodeHtml(value
  .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
  .replace(/<br\s*\/?>|<\/li>|<\/p>/gi, " · ")
  .replace(/<li\b[^>]*>|<p\b[^>]*>/gi, "")
  .replace(/<[^>]+>/g, "")
  .replace(/(?:\s*·\s*){2,}/g, " · ")
  .replace(/\s+/g, " ")
  .replace(/^\s*·|·\s*$/g, "")
  .trim());

const parseRenderedInfobox = (html: string) => {
  const values: Record<string, string> = {};
  const start = html.search(/<table\b[^>]*class="[^"]*\binfobox\b/i);
  if (start < 0) return values;
  const infobox = html.slice(start, start + 70000);

  for (const match of infobox.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const row = match[1];
    const heading = row.match(/<th\b[^>]*>([\s\S]*?)<\/th>/i)?.[1];
    const cell = row.match(/<td\b[^>]*>([\s\S]*?)<\/td>/i)?.[1];
    if (!heading || !cell) continue;
    const key = renderedText(heading).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const value = renderedText(cell);
    if (key && value) values[key] = value;
  }

  return values;
};

const inferReleaseYear = (release: string, extract: string, wikitext: string) => {
  const direct = release.match(/20\d{2}/)?.[0];
  if (direct) return Number(direct);

  const prose = extract.match(/(?:released|announced|introduced|unveiled|launched)[^.]{0,120}\b(20\d{2})\b/i)?.[1];
  if (prose) return Number(prose);

  const rawField = wikitext.match(/^\|\s*(?:released|release_date|available|introduced)\s*=\s*[\s\S]{0,260}?\b(20\d{2})\b/im)?.[1];
  return rawField ? Number(rawField) : 0;
};

const inferBrand = (title: string, extract = "") => {
  const value = `${title} ${extract}`.toLowerCase();
  if (/iphone|apple/.test(value)) return "Apple";
  if (/galaxy|samsung/.test(value)) return "Samsung";
  if (/pixel|google/.test(value)) return "Google";
  if (/xperia|sony/.test(value)) return "Sony";
  if (/redmi|xiaomi|poco/.test(value)) return "Xiaomi";
  if (/oneplus/.test(value)) return "OnePlus";
  if (/motorola|\brazr\b/.test(value)) return "Motorola";
  if (/huawei/.test(value)) return "HUAWEI";
  if (/\bhonor\b/.test(value)) return "HONOR";
  if (/\boppo\b/.test(value)) return "OPPO";
  if (/\bvivo\b/.test(value)) return "vivo";
  if (/\brealme\b/.test(value)) return "realme";
  if (/cmf phone/.test(value)) return "CMF";
  if (/nothing phone/.test(value)) return "Nothing";
  return title.split(" ")[0] || "Unknown";
};

async function searchWikipedia(query: string, category: SearchCategory, signal?: AbortSignal) {
  const suffix = category === "laptop" ? "laptop computer" : category === "phone" ? "smartphone" : "";
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${query} ${suffix}`.trim(),
    gsrnamespace: "0",
    gsrlimit: "18",
    prop: "pageimages|extracts",
    piprop: "thumbnail",
    pithumbsize: "320",
    exintro: "1",
    explaintext: "1",
    exlimit: "max",
    format: "json",
    origin: "*",
  });
  const payload = record(await fetchJson(`${WIKIPEDIA_API}?${params}`, signal));
  const pages = Object.values(record(record(payload.query).pages));
  const tokens = query.toLowerCase().split(/\s+/).filter(token => token.length > 1 || /^\d+$/.test(token));
  return pages.map(rawPage => {
    const page = record(rawPage);
    const title = text(page.title);
    const extract = text(page.extract);
    const titleLower = title.toLowerCase();
    const laptopLike = /laptop|notebook computer|portable computer|macbook|chromebook/i.test(`${title} ${extract}`);
    const phoneLike = /smartphone|mobile phone|feature phone|line of phones|line of smartphones/i.test(extract);
    const thumbnail = record(page.thumbnail);
    return {
      slug: `wiki-${String(page.pageid ?? "")}`,
      brand: inferBrand(title, extract),
      name: title.replace(/^IPhone\b/, "iPhone").replace(/^IOS\b/, "iOS"),
      image: text(thumbnail.source),
      detail: extract.slice(0, 220),
      source: "Wikipedia live",
      category: laptopLike ? "Laptop" : "Phone",
      deviceLike: category === "laptop" ? laptopLike : category === "phone" ? phoneLike : laptopLike || phoneLike,
      overlap: tokens.filter(token => titleLower.includes(token)).length,
      exact: titleLower.includes(query.toLowerCase()),
      searchRank: Number(page.index ?? 999),
    };
  })
    .filter(phone => phone.slug !== "wiki-" && phone.name && phone.deviceLike && phone.overlap > 0 && !/list of|comparison|disambiguation|naming$/i.test(phone.name))
    .sort((a, b) => Number(b.exact) - Number(a.exact) || b.overlap - a.overlap || a.searchRank - b.searchRank || a.name.length - b.name.length)
    .slice(0, 12)
    .map(phone => ({ slug: phone.slug, brand: phone.brand, name: phone.name, image: phone.image, detail: phone.detail, source: phone.source, category: phone.category }));
}

async function getWikipediaDevice(slug: string, signal?: AbortSignal) {
  const pageId = slug.replace(/^wiki-/, "");
  if (!/^\d+$/.test(pageId)) throw new Error("Invalid Wikipedia page identifier");
  const common = { action: "query", pageids: pageId, format: "json", origin: "*" };
  const [parsePayload, imagePayload] = await Promise.all([
    fetchJson(`${WIKIPEDIA_API}?${new URLSearchParams({ action: "parse", pageid: pageId, prop: "wikitext|text", format: "json", origin: "*" })}`, signal),
    fetchJson(`${WIKIPEDIA_API}?${new URLSearchParams({ ...common, prop: "pageimages|extracts", piprop: "thumbnail", pithumbsize: "600", exintro: "1", explaintext: "1" })}`, signal),
  ]);
  const parse = record(record(parsePayload).parse);
  const wikitext = text(record(parse.wikitext)["*"] ?? parse.wikitext);
  const html = text(record(parse.text)["*"] ?? parse.text);
  const info = parseWikipediaInfobox(wikitext);
  const renderedInfo = parseRenderedInfobox(html);
  for (const [key, value] of Object.entries(renderedInfo)) {
    if (!info[key] || value.length > info[key].length) info[key] = value;
  }
  info.released ||= renderedInfo.first_released;
  info.os ||= renderedInfo.operating_system;
  info.soc ||= renderedInfo.system_on_chip;
  info.rear_camera ||= renderedInfo.rear_camera;
  info.front_camera ||= renderedInfo.front_camera;
  info.networks ||= renderedInfo.compatible_networks;
  const page = Object.values(record(record(record(imagePayload).query).pages))[0];
  const pageRecord = record(page);
  const image = text(record(pageRecord.thumbnail).source);
  const extract = text(pageRecord.extract);
  const name = (cleanWikiText(text(parse.title)) || info.name || `Phone ${pageId}`).replace(/^IPhone\b/, "iPhone");
  const brand = info.brand || info.developer || info.manufacturer || inferBrand(name);
  const category = /laptop|notebook|macbook|chromebook/i.test(`${name} ${extract} ${info.type ?? ""}`) ? "Laptop" : "Phone";
  const release = info.released || info.release_date || info.available || "";
  const year = inferReleaseYear(release, extract, wikitext);
  const display = tidySpec(info.display || "See live article profile");
  const chip = tidySpec(info.soc || info.cpu || info.chipset || "See live article profile");
  const ram = tidySpec(info.memory || info.ram || "Configuration varies");
  const storage = tidySpec(info.storage || info.memory_card || "Configuration varies");
  const graphics = tidySpec(info.graphics || info.gpu || renderedInfo.graphics || "Integrated graphics; see full profile");
  const cameras = tidySpec(category === "Laptop"
    ? info.front_camera || info.camera || info.webcam || "See webcam specification"
    : info.rear_camera || info.camera || "See camera specification");
  const battery = tidySpec(info.battery || "See battery specification");
  const charging = tidySpec(info.charging || "See charging specification");
  const scores = {};
  const osText = info.os || renderedInfo.operating_system || "";
  const os = category === "Laptop"
    ? /macos|os x/i.test(osText) || /macbook/i.test(name) ? "macOS" as const
      : /chrome ?os/i.test(osText) || /chromebook/i.test(name) ? "ChromeOS" as const
        : /linux/i.test(osText) && !/windows/i.test(osText) ? "Linux" as const : "Windows" as const
    : /ios/i.test(osText) || /iphone/i.test(name) ? "iOS" as const : "Android" as const;
  const rows = Object.entries(info)
    .filter(([, value]) => value)
    .slice(0, 35)
    .map(([key, value]) => [key.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()), tidySpec(value)]);

  return {
    id: `live-${slug}`,
    liveSlug: slug,
    source: "live" as const,
    sourceLabel: "Live Wikipedia article data",
    category,
    brand,
    name,
    os,
    year,
    price: 0,
    display,
    chip,
    ram,
    storage,
    cameras,
    battery,
    charging,
    weight: info.weight || "See body specification",
    durability: category === "Laptop" ? info.material || info.case || "Construction varies by configuration" : info.water_resist || info.resistance || "Market specification varies",
    highlight: `Imported ${category.toLowerCase()} profile from live Wikipedia data; confirm the exact regional configuration.`,
    image,
    scores,
    details: {
      network: info.networks || info.network || "",
      dimensions: info.dimensions || info.size || "",
      sim: info.sim || "",
      resolution: info.display || "",
      software: info.os || "",
      cardSlot: info.memory_card || "",
      video: info.video || "",
      selfie: info.front_camera || "",
      audio: info.sound || "",
      wifi: info.connectivity || "",
      bluetooth: info.connectivity || "",
      nfc: info.connectivity || "",
      usb: info.connectivity || "",
      sensors: info.input || "",
      colors: info.colors || info.colours || "",
      graphics,
      ports: info.ports || info.connectivity || "",
    },
    liveGroups: [{ name: "Live article infobox", rows }],
  };
}

export async function requestDevices(params: URLSearchParams, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const query = params.get("q")?.trim() ?? "";
  const slug = params.get("slug")?.trim() ?? "";
  const requestedCategory = params.get("category")?.toLowerCase() ?? "all";
  const category: SearchCategory = requestedCategory === "phone" || requestedCategory === "laptop" ? requestedCategory : "all";

  if (!query && !slug) {
    return Response.json({ ok: false, error: "Provide q or slug." }, { status: 400 });
  }

  try {
    if (slug) {
      const existing = slug.startsWith("catalogue-") ? catalogueDevice(slug) : null;
      const device = existing ?? (slug.startsWith("wiki-")
        ? await getWikipediaDevice(slug, signal)
        : normaliseDetail(await fetchPhoneFeed(`/${encodeURIComponent(slug)}`, signal), slug));
      if (!device) return Response.json({ ok: false, error: "That catalogue device is no longer available." }, { status: 404 });
      signal?.throwIfAborted();
      return Response.json({ ok: true, collectedAt: new Date().toISOString(), device });
    }

    if (query.length < 2 || query.length > 80) {
      return Response.json({ ok: false, error: "Search must contain 2–80 characters." }, { status: 400 });
    }

    const catalogueMatches = searchCatalogue(query, category);
    let liveMatches: Array<ReturnType<typeof normaliseSummary> | Awaited<ReturnType<typeof searchWikipedia>>[number]> = [];
    let liveSource = "";
    let warning = "";

    try {
      liveMatches = await searchWikipedia(query, category, signal);
      if (liveMatches.length) liveSource = "Wikipedia live";
    } catch (error) {
      signal?.throwIfAborted();
      warning = error instanceof Error ? error.message : "Wikipedia search unavailable";
    }

    if (category !== "laptop" && !liveMatches.length && !catalogueMatches.length) {
      try {
        const payload = await fetchPhoneFeed(`/search?query=${encodeURIComponent(query)}`, signal);
        const data = getPayload(payload);
        liveMatches = list(data.phones ?? data.results ?? data.items)
          .map(normaliseSummary)
          .filter(phone => phone.slug && phone.name)
          .slice(0, 18);
        if (liveMatches.length) liveSource = "Community specifications feed";
      } catch (error) {
        signal?.throwIfAborted();
        warning = error instanceof Error ? error.message : "External phone sources unavailable";
      }
    }

    const seen = new Set<string>();
    const results = [...catalogueMatches, ...liveMatches].filter(phone => {
      const key = resultKey(phone.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 18);

    const source = [catalogueMatches.length ? "Catalogue" : "", liveSource].filter(Boolean).join(" + ") || "Search completed";
    signal?.throwIfAborted();
    return Response.json({
      ok: true,
      collectedAt: new Date().toISOString(),
      source,
      warning: warning ? "One live source could not be reached." : undefined,
      results,
    });
  } catch (error) {
    signal?.throwIfAborted();
    return Response.json({
      ok: false,
      error: "The live phone feed is temporarily unavailable. The curated comparison catalogue is still available.",
      detail: error instanceof Error ? error.message : "Unknown upstream error",
    }, { status: 503 });
  }
}
