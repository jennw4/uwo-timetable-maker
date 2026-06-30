import { describe, expect, it } from "vitest";
import { blocksConflict, meetingToBlock } from "./time";
import {
  buildCourseOptions,
  generateTimetables,
  type PreparedCourse,
} from "./generate";
import type { Section } from "../data/schema";

function section(
  name: string,
  instructor: string,
  meetings: { day: any; start: string; end: string }[],
): Section {
  return {
    section: name,
    classNbr: "",
    instructor,
    campus: "",
    deliveryType: "",
    status: "",
    meetings: meetings.map((m) => ({ ...m, location: "" })),
  };
}

describe("time overlap", () => {
  it("detects same-day overlap", () => {
    const a = meetingToBlock({ day: "Mo", start: "09:00", end: "10:00", location: "" });
    const b = meetingToBlock({ day: "Mo", start: "09:30", end: "10:30", location: "" });
    expect(blocksConflict(a, b)).toBe(true);
  });

  it("back-to-back classes do not conflict", () => {
    const a = meetingToBlock({ day: "Mo", start: "09:00", end: "10:00", location: "" });
    const b = meetingToBlock({ day: "Mo", start: "10:00", end: "11:00", location: "" });
    expect(blocksConflict(a, b)).toBe(false);
  });

  it("different days never conflict", () => {
    const a = meetingToBlock({ day: "Mo", start: "09:00", end: "10:00", location: "" });
    const b = meetingToBlock({ day: "Tu", start: "09:00", end: "10:00", location: "" });
    expect(blocksConflict(a, b)).toBe(false);
  });
});

describe("buildCourseOptions — instructor bundling", () => {
  it("1 LEC + 2 LABs (same instructor) => 2 options", () => {
    const course: PreparedCourse = {
      code: "ECE 2238A",
      name: "Test",
      components: [
        { type: "LEC", sections: [section("001", "R. Rao", [{ day: "Mo", start: "09:00", end: "10:00" }])] },
        {
          type: "LAB",
          sections: [
            section("007", "R. Rao", [{ day: "Tu", start: "09:00", end: "10:00" }]),
            section("008", "R. Rao", [{ day: "We", start: "09:00", end: "10:00" }]),
          ],
        },
      ],
    };
    const { options, error } = buildCourseOptions(course);
    expect(error).toBeUndefined();
    expect(options).toHaveLength(2);
  });

  it("excludes cross-instructor combinations", () => {
    const course: PreparedCourse = {
      code: "X 100",
      name: "Test",
      components: [
        {
          type: "LEC",
          sections: [
            section("001", "Rao", [{ day: "Mo", start: "09:00", end: "10:00" }]),
            section("002", "Smith", [{ day: "Mo", start: "11:00", end: "12:00" }]),
          ],
        },
        {
          type: "TUT",
          sections: [
            section("004", "Rao", [{ day: "Tu", start: "09:00", end: "10:00" }]),
            section("005", "Smith", [{ day: "Tu", start: "11:00", end: "12:00" }]),
          ],
        },
      ],
    };
    const { options } = buildCourseOptions(course);
    // Only Rao+Rao and Smith+Smith — not the 2 mixed combos.
    expect(options).toHaveLength(2);
    for (const o of options) {
      const names = new Set(o.sections.map((s) => s.section.instructor));
      expect(names.size).toBe(1);
    }
  });

  it("LEC-only course yields one option per LEC", () => {
    const course: PreparedCourse = {
      code: "AH 2634G",
      name: "Indigenous Women's Art",
      components: [
        {
          type: "LEC",
          sections: [
            section("001", "A", [{ day: "Mo", start: "09:00", end: "10:00" }]),
            section("002", "B", [{ day: "Tu", start: "09:00", end: "10:00" }]),
          ],
        },
      ],
    };
    const { options } = buildCourseOptions(course);
    expect(options).toHaveLength(2);
  });

  it("treats a blank/'.' instructor as a wildcard that bundles with anyone", () => {
    // ADS-style: named LEC instructor + lab with placeholder instructor ".".
    const course: PreparedCourse = {
      code: "ADS 3864B",
      name: "Test",
      components: [
        { type: "LEC", sections: [section("570", "L. Murray", [{ day: "Mo", start: "11:30", end: "12:30" }])] },
        { type: "LAB", sections: [section("571", ".", [{ day: "We", start: "15:30", end: "17:30" }])] },
      ],
    };
    const { options, error } = buildCourseOptions(course);
    expect(error).toBeUndefined();
    expect(options).toHaveLength(1);
    expect(options[0].sections).toHaveLength(2);
  });

  it("reports an error when no instructor has a complete set", () => {
    const course: PreparedCourse = {
      code: "Y 200",
      name: "Test",
      components: [
        { type: "LEC", sections: [section("001", "Rao", [{ day: "Mo", start: "09:00", end: "10:00" }])] },
        { type: "LAB", sections: [section("007", "Smith", [{ day: "Tu", start: "09:00", end: "10:00" }])] },
      ],
    };
    const { options, error } = buildCourseOptions(course);
    expect(options).toHaveLength(0);
    expect(error).toMatch(/complete set/);
  });
});

describe("generateTimetables — cross-course combinations", () => {
  const courseA: PreparedCourse = {
    code: "A 100",
    name: "A",
    components: [
      {
        type: "LEC",
        sections: [
          section("001", "x", [{ day: "Mo", start: "09:00", end: "10:00" }]),
          section("002", "y", [{ day: "Mo", start: "10:00", end: "11:00" }]),
        ],
      },
    ],
  };

  it("produces the cartesian product when nothing conflicts", () => {
    const courseB: PreparedCourse = {
      code: "B 100",
      name: "B",
      components: [
        {
          type: "LEC",
          sections: [
            section("001", "x", [{ day: "Tu", start: "09:00", end: "10:00" }]),
            section("002", "y", [{ day: "Tu", start: "10:00", end: "11:00" }]),
          ],
        },
      ],
    };
    const result = generateTimetables([courseA, courseB]);
    expect(result.total).toBe(4); // 2 x 2
    expect(result.truncated).toBe(false);
  });

  it("prunes conflicting cross-course pairs", () => {
    // courseC LEC 001 collides with courseA LEC 001 (Mon 9-10).
    const courseC: PreparedCourse = {
      code: "C 100",
      name: "C",
      components: [
        {
          type: "LEC",
          sections: [
            section("001", "x", [{ day: "Mo", start: "09:00", end: "10:00" }]),
            section("002", "y", [{ day: "Mo", start: "11:00", end: "12:00" }]),
          ],
        },
      ],
    };
    const result = generateTimetables([courseA, courseC]);
    // A001+C001 conflict (Mon 9-10). Remaining valid: A001+C002, A002+C001, A002+C002 = 3.
    expect(result.total).toBe(3);
  });

  it("honors the limit and flags truncation", () => {
    const result = generateTimetables([courseA], 1);
    expect(result.total).toBe(1);
    expect(result.truncated).toBe(true);
  });
});
