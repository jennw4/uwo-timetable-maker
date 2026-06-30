# Timetable Maker

A small React web app that takes your courses and generates **every conflict-free
timetable**, shown as scrollable week-grid calendars. Inspired by the (now out of
date) [Western Timetable Maker](https://western.ttmaker.ca/).

No backend — everything runs in the browser, so it deploys as a static site.

## How it works

1. **Course data lives in the repo** as JSON files under
   [`src/data/courses/`](src/data/courses/). Each file is one course. The app
   auto-discovers them (`import.meta.glob`) and validates them with
   [zod](src/data/schema.ts) at load time; invalid files show an error banner
   instead of breaking the app.
2. **Search & add** courses, then **toggle** whole components or individual
   sections on/off.
3. The app generates all conflict-free combinations live and lists them.

### Bundling rule

Within a single course, the chosen **LEC / TUT / LAB must share the same
instructor** (the instructor is the "stream" key). Examples:

- LEC-only course → one timetable option per lecture.
- LEC + LAB → one of each, same instructor.
- 1 LEC + 2 labs for the same instructor → 2 options.

A blank / `.` / `TBA` / `Staff` instructor is treated as a **wildcard** that
bundles with anyone (common for labs with no listed instructor). Instructor
matching is scoped to a single course, so a prof who teaches multiple courses is
never matched across them.

If no instructor in a course has a complete set of the required components, the app
tells you (rather than silently producing zero timetables). Example: in the
included `ECE 2238A` sample, R. Rao's LEC 001 and TUT 004 are both Thu 1:30–2:30,
so with LEC+TUT+LAB all required there's no valid R. Rao stream — uncheck the TUT
component (or fix the data) to see options.

## Adding a course

1. Screenshot the course in the Western timetable.
2. Use [`SCRAPER_PROMPT.md`](SCRAPER_PROMPT.md) with any AI to turn the screenshot
   into JSON ([`course.schema.json`](course.schema.json) is the formal schema).
3. Save it as `src/data/courses/<anything>.json`.
4. Refresh `npm run dev` — the course appears in search.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run test     # vitest — generation/conflict/bundling logic
npm run build    # static production bundle in dist/
```

## Project layout

| Path | What |
| --- | --- |
| `src/data/schema.ts` | zod schema + inferred TS types (source of truth) |
| `src/data/loadCourses.ts` | auto-load + validate course JSON |
| `src/data/courses/` | the course data files |
| `src/lib/time.ts` | time parsing + interval-overlap conflict checks |
| `src/lib/generate.ts` | instructor bundling + backtracking timetable generation |
| `src/lib/generate.test.ts` | tests for the above |
| `src/state/useStore.ts` | zustand store (selection + toggles, persisted) |
| `src/components/` | CoursePicker, CourseCard, TimetableGrid, Results |
