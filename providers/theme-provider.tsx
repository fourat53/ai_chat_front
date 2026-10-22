import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { ThemeProvider as WrkszThemesProvider } from "@wrksz/themes/next";
import type { ComponentPropsWithoutRef, JSX } from "react";

export type ThemesType = {
	mode: "light" | "dark" | "system";
	icon: JSX.Element;
};

export const themes: ThemesType[] = [
	{ mode: "light", icon: <IconSun /> },
	{ mode: "dark", icon: <IconMoon /> },
	{ mode: "system", icon: <IconDeviceDesktop /> },
];

type ThemeProviderProps = ComponentPropsWithoutRef<typeof WrkszThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return (
		<WrkszThemesProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
			storage="localStorage"
			{...props}
		>
			{children}
		</WrkszThemesProvider>
	);
}
