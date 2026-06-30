import type { Course, Section } from "../data/schema";
import { courseColor } from "../lib/color";
import { DAY_LABELS, formatMinutes, toMinutes } from "../lib/time";
import { useStore } from "../state/useStore";

function sectionTime(s: Section): string {
  if (s.meetings.length === 0) return "TBA / async";
  return s.meetings
    .map(
      (m) =>
        `${DAY_LABELS[m.day]} ${formatMinutes(toMinutes(m.start))}–${formatMinutes(
          toMinutes(m.end),
        )}`,
    )
    .join(", ");
}

export function CourseCard({ course }: { course: Course }) {
  const removeCourse = useStore((s) => s.removeCourse);
  const isComponentEnabled = useStore((s) => s.isComponentEnabled);
  const toggleComponent = useStore((s) => s.toggleComponent);
  const isSectionEnabled = useStore((s) => s.isSectionEnabled);
  const toggleSection = useStore((s) => s.toggleSection);
  const setAllSections = useStore((s) => s.setAllSections);

  const color = courseColor(course.code);

  return (
    <div className="course-card" style={{ borderLeftColor: color.border }}>
      <div className="course-card-head">
        <div>
          <span className="course-card-code">{course.code}</span>
          {course.name && <span className="course-card-name">{course.name}</span>}
        </div>
        <button
          className="link-btn"
          title="Remove course"
          onClick={() => removeCourse(course.code)}
        >
          ✕
        </button>
      </div>

      {course.components.map((comp) => {
        const compEnabled = isComponentEnabled(course.code, comp.type);
        const sectionNames = comp.sections.map((s) => s.section);
        return (
          <div
            key={comp.type}
            className={`component ${compEnabled ? "" : "component-disabled"}`}
          >
            <div className="component-head">
              <label className="component-toggle">
                <input
                  type="checkbox"
                  checked={compEnabled}
                  onChange={() => toggleComponent(course.code, comp.type)}
                />
                <strong>{comp.type}</strong>
                <span className="muted">({comp.sections.length})</span>
              </label>
              {compEnabled && (
                <span className="bulk-actions">
                  <button
                    className="link-btn"
                    onClick={() =>
                      setAllSections(course.code, comp.type, sectionNames, true)
                    }
                  >
                    All
                  </button>
                  <button
                    className="link-btn"
                    onClick={() =>
                      setAllSections(course.code, comp.type, sectionNames, false)
                    }
                  >
                    None
                  </button>
                </span>
              )}
            </div>

            {compEnabled && (
              <ul className="section-list">
                {comp.sections.map((s) => {
                  const enabled = isSectionEnabled(course.code, comp.type, s.section);
                  return (
                    <li key={s.section}>
                      <label className={`section-row ${enabled ? "" : "section-off"}`}>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() =>
                            toggleSection(course.code, comp.type, s.section)
                          }
                        />
                        <span className="section-name">{s.section}</span>
                        <span className="section-instructor">{s.instructor}</span>
                        <span className="section-time">{sectionTime(s)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
