"use client";

export function LoaderDots() {
	return (
		<div
			role="status"
			aria-label="Waiting for the model to respond"
			className="flex gap-1.5 items-center py-3 pl-2"
		>
			{[320, 160, 0].map((delay) => (
				<span
					key={delay}
					style={{ animationDelay: `-${delay}ms` }}
					className="size-1.5 sm:size-2 rounded-full bg-muted-foreground/70 animate-bounce animation-duration-[0.8s]"
				/>
			))}
		</div>
	);
}
