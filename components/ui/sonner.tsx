"use client";

import {
	IconAlertOctagon,
	IconAlertTriangle,
	IconCircleCheck,
	IconInfoCircle,
	IconLoader,
} from "@tabler/icons-react";
import { useTheme } from "@wrksz/themes/client";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { resolvedTheme } = useTheme();

	return (
		<Sonner
			theme={resolvedTheme as ToasterProps["theme"]}
			className="toaster group"
			icons={{
				success: <IconCircleCheck className="size-4 text-green-500" />,
				info: <IconInfoCircle className="size-4 text-blue-500" />,
				warning: <IconAlertTriangle className="size-4 text-yellow-500" />,
				error: <IconAlertOctagon className="size-4 text-red-500" />,
				loading: <IconLoader className="size-4 animate-spin text-mist-500" />,
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					toast: "cn-toast",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
