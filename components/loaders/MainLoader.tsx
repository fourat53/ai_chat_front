import { cn } from "@/lib/utils";
import styles from "./MainLoader.module.css";

export default function MainLoader({
	className,
	parentClass,
}: {
	className?: string;
	parentClass?: string;
}) {
	return (
		<div
			className={cn(
				"flex items-center justify-center w-full h-full",
				parentClass,
			)}
		>
			<div className={cn(styles.loader, className)} />
		</div>
	);
}
