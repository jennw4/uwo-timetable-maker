import { useMemo, useState } from "react";
import type { Course } from "../data/schema";
import { useStore } from "../state/useStore";

export function CoursePicker({ courses }: { courses: Course[] }) {
  const [query, setQuery] = useState("");
  const selectedCodes = useStore((s) => s.selectedCodes);
  const addCourse = useStore((s) => s.addCourse);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return courses
      .filter((c) => !selectedCodes.includes(c.code))
      .filter(
        (c) =>
          c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [query, courses, selectedCodes]);

  return (
    <div className="course-picker">
      <input
        type="text"
        className="search-input"
        placeholder="Search course code or name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.length > 0 && (
        <ul className="search-results">
          {matches.map((c) => (
            <li key={c.code}>
              <button
                className="search-result"
                onClick={() => {
                  addCourse(c.code);
                  setQuery("");
                }}
              >
                <span className="result-code">{c.code}</span>
                <span className="result-name">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
