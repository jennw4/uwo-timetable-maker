import { useEffect, useState } from "react";
import type { GenerationResult } from "../lib/generate";
import { TimetableGrid } from "./TimetableGrid";

const PAGE = 20; // grids rendered per "Show more" step

export function Results({
  result,
  hasSelection,
}: {
  result: GenerationResult;
  hasSelection: boolean;
}) {
  const [shown, setShown] = useState(PAGE);

  // Reset the render window whenever the result set changes.
  useEffect(() => {
    setShown(PAGE);
  }, [result]);

  const { timetables, total, truncated, courseErrors } = result;

  return (
    <div className="results">
      <div className="panel-head">
        <h2>Results</h2>
      </div>

      {courseErrors.length > 0 && (
        <div className="banner banner-warn">
          {courseErrors.map((e) => (
            <div key={e.courseCode}>{e.message}</div>
          ))}
        </div>
      )}

      {!hasSelection ? (
        <p className="hint">No courses selected yet.</p>
      ) : total === 0 ? (
        courseErrors.length === 0 && (
          <p className="hint">
            No conflict-free timetable exists for this selection. Try disabling some
            sections or removing a course.
          </p>
        )
      ) : (
        <>
          <p className="results-count">
            <strong>
              {truncated ? `${total.toLocaleString()}+` : total.toLocaleString()}
            </strong>{" "}
            conflict-free timetable{total === 1 ? "" : "s"}
            {truncated && " (capped — disable sections to narrow down)"}
          </p>

          <div className="tt-scroll">
            {timetables.slice(0, shown).map((tt, i) => (
              <TimetableGrid key={i} tt={tt} index={i} />
            ))}
          </div>

          {shown < timetables.length && (
            <button className="show-more" onClick={() => setShown((n) => n + PAGE)}>
              Show more ({timetables.length - shown} hidden)
            </button>
          )}
        </>
      )}
    </div>
  );
}
