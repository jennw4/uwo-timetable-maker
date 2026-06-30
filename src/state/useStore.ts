import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Course } from "../data/schema";
import type { PreparedCourse } from "../lib/generate";

const sectionKey = (type: string, section: string) => `${type}/${section}`;

interface SelectionState {
  selectedCodes: string[];
  /** courseCode -> component types the user turned OFF (not required). */
  disabledComponents: Record<string, string[]>;
  /** courseCode -> "type/section" keys the user turned OFF. */
  disabledSections: Record<string, string[]>;

  addCourse: (code: string) => void;
  removeCourse: (code: string) => void;
  clearAll: () => void;

  isComponentEnabled: (code: string, type: string) => boolean;
  toggleComponent: (code: string, type: string) => void;

  isSectionEnabled: (code: string, type: string, section: string) => boolean;
  toggleSection: (code: string, type: string, section: string) => void;
  setAllSections: (code: string, type: string, sections: string[], enabled: boolean) => void;
}

export const useStore = create<SelectionState>()(
  persist(
    (set, get) => ({
      selectedCodes: [],
      disabledComponents: {},
      disabledSections: {},

      addCourse: (code) =>
        set((s) =>
          s.selectedCodes.includes(code)
            ? s
            : { selectedCodes: [...s.selectedCodes, code] },
        ),

      removeCourse: (code) =>
        set((s) => {
          const { [code]: _c, ...comps } = s.disabledComponents;
          const { [code]: _s, ...secs } = s.disabledSections;
          return {
            selectedCodes: s.selectedCodes.filter((c) => c !== code),
            disabledComponents: comps,
            disabledSections: secs,
          };
        }),

      clearAll: () =>
        set({ selectedCodes: [], disabledComponents: {}, disabledSections: {} }),

      isComponentEnabled: (code, type) =>
        !(get().disabledComponents[code] ?? []).includes(type),

      toggleComponent: (code, type) =>
        set((s) => {
          const cur = s.disabledComponents[code] ?? [];
          const next = cur.includes(type)
            ? cur.filter((t) => t !== type)
            : [...cur, type];
          return { disabledComponents: { ...s.disabledComponents, [code]: next } };
        }),

      isSectionEnabled: (code, type, section) =>
        !(get().disabledSections[code] ?? []).includes(sectionKey(type, section)),

      toggleSection: (code, type, section) =>
        set((s) => {
          const key = sectionKey(type, section);
          const cur = s.disabledSections[code] ?? [];
          const next = cur.includes(key)
            ? cur.filter((k) => k !== key)
            : [...cur, key];
          return { disabledSections: { ...s.disabledSections, [code]: next } };
        }),

      setAllSections: (code, type, sections, enabled) =>
        set((s) => {
          const keys = sections.map((sec) => sectionKey(type, sec));
          const cur = s.disabledSections[code] ?? [];
          const next = enabled
            ? cur.filter((k) => !keys.includes(k)) // enable all => remove from disabled
            : Array.from(new Set([...cur, ...keys])); // disable all
          return { disabledSections: { ...s.disabledSections, [code]: next } };
        }),
    }),
    { name: "timetable-maker-selection" },
  ),
);

/**
 * Reduce the full selected courses to PreparedCourse[] honoring the enable/disable
 * state: drop disabled components, keep only enabled sections within required ones.
 */
export function prepareCourses(
  selected: Course[],
  state: Pick<SelectionState, "disabledComponents" | "disabledSections">,
): PreparedCourse[] {
  return selected.map((course) => {
    const disabledComps = state.disabledComponents[course.code] ?? [];
    const disabledSecs = state.disabledSections[course.code] ?? [];
    const components = course.components
      .filter((c) => !disabledComps.includes(c.type))
      .map((c) => ({
        type: c.type,
        sections: c.sections.filter(
          (s) => !disabledSecs.includes(sectionKey(c.type, s.section)),
        ),
      }));
    return { code: course.code, name: course.name, components };
  });
}
