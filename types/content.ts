import { z } from "zod";

export const topicSchema = z.object({ topic: z.string().trim().min(1).max(200) });

export const contentIdeaSchema = z.object({
  title: z.string(),
  hook: z.string(),
  summary: z.string(),
  format: z.string(),
  target: z.string(),
});

export const contentResponseSchema = z.object({
  ideas: z.array(contentIdeaSchema).length(3),
});

export type ContentIdea = z.infer<typeof contentIdeaSchema>;
