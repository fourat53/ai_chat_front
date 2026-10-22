import { useTheme } from "@wrksz/themes/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ThemesType, themes } from "@/providers/theme-provider";

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
	return (
		<Button
			variant="outline"
			icon={t.icon}
			className={cn(
				"rounded-full p-1 size-8",
				theme === t.mode &&
					"bg-primary text-white hover:bg-primary hover:text-white",
			)}
			onClick={() => setTheme(t.mode)}
		/>
	);
}
