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
		<SidebarFooter className="px-4 py-2">
			{session ? (
				<div className="h-12 flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
					<div className="h-full flex justify-between items-center gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
						<div className="flex items-center gap-2 text-sm text-muted-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
							<div className="flex overflow-hidden justify-center items-center rounded-full size-9">
								{session.user.image ? (
									<Image
										src={session.user.image}
										alt="User avatar"
										width={36}
										height={36}
									/>
								) : (
									session.user.name && (
										<p className="flex justify-center items-center text-base font-bold rounded-full size-9 bg-primary/20 text-primary">
											{session.user.name?.[0].toUpperCase()}
										</p>
									)
								)}
							</div>

							<span className="truncate group-data-[collapsible=icon]:hidden">
								{session.user.name || session.user.email}
							</span>
						</div>
						<LogoutButton variant="icon" />
					</div>
				</div>
			) : sessionPending ? (
				<div
					aria-hidden="true"
					className="h-12 flex justify-center items-center gap-2 group-data-[collapsible=icon]:flex-col"
				>
					<Skeleton className="shrink-0 rounded-full size-9" />
					<Skeleton className="h-4 flex-1 group-data-[collapsible=icon]:hidden" />
				</div>
			) : (
				<div className="pt-1 px-2 h-12 text-center flex flex-col justify-center gap-0.5 group-data-[collapsible=icon]:hidden">
					<Link href="/login" className="block">
						<Button variant="secondary" className="w-full h-7.75">
							Sign In
						</Button>
					</Link>
					<p className="px-2 text-[11px] text-muted-foreground">
						Sign in for access to chat history.
					</p>
				</div>
			)}
		</SidebarFooter>
	);
}
