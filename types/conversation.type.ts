import { z } from "zod"
import { message } from "./message.type"

const conversation = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  providerId: z.string(),
  modelId: z.string(),
  messages: z.array(message).optional(),
})

type Conversation = z.infer<typeof conversation>
type ConversationBody = Omit<Conversation, "id">

export { type Conversation, type ConversationBody, conversation }
