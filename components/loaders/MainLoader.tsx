import { cn } from "@/lib/utils";
import styles from "./MainLoader.module.css";

export default function MainLoader({ className }: { className?: string }) {
	return (
		<div className="flex items-center justify-center w-full h-full">
			<div className={cn(styles.loader, className)} />
		</div>
	);
}
