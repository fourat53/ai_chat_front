import { z } from "zod";

const provider = z.object({
	id: z.string(),
	label: z.string(),
	name: z.string(),
	baseUrl: z.string(),
});

type Provider = z.infer<typeof provider>;
type ProviderBody = Omit<Provider, "id">;

export { type Provider, type ProviderBody, provider };
