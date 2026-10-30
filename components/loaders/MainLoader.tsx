import { cn } from "@/lib/utils";
import styles from "./MainLoader.module.css";

export default function MainLoader({ className }: { className?: string }) {
	return <span className={cn(styles.loader, className)} />;
}
