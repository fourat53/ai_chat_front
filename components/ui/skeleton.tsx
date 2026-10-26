import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn(
				"w-full animate-pulse bg-muted rounded-sm flex items-center justify-between",
				className,
			)}
			{...props}
		/>
	);
}

export { Skeleton };
