import { z } from "zod";

const model = z.object({
	id: z.string(),
	name: z.string(),
	providerId: z.string(),
	description: z.string().optional(),
});

type Model = z.infer<typeof model>;
type ModelBody = Omit<Model, "id">;

export { type Model, type ModelBody, model };
