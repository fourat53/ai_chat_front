"use client";

import {
	IconBrandGithubFilled,
	IconBrandGoogleFilled,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ThemeSwitch from "@/components/reusable/ThemeSwitch";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleEmailLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		const { error } = await signIn.email({ email, password });
		if (error) {
			alert(error.message);
		} else {
			router.push("/");
		}
		setLoading(false);
	};

	const handleOAuthLogin = async (provider: "github" | "google") => {
		await signIn.social({ provider, callbackURL: "/" });
	};

	return (
		<div className="flex justify-center items-center p-4 h-screen">
			<ThemeSwitch className="absolute top-4 right-4" />
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="mb-2 text-xl text-center">
						Login to your account
					</CardTitle>
					<CardDescription className="-mb-2">
						Enter your credentials to access your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleEmailLogin}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="name@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="password">Password</FieldLabel>
								<Input
									id="password"
									type="password"
									placeholder="••••••••••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</Field>
							<Button type="submit" loading={loading} className="w-full">
								{loading ? "Signing in" : "Sign in"}
							</Button>
						</FieldGroup>
					</form>

					<div className="relative my-6">
						<div className="flex absolute inset-0 items-center">
							<span className="w-full border-t" />
						</div>
						<div className="flex relative justify-center text-xs uppercase">
							<span className="px-2 bg-sidebar text-muted-foreground">
								Or continue with
							</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<Button
							variant="outline"
							icon={<IconBrandGithubFilled />}
							onClick={() => handleOAuthLogin("github")}
							className="bg-foreground hover:bg-foreground/70 dark:text-black dark:hover:text-black"
						>
							GitHub
						</Button>
						<Button
							variant="outline"
							icon={<IconBrandGoogleFilled />}
							onClick={() => handleOAuthLogin("google")}
						>
							Google
						</Button>
					</div>

					<div className="mt-6 text-sm text-center">
						Don&apos;t have an account?{" "}
						<Link href="/register" className="text-primary hover:underline">
							Sign up
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
