"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { type ThemesType, themes } from "@/providers/theme-provider";
import { Button } from "../ui/button";

export default function ThemeSwitch({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"z-50 flex items-center gap-1 rounded-full border p-1 bg-card",
				className,
			)}
		>
			{themes.map((t: ThemesType) => (
				<ThemeButton key={t.mode} t={t} />
			))}
		</div>
	);
}

function ThemeButton({ t }: { t: ThemesType }) {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const id = setTimeout(() => setMounted(true), 0);
		return () => clearTimeout(id);
	}, []);

	return (
		<Button
			variant="outline"
			icon={t.icon}
			className={cn(
				"rounded-full p-1 size-8",
				mounted &&
					theme === t.mode &&
					"bg-primary text-white hover:bg-primary hover:text-white",
			)}
			onClick={() => setTheme(t.mode)}
		/>
	);
}
