import { z } from "zod";
import {
  httpUrl,
  idList,
  nullableDate,
  nullableMediaRef,
  requiredText,
  slugList,
  stringList,
  text,
} from "../shared/fields.js";

export const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "freelance",
  "internship",
] as const;
export const LOCATION_TYPES = ["onsite", "remote", "hybrid"] as const;

export const experienceInput = z
  .object({
    company: requiredText(100),
    companyUrl: httpUrl,
    companyLogo: nullableMediaRef,
    position: requiredText(100),
    employmentType: z.enum(EMPLOYMENT_TYPES).default("full-time"),
    location: text(80),
    locationType: z.enum(LOCATION_TYPES).default("onsite"),
    startDate: z.coerce.date({ message: "Start date is required" }),
    endDate: nullableDate,
    isCurrent: z.boolean().default(false),
    summary: text(500),
    technologies: slugList(30),
    responsibilities: stringList(20, 300),
    achievements: stringList(20, 300),
    projectIds: idList(30),
  })
  .refine((v) => v.isCurrent || v.endDate === null || v.endDate >= v.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"],
  })
  .transform((v) => (v.isCurrent ? { ...v, endDate: null } : v));
