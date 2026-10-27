"use client";

import {
	IconBrandGithubFilled,
	IconBrandGoogleFilled,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ThemeSwitch from "@/components/buttons/ThemeSwitch";
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
import { signIn, signUp } from "@/lib/auth/auth-client";

export default function RegisterPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleRegister = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		const { error } = await signUp.email({ name, email, password });
		if (error) {
			toast.error(error.message);
		} else {
			router.push("/");
		}
		setLoading(false);
	};

	const handleOAuthLogin = async (provider: "github" | "google") => {
		await signIn.social({ provider, callbackURL: "/" });
	};

	return (
		<div className="h-screen flex items-center justify-center p-4">
			<ThemeSwitch className="absolute top-4 right-4" />
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="mb-2 text-center text-xl">
						Create an account
					</CardTitle>
					<CardDescription className="-mb-2">
						Enter your details below to get started
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleRegister}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="name">Name</FieldLabel>
								<Input
									id="name"
									type="text"
									placeholder="John Doe"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</Field>
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
								{loading ? "Creating account" : "Create account"}
							</Button>
						</FieldGroup>
					</form>

					<div className="relative my-6">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">
								Or continue with
							</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<Button
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

					<div className="mt-6 text-center text-sm">
						Already have an account?{" "}
						<Link href="/login" className="text-primary hover:underline">
							Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
