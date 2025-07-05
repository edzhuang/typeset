import { z } from "zod";

export const projectFormSchema = z.object({
  title: z.string().min(1).max(50),
});
