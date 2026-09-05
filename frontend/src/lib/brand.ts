import type { Settings } from "./types";

export const ACADEMY_NAME = "Horseed Academy Model for Science and Languages";
export const ACADEMY_SHORT_NAME = "Horseed Academy";
export const ACADEMY_TAGLINE = "Achievement Through Learning";
export const ACADEMY_MOTTO = "Knowledge | Discipline | Excellence";

export const ACADEMY_SETTINGS = {
  schoolName: ACADEMY_NAME,
  schoolShortName: ACADEMY_SHORT_NAME,
  tagline: ACADEMY_TAGLINE,
} as const;

export function withAcademyBrand(settings: Settings): Settings {
  return {
    ...settings,
    schoolName: ACADEMY_NAME,
    schoolShortName: ACADEMY_SHORT_NAME,
    tagline: ACADEMY_TAGLINE,
  };
}
