"use server";

import { ProviderModel } from "@/models/provider.model";
import {
  Provider,
  // , ProviderBody
} from "@/types/provider.type";
import { connectDB } from "@/lib/db";

// const PROVIDERS: ProviderBody[] = [
//   { label: "nvidia", name: "NVIDIA" },
//   { label: "lm-studio", name: "LM Studio" },
//   { label: "local-ollama", name: "Local Ollama" },
//   { label: "cloud-ollama", name: "Cloud Ollama" },
//   { label: "openai", name: "OpenAI" },
//   { label: "gemini", name: "Gemini" },
//   { label: "openrouter", name: "OpenRouter" },
// ] as const;

// export async function seed(): Promise<Provider[]> {
//   await connectDB();

//   await ProviderModel.deleteMany({});
//   console.log("Cleared existing providers.");

//   const createdProviders = await ProviderModel.insertMany(PROVIDERS);

//   const serialized = JSON.parse(JSON.stringify(createdProviders));
//   return serialized.map((p: { _id: string; [key: string]: unknown }) => ({
//     ...p,
//     id: p._id,
//   })) as Provider[];
// }

export async function getProviders(): Promise<Provider[]> {
  await connectDB();
  const providers = await ProviderModel.find({}, {}).lean();
  const serialized = JSON.parse(JSON.stringify(providers));
  return serialized.map((p: { _id: string; [key: string]: unknown }) => ({
    ...p,
    id: p._id,
  })) as Provider[];
}
