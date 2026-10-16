import { z } from "zod"

const user = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().optional(),
})

type User = z.infer<typeof user>
type UserBody = Omit<User, "id">

export { type User, type UserBody, user }
