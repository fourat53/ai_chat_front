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
										fontWeight: 100,
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
				code({
					inline,
					className,
					children,
					...rest
				}: ComponentPropsWithoutRef<"code"> & {
					inline?: boolean;
					node?: unknown;
				}) {
					if (inline) {
						return (
							<code className={className} {...rest}>
								{JSON.stringify(children)}
							</code>
						);
					}
					return (
						<code className={className} {...rest}>
							{JSON.stringify(children)}
						</code>
					);
				},
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
					return <td className="border-r px-3 py-2">{children}</td>;
				},
			}}
		>
			{content}
		</ReactMarkdown>
	);
}
