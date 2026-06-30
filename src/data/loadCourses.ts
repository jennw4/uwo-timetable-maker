import { courseSchema, type Course } from "./schema";

/**
 * Auto-discovers every JSON file under ./courses/ at build time and validates it.
 * To add a course, just drop a new <name>.json file in that folder.
 */
const modules = import.meta.glob<unknown>("./courses/*.json", { eager: true });

export interface CourseLoadError {
  file: string;
  message: string;
}

const courses: Course[] = [];
const errors: CourseLoadError[] = [];

for (const [path, mod] of Object.entries(modules)) {
  // JSON modules are exposed via `default`.
  const raw = (mod as { default: unknown }).default;
  const result = courseSchema.safeParse(raw);
  if (result.success) {
    courses.push(result.data);
  } else {
    const message = result.error.issues
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    errors.push({ file: path, message });
    // Surface bad data loudly during development instead of silently dropping it.
    console.error(`[loadCourses] Invalid course file ${path}: ${message}`);
  }
}

courses.sort((a, b) => a.code.localeCompare(b.code));

export const allCourses: Course[] = courses;
export const loadErrors: CourseLoadError[] = errors;
