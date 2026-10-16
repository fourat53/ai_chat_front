import styles from "./loader.module.css"

interface MainLoaderProps {
  className?: string
  scale?: "small" | "medium" | "large"
  fixed?: boolean
}

export default function MainLoader({
  className = "",
  scale = "medium",
  fixed = false,
}: MainLoaderProps) {
  const scaleStyles = {
    small: "scale-75",
    medium: "scale-100",
    large: "scale-150",
  }

  const fixedClasses = fixed ? "fixed inset-0 flex items-center justify-center z-50" : ""

  const loaderElement = <span className={`${styles.loader} ${scaleStyles[scale]} ${className}`} />

  if (fixed) {
    return <div className={fixedClasses}>{loaderElement}</div>
  }

  return loaderElement
}
