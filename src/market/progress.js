import { MIN_SITE } from "./ui";

// Single source of truth for "how complete is this profile", used by the
// step-by-step setup and by the dashboard overview.
export function technicianProgress({ tech, phone, certs, photos, cv }) {
  const items = [
    ["Phone number", !!(phone || "").trim()],
    ["Profile photo", !!tech?.photo_path],
    ["Headline and about you", !!(tech?.headline?.trim() && tech?.bio?.trim())],
    ["Skills and experience", !!(tech?.city?.trim() && (tech?.skills || []).length && tech?.years_experience != null)],
    ["At least one certification", certs > 0],
    ["Site photos (3 to 10)", photos >= MIN_SITE],
  ];
  const optional = [["CV uploaded (recommended)", !!cv]];
  return finish(items, optional);
}

export function companyProgress({ company, photos }) {
  const items = [
    ["Logo", !!company?.logo_url],
    ["Company name and city", !!(company?.name?.trim() && company?.city?.trim())],
    ["About your company", !!company?.description?.trim() && (company?.services || []).length > 0],
    ["Site photos (3 to 10)", photos >= MIN_SITE],
  ];
  return finish(items, []);
}

function finish(items, optional) {
  const done = items.filter((i) => i[1]).length;
  return {
    items: [...items, ...optional],
    required: items,
    percent: Math.round((done / items.length) * 100),
    complete: done === items.length,
    next: items.find((i) => !i[1])?.[0] || null,
  };
}
