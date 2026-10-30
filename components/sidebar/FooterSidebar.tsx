import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/buttons/LogoutButton";
import { Button } from "@/components/ui/button";
import { SidebarFooter } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionType } from "@/lib/auth/auth-client";

export default function FooterSidebar({
	session,
	sessionPending,
}: {
	session: SessionType;
	sessionPending: boolean;
}) {
	return (
		<SidebarFooter className="h-16! px-1">
			{session ? (
				<div className="flex items-center justify-between w-full h-full">
					<div className="flex items-center gap-1.5 justify-start w-full h-full">
						{session.user.image ? (
							<Image
								src={session.user.image}
								alt="User avatar"
								width={200}
								height={200}
								className="border rounded-full size-10"
							/>
						) : (
							session.user.name && (
								<p className="flex items-center justify-center text-base font-bold rounded-full size-9 bg-primary/20 text-primary">
									{session.user.name?.[0].toUpperCase()}
								</p>
							)
						)}
						<span className="text-sm truncate group-data-[collapsible=icon]:hidden">
							{session.user.name || session.user.email}
						</span>
					</div>
					<LogoutButton variant="icon" />
				</div>
			) : sessionPending ? (
				<div
					aria-hidden="true"
					className="flex justify-center items-center gap-2 group-data-[collapsible=icon]:flex-col"
				>
					<Skeleton className="rounded-full shrink-0 size-10" />
					<Skeleton className="h-4 flex-1 group-data-[collapsible=icon]:hidden" />
				</div>
			) : (
				<div className="px-2.5 text-center flex flex-col justify-center gap-0.5 group-data-[collapsible=icon]:hidden">
					<Link href="/login" className="block">
						<Button variant="secondary" className="w-full h-7.75">
							Sign In
						</Button>
					</Link>
					<p className="text-xs text-muted-foreground">
						Sign in for access to chat history.
					</p>
				</div>
			)}
		</SidebarFooter>
	);
}
