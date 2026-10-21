import styles from "./loader.module.css";

interface MainLoaderProps {
	className?: string;
	scale?: "small" | "medium" | "large";
}

export default function MainLoader({
	className = "",
	scale = "medium",
}: MainLoaderProps) {
	const scaleStyles = {
		small: "scale-75",
		medium: "scale-100",
		large: "scale-150",
	};
	return (
		<span className={`${styles.loader} ${scaleStyles[scale]} ${className}`} />
	);
}
