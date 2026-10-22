"use client";

import { IconCopy } from "@tabler/icons-react";
import { useTheme } from "@wrksz/themes/client";
import clsx from "clsx";
import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
	prism,
	vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { LoaderDots } from "@/components/loaders/WaitingDots";
import { Button } from "@/components/ui/button";
import handleCopy from "@/functions/handleCopy";
import type { SessionType } from "@/lib/auth-client";
import type { Message, MessageMeta } from "@/types/message.type";

type ChatMessageProps = ComponentPropsWithoutRef<"div"> & {
	message: Message;
	session: SessionType;
	meta?: MessageMeta | null;
};

export function ChatMessage({ message, session, meta }: ChatMessageProps) {
	const { resolvedTheme } = useTheme();
	const isUser = message.role === "user";
	const resolvedMeta = meta
		? meta
		: message.providerName && message.modelName
			? { providerName: message.providerName, modelName: message.modelName }
			: undefined;
	const isEmptyContent = message.content.trim().length === 0;
	return (
		<div className="px-4 sm:px-8 md:px-4 lg:px-8 md:mx-auto md:max-w-2xl lg:max-w-3xl flex flex-col gap-1 w-full rounded-2xl transition-colors group">
			<div className="flex-1 space-y-2 min-w-0">
				<div className="max-w-none prose prose-sm dark:prose-invert prose-pre:p-0 prose-pre:bg-transparent prose-p:leading-relaxed">
					{isUser ? (
						<div className="flex flex-col gap-2 items-end w-full">
							<div className="flex overflow-hidden justify-center items-center rounded-full size-8">
								{session?.user.image ? (
									<Image
										src={session.user.image}
										alt="User avatar"
										width={32}
										height={32}
									/>
								) : (
									session?.user.name && (
										<p className="flex justify-center items-center text-base font-bold rounded-full size-8 bg-primary/20 text-primary">
											{session.user.name?.[0].toUpperCase()}
										</p>
									)
								)}
							</div>
							<div className="max-w-3/5 whitespace-pre-wrap px-4.5 py-3.5 bg-sidebar shadow-sm border-2  rounded-2xl">
								{message.content}
							</div>
						</div>
					) : (
						<div className="w-full font-light">
							{resolvedMeta && (
								<div
									title={`${resolvedMeta.providerName} · ${resolvedMeta.modelName}`}
									className="pb-2 font-medium flex flex-wrap gap-1.5 items-center text-xs text-muted-foreground"
								>
									<span>{resolvedMeta.providerName}</span>
									<span className="text-lg font-semibold">·</span>
									<span>{resolvedMeta.modelName}</span>
								</div>
							)}
							{isEmptyContent ? (
								<LoaderDots />
							) : (
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
															style={
																resolvedTheme === "dark" ? vscDarkPlus : prism
															}
															customStyle={{
																margin: 0,
																padding: "1rem",
																fontWeight: 100,
																fontSize: "0.85rem",
																background:
																	resolvedTheme === "dark"
																		? "#090c0d"
																		: "#eaf7f7",
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
									{message.content}
								</ReactMarkdown>
							)}
						</div>
					)}
				</div>
			</div>
			<div
				className={clsx(
					"shrink-0 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity",
					!isUser && "-mt-2 pb-4",
				)}
			>
				<Button
					variant="ghost"
					size="icon"
					className="size-8 p-0.5 hover:bg-secondary/80 dark:hover:bg-secondary/70"
					onClick={() => handleCopy(message.content)}
				>
					<IconCopy size={16} />
				</Button>
			</div>
		</div>
	);
}
