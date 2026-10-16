import { z } from "zod"
import { model } from "./model.type"

const provider = z.object({
  id: z.string(),
  label: z.string(),
  name: z.string(),
  models: z.array(model).optional(),
})

type Provider = z.infer<typeof provider>
type ProviderBody = Omit<Provider, "id">

export { type Provider, type ProviderBody, provider }
