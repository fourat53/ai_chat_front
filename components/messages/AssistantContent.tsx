"use client";

import { IconCopy } from "@tabler/icons-react";
import { useTheme } from "@wrksz/themes/client";
import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
	prism,
	vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import handleCopy from "@/lib/functions/handleCopy";

export default function AssistantContent({ content }: { content: string }) {
	const { resolvedTheme } = useTheme();
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				// Code blocks
				pre({ children }) {
					const codeEl = children as React.ReactElement;
					const codeProps: ComponentPropsWithoutRef<"code"> =
						codeEl.props ?? {};
					const codeClassName = codeProps.className ?? "";
					const codeContent =
						typeof codeProps.children === "string"
							? codeProps.children.replace(/\n$/, "")
							: "";
					const match = /language-(\w+)/.exec(codeClassName);
					if (match) {
						return (
							<div className="overflow-hidden my-4 rounded-lg border">
								<div className="flex justify-between items-center py-0.5 pr-0.5 pl-3 text-muted-foreground bg-sidebar border-b">
									Code
									<Button
										variant="ghost"
										size="icon"
										className="size-8 p-0.5 hover:bg-secondary/80 dark:hover:bg-secondary/70"
										onClick={() => handleCopy(codeContent)}
									>
										<IconCopy size={16} />
									</Button>
								</div>
								<SyntaxHighlighter
									PreTag="div"
									language={match[1]}
									style={resolvedTheme === "dark" ? vscDarkPlus : prism}
									customStyle={{
										margin: 0,
										padding: "1rem",
										fontWeight: 300,
										fontSize: "0.85rem",
										background:
											resolvedTheme === "dark" ? "#0c0f10" : "#eaf7f7",
										whiteSpace: "pre-wrap",
										overflowWrap: "anywhere",
									}}
								>
									{codeContent}
								</SyntaxHighlighter>
							</div>
						);
					}
					return (
						<div className="my-2 shadow-sm border">
							<div className="px-3 py-2 dark:bg-sidebar/40">
								<code>{codeContent}</code>
							</div>
						</div>
					);
				},
				// Inline code
				code({
					inline,
					children,
					...rest
				}: ComponentPropsWithoutRef<"code"> & {
					inline?: boolean;
					node?: unknown;
				}) {
					return (
						<code
							style={{
								color: "var(--color-muted-foreground)",
								fontWeight: 500,
							}}
							{...rest}
						>
							{children}
						</code>
					);
				},
				// Tables
				table({ children }) {
					return (
						<div className="my-4 overflow-x-auto">
							<table className="w-full border-t border-l border-collapse text-sm">
								{children}
							</table>
						</div>
					);
				},
				tr({ children }) {
					return <tr className="border-b">{children}</tr>;
				},
				th({ children }) {
					return (
						<th className="border-r px-3 py-2 text-left font-medium bg-sidebar">
							{children}
						</th>
					);
				},
				td({ children }) {
					return (
						<td className="bg-sidebar/40 border-r px-3 py-2">{children}</td>
					);
				},
				// Line breaks
				hr() {
					return <hr className="mt-4 border-transparent" />;
				},
				// Headings
				p({ children }) {
					return <p className="my-2 leading-6 text-[16px]">{children}</p>;
				},
				h1({ children }) {
					return (
						<h1 className="mt-5 mb-3 text-xl font-bold tracking-tight">
							{children}
						</h1>
					);
				},
				h2({ children }) {
					return (
						<h2 className="mt-4 mb-2 text-lg font-semibold tracking-tight">
							{children}
						</h2>
					);
				},
				h3({ children }) {
					return (
						<h3 className="mt-3 mb-2 text-base font-semibold">{children}</h3>
					);
				},
				// Lists
				ul({ children }) {
					return <ul className="my-2 ml-5 list-disc space-y-1">{children}</ul>;
				},
				ol({ children }) {
					return (
						<ol className="my-2 ml-5 list-decimal space-y-1">{children}</ol>
					);
				},
				li({ children }) {
					return <li className="pl-1 leading-7">{children}</li>;
				},
				//Links
				a({ children, href }) {
					return (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap align-bottom text-muted-foreground font-normal underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-muted-foreground transition-colors"
						>
							{children}
						</a>
					);
				},
			}}
		>
			{content}
		</ReactMarkdown>
	);
}
