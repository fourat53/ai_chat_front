type Provider = {
	id: string;
	name: string;
	baseUrl: string;
};

const PROVIDERS: Provider[] = [
	{
		id: "openrouter",
		name: "OpenRouter",
		baseUrl: "https://openrouter.ai/api/v1",
	},
	{
		id: "cloud-ollama",
		name: "Cloud Ollama",
		baseUrl: "https://ollama.com/v1",
	},
	{
		id: "openai",
		name: "OpenAI",
		baseUrl: "https://api.openai.com/v1",
	},
	{
		id: "nvidia",
		name: "NVIDIA",
		baseUrl: "https://integrate.api.nvidia.com/v1",
	},
	{
		id: "gemini",
		name: "Gemini",
		baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
	},
	// {
	// 	id: "local-ollama",
	// 	name: "Local Ollama",
	// 	baseUrl: "http://localhost:11434/v1",
	// },
	// {
	// 	id: "lm-studio",
	// 	name: "LM Studio",
	// 	baseUrl: "http://localhost:1234/v1",
	// },
];

export { PROVIDERS, type Provider };
