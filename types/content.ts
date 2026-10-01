import { z } from "zod";

export const platformSchema = z.enum(["instagram", "threads"]);
export const accountSchema = z.enum([
  "draw_boni",
  "moni_moneylog",
  "ttoni_on",
]);

export type ContentAccount = z.infer<typeof accountSchema>;

export const topicSchema = z.object({
  topic: z.string().trim().min(1).max(200),
  platform: platformSchema,
  account: accountSchema,
  angle: z.string().trim().max(500).optional(),
});

export type ContentPlatform = z.infer<typeof platformSchema>;

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
