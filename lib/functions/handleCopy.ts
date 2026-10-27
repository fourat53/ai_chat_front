import { toast } from "sonner";

export default async function handleCopy(text: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard.");
	} catch (error) {
		console.error("Failed to copy text:", error);
		toast.error("Failed to copy to clipboard.");
	}
}
