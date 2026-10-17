export default async function handleCopy(text: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(text);
	} catch (error) {
		console.error("Failed to copy text:", error);
	}
}
