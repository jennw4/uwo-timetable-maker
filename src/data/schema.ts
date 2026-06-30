import { z } from "zod";

/**
 * Runtime + compile-time source of truth for course data.
 * Every JSON file under src/data/courses/ is validated against `courseSchema`
 * at load time, and the app's TypeScript types are inferred from these schemas.
 */

export const DAY_CODES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
export type DayCode = (typeof DAY_CODES)[number];

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/; // 24-hour "HH:MM"

export const meetingSchema = z.object({
  day: z.enum(DAY_CODES),
  start: z.string().regex(timeRegex, 'time must be 24-hour "HH:MM"'),
  end: z.string().regex(timeRegex, 'time must be 24-hour "HH:MM"'),
  location: z.string().default(""),
});

export const sectionSchema = z.object({
  section: z.string(), // e.g. "001"
  classNbr: z.string().default(""),
  instructor: z.string().default(""), // ** bundling key (scoped to its course) **
  campus: z.string().default(""),
  deliveryType: z.string().default(""),
  status: z.string().default(""),
  waitlist: z.union([z.number(), z.string()]).optional(),
  // Empty meetings => async/TBA: always schedulable, never conflicts.
  meetings: z.array(meetingSchema).default([]),
});

export const componentSchema = z.object({
  type: z.string(), // "LEC" | "TUT" | "LAB" | ... (free string)
  sections: z.array(sectionSchema).min(1),
});

export const courseSchema = z.object({
  code: z.string(), // e.g. "ECE 2238A"
  name: z.string().default(""),
  term: z.string().default(""),
  components: z.array(componentSchema).min(1),
});

export type Meeting = z.infer<typeof meetingSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Component = z.infer<typeof componentSchema>;
export type Course = z.infer<typeof courseSchema>;
