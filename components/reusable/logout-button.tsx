"use client";

import { IconLogout } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function LogoutButton({
	className,
	variant = "default",
}: {
	className?: string;
	variant?: string;
}) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const logout = async () => {
		setLoading(true);
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					router.refresh();
				},
			},
		});
	};

	return (
		<Button
			className={cn(variant === "icon" && "size-9 rounded-xl", className)}
			loading={loading}
			onClick={logout}
		>
			{variant === "default" ? "Logout" : !loading && <IconLogout />}
		</Button>
	);
}
