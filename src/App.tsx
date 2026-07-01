import { useMemo } from "react";
import { allCourses, loadErrors } from "./data/loadCourses";
import { generateTimetables } from "./lib/generate";
import { prepareCourses, useStore } from "./state/useStore";
import { CoursePicker } from "./components/CoursePicker";
import { CourseCard } from "./components/CourseCard";
import { Results } from "./components/Results";

const courseByCode = new Map(allCourses.map((c) => [c.code, c]));

export default function App() {
  const selectedCodes = useStore((s) => s.selectedCodes);
  const disabledComponents = useStore((s) => s.disabledComponents);
  const disabledSections = useStore((s) => s.disabledSections);
  const clearAll = useStore((s) => s.clearAll);

  const selectedCourses = useMemo(
    () => selectedCodes.map((code) => courseByCode.get(code)).filter((c) => c !== undefined),
    [selectedCodes],
  );

  const result = useMemo(() => {
    if (selectedCourses.length === 0) {
      return { timetables: [], total: 0, truncated: false, courseErrors: [] };
    }
    const prepared = prepareCourses(selectedCourses, {
      disabledComponents,
      disabledSections,
    });
    return generateTimetables(prepared);
  }, [selectedCourses, disabledComponents, disabledSections]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>janik's timetable maker</h1>
        <span className="subtitle">
          {allCourses.length} courses installed · conflict-free combinations, ranked by preference
        </span>
          <span className="tagline">
            ✨built with nothing but{" "}
            <a
              href="https://github.com/JanikThePanic/uwo-timetable-maker"
              target="_blank"
              rel="noreferrer"
            >
              vibes
            </a>
            ✨
          </span>
      </header>

      {loadErrors.length > 0 && (
        <div className="banner banner-error">
          <strong>{loadErrors.length} course file(s) failed to load:</strong>
          <ul>
            {loadErrors.map((e) => (
              <li key={e.file}>
                {e.file}: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="layout">
        <section className="panel courses-panel">
          <div className="panel-head">
            <h2>Courses</h2>
            {selectedCodes.length > 0 && (
              <button className="link-btn" onClick={clearAll}>
                Reset
              </button>
            )}
          </div>

          <CoursePicker courses={allCourses} />

          {selectedCourses.length === 0 ? (
            <p className="hint">Add courses above to start building timetables.</p>
          ) : (
            <div className="course-list">
              {selectedCourses.map((course) => (
                <CourseCard key={course.code} course={course} />
              ))}
            </div>
          )}
        </section>

        <section className="panel results-panel">
          <Results result={result} hasSelection={selectedCourses.length > 0} />
        </section>
      </div>
    </div>
  );
}
