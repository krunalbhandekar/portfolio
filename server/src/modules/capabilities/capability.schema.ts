import { z } from "zod";
import { requiredText, slugList, text } from "../shared/fields.js";

export const capabilityInput = z.object({
  name: requiredText(80),
  description: text(400),
  relatedSkills: slugList(20),
});
