import type { Timetable } from "../lib/generate";
import { courseColor } from "../lib/color";
import { DAY_CODES, DAY_LABELS, formatMinutes, type DayCode } from "../lib/time";

const SLOT = 30; // minutes per row
const ROW_PX = 16; // pixel height per slot

function hourFloor(min: number) {
  return Math.floor(min / 60) * 60;
}
function hourCeil(min: number) {
  return Math.ceil(min / 60) * 60;
}

export function TimetableGrid({ tt, index }: { tt: Timetable; index: number }) {
  // Time bounds from the actual classes, padded to whole hours (fallback 8:00–18:00).
  let lo = Infinity;
  let hi = -Infinity;
  for (const b of tt.blocks) {
    if (b.startMin < lo) lo = b.startMin;
    if (b.endMin > hi) hi = b.endMin;
  }
  if (!isFinite(lo)) {
    lo = 8 * 60;
    hi = 18 * 60;
  }
  const startMin = hourFloor(lo);
  const endMin = hourCeil(hi);
  const slots = Math.max(1, (endMin - startMin) / SLOT);

  // Weekdays always shown; weekend days only if used.
  const weekendUsed = new Set(tt.blocks.map((b) => b.day));
  const days: DayCode[] = DAY_CODES.filter(
    (d) =>
      d === "Mo" ||
      d === "Tu" ||
      d === "We" ||
      d === "Th" ||
      d === "Fr" ||
      weekendUsed.has(d),
  );

  const hourLines = [];
  for (let m = startMin; m <= endMin; m += 60) {
    hourLines.push(m);
  }

  return (
    <div className="tt">
      <div className="tt-title">Timetable #{index + 1}</div>
      <div
        className="tt-grid"
        style={{
          gridTemplateColumns: `48px repeat(${days.length}, 1fr)`,
          gridTemplateRows: `22px repeat(${slots}, ${ROW_PX}px)`,
        }}
      >
        {/* corner */}
        <div className="tt-corner" />
        {/* day headers */}
        {days.map((d, i) => (
          <div
            key={d}
            className="tt-day-head"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            {DAY_LABELS[d]}
          </div>
        ))}

        {/* hour labels + horizontal lines */}
        {hourLines.map((m) => {
          const row = (m - startMin) / SLOT + 2;
          return (
            <div
              key={`h${m}`}
              className="tt-hour-label"
              style={{ gridColumn: 1, gridRow: row }}
            >
              {formatMinutes(m)}
            </div>
          );
        })}

        {/* background cells for grid lines */}
        {days.map((_, ci) =>
          Array.from({ length: slots }).map((__, ri) => (
            <div
              key={`bg-${ci}-${ri}`}
              className={`tt-cell ${ri % 2 === 1 ? "tt-cell-half" : ""}`}
              style={{ gridColumn: ci + 2, gridRow: ri + 2 }}
            />
          )),
        )}

        {/* class blocks */}
        {tt.sections.flatMap((p) =>
          p.blocks.map((b, bi) => {
            const ci = days.indexOf(b.day);
            if (ci < 0) return null;
            const rowStart = (b.startMin - startMin) / SLOT + 2;
            const rowEnd = (b.endMin - startMin) / SLOT + 2;
            const color = courseColor(p.courseCode);
            return (
              <div
                key={`${p.courseCode}-${p.componentType}-${p.section.section}-${bi}`}
                className="tt-block"
                style={{
                  gridColumn: ci + 2,
                  gridRow: `${rowStart} / ${rowEnd}`,
                  background: color.bg,
                  borderColor: color.border,
                }}
                title={`${p.courseCode} ${p.componentType} ${p.section.section}\n${p.section.instructor}\n${formatMinutes(
                  b.startMin,
                )}–${formatMinutes(b.endMin)}${
                  b.location ? `\n${b.location}` : ""
                }`}
              >
                <span className="tt-block-code">{p.courseCode}</span>
                <span className="tt-block-comp">
                  {p.componentType} {p.section.section}
                </span>
                {b.location && <span className="tt-block-loc">{b.location}</span>}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
