import type { Section } from "../data/schema";
import { anyConflict, meetingToBlock, type TimeBlock } from "./time";

/** One concrete section placed in a timetable, with its meeting blocks precomputed. */
export interface PlacedSection {
  courseCode: string;
  courseName: string;
  componentType: string;
  section: Section;
  blocks: TimeBlock[];
}

/** A complete, instructor-consistent choice for ONE course (one section per required component). */
export interface CourseOption {
  courseCode: string;
  instructor: string;
  sections: PlacedSection[];
  blocks: TimeBlock[];
}

/** A full timetable: one option per selected course, mutually conflict-free. */
export interface Timetable {
  options: CourseOption[];
  sections: PlacedSection[];
  blocks: TimeBlock[];
}

/**
 * A course reduced to what the user actually wants to schedule:
 *  - only the components they require (disabled components are dropped before this)
 *  - only the sections they left enabled
 * An enabled component with zero enabled sections is kept (empty) so we can report it.
 */
export interface PreparedCourse {
  code: string;
  name: string;
  components: { type: string; sections: Section[] }[];
}

export interface CourseOptionsResult {
  options: CourseOption[];
  error?: string;
}

function sectionBlocks(s: Section): TimeBlock[] {
  return s.meetings.map(meetingToBlock);
}

/** Blank / placeholder ("." or "TBA") instructors bundle with anyone. */
function isWildcardInstructor(instructor: string): boolean {
  const t = instructor.trim().toLowerCase();
  return t === "" || t === "." || t === "tba" || t === "staff";
}

function cartesian<T>(lists: T[][]): T[][] {
  return lists.reduce<T[][]>(
    (acc, list) => acc.flatMap((combo) => list.map((item) => [...combo, item])),
    [[]],
  );
}

/**
 * Build every valid course-option for a single course.
 * Bundling: all chosen sections must share one instructor (grouping is scoped to
 * THIS course, so an instructor who also teaches other courses is never matched
 * across courses). A valid option includes exactly one section for every required
 * component type the course has.
 */
export function buildCourseOptions(course: PreparedCourse): CourseOptionsResult {
  const requiredTypes = course.components;

  if (requiredTypes.length === 0) {
    return { options: [], error: `${course.code}: no components selected.` };
  }

  // A required component with no enabled sections can never be satisfied.
  const empty = requiredTypes.find((c) => c.sections.length === 0);
  if (empty) {
    return {
      options: [],
      error: `${course.code}: all ${empty.type} sections are disabled — enable one or turn off the ${empty.type} component.`,
    };
  }

  // Named (non-wildcard) instructors define the streams. If none are named,
  // the whole course is one free stream (any section combines with any).
  const named = new Set<string>();
  for (const comp of requiredTypes) {
    for (const s of comp.sections) {
      if (!isWildcardInstructor(s.instructor)) named.add(s.instructor.trim());
    }
  }
  const streams = named.size === 0 ? [""] : [...named];

  const options: CourseOption[] = [];

  for (const instructor of streams) {
    // For each required component, the sections this stream can use:
    // the stream's own instructor plus any wildcard (blank/TBA) sections.
    const perType = requiredTypes.map((comp) => ({
      type: comp.type,
      sections: comp.sections.filter((s) =>
        named.size === 0
          ? true
          : s.instructor.trim() === instructor || isWildcardInstructor(s.instructor),
      ),
    }));

    // Instructor must cover every required component type, else no complete stream.
    if (perType.some((t) => t.sections.length === 0)) continue;

    const combos = cartesian(perType.map((t) => t.sections));

    for (const combo of combos) {
      const placed: PlacedSection[] = combo.map((section, i) => ({
        courseCode: course.code,
        courseName: course.name,
        componentType: perType[i].type,
        section,
        blocks: sectionBlocks(section),
      }));

      // Drop options that conflict with themselves (e.g. a LEC overlapping its own TUT).
      const blocks: TimeBlock[] = [];
      let selfConflict = false;
      for (const p of placed) {
        if (anyConflict(blocks, p.blocks)) {
          selfConflict = true;
          break;
        }
        blocks.push(...p.blocks);
      }
      if (selfConflict) continue;

      options.push({ courseCode: course.code, instructor, sections: placed, blocks });
    }
  }

  if (options.length === 0) {
    return {
      options: [],
      error: `${course.code}: no instructor has a complete set of the required components (${requiredTypes
        .map((c) => c.type)
        .join(" + ")}). Check the data or disable a component.`,
    };
  }

  return { options };
}

export interface GenerationResult {
  timetables: Timetable[];
  /** Number of timetables found (may be capped — see `truncated`). */
  total: number;
  truncated: boolean;
  /** Per-course problems that prevented any option (e.g. all sections disabled). */
  courseErrors: { courseCode: string; message: string }[];
}

/**
 * Generate conflict-free timetables across all prepared courses via backtracking.
 * Stops collecting once `limit` timetables are found (sets `truncated`).
 */
export function generateTimetables(
  courses: PreparedCourse[],
  limit = 5000,
): GenerationResult {
  const courseErrors: { courseCode: string; message: string }[] = [];
  const optionLists: CourseOption[][] = [];

  for (const course of courses) {
    const { options, error } = buildCourseOptions(course);
    if (error) courseErrors.push({ courseCode: course.code, message: error });
    if (options.length === 0) {
      // This course can't be scheduled; no timetable is possible.
      return { timetables: [], total: 0, truncated: false, courseErrors };
    }
    optionLists.push(options);
  }

  if (optionLists.length === 0) {
    return { timetables: [], total: 0, truncated: false, courseErrors };
  }

  const timetables: Timetable[] = [];
  let truncated = false;

  const chosen: CourseOption[] = [];
  const blocks: TimeBlock[] = [];

  const recurse = (depth: number): void => {
    if (truncated) return;
    if (depth === optionLists.length) {
      const sections = chosen.flatMap((o) => o.sections);
      timetables.push({ options: [...chosen], sections, blocks: [...blocks] });
      if (timetables.length >= limit) truncated = true;
      return;
    }
    for (const option of optionLists[depth]) {
      if (anyConflict(blocks, option.blocks)) continue;
      chosen.push(option);
      const added = option.blocks.length;
      blocks.push(...option.blocks);
      recurse(depth + 1);
      blocks.length -= added;
      chosen.pop();
      if (truncated) return;
    }
  };

  recurse(0);

  return { timetables, total: timetables.length, truncated, courseErrors };
}
