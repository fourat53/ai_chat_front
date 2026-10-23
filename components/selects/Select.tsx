"use client";

import { IconSearch } from "@tabler/icons-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	Select as SelectRoot,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export type SelectOption = {
	value: string;
	label: string;
};

export type SelectProps = {
	items: SelectOption[];
	value?: string | null;
	onValueChange?: (value: string | null) => void;
	placeholder?: string;
	searchable?: boolean;
	searchPlaceholder?: string;
	groupLabel?: string;
	emptyText?: string;
	disabled?: boolean;
	icon?: ReactNode;
	size?: "sm" | "default";
	triggerClassName?: string;
};

function isPrintableKey(event: React.KeyboardEvent) {
	return (
		event.key.length === 1 &&
		event.key !== " " &&
		!event.ctrlKey &&
		!event.metaKey &&
		!event.altKey
	);
}

function stopPrintableKeys(event: React.KeyboardEvent) {
	if (isPrintableKey(event)) event.stopPropagation();
}

function keepPopupClickFocus(event: React.MouseEvent) {
	if (event.target instanceof Element && event.target.closest("input")) return;
	event.preventDefault();
}

export default function Select({
	items,
	value,
	onValueChange,
	placeholder,
	searchable = false,
	searchPlaceholder = "Search...",
	groupLabel,
	emptyText = "No results found",
	disabled = false,
	icon,
	size = "default",
	triggerClassName,
}: SelectProps) {
	const [search, setSearch] = useState("");
	const searchInputRef = useRef<HTMLInputElement>(null);

	const handleOpenChange = useCallback((open: boolean) => {
		if (open) setSearch("");
	}, []);

	const filteredItems = useMemo(() => {
		if (!searchable) return items;
		const query = search.trim().toLowerCase();
		if (!query) return items;
		return items.filter((item) => item.label.toLowerCase().includes(query));
	}, [items, search, searchable]);

	const handlePopupKeyDown = (event: React.KeyboardEvent) => {
		if (!isPrintableKey(event)) return;
		event.stopPropagation();
		const input = searchInputRef.current;
		if (input && document.activeElement !== input) {
			input.focus();
		}
	};

	const selected = items.find((item) => item.value === value);

	return (
		<SelectRoot
			value={value ?? ""}
			disabled={disabled}
			highlightItemOnHover={false}
			onValueChange={(next) => onValueChange?.(next)}
			onOpenChange={handleOpenChange}
		>
			<SelectTrigger
				size={size}
				className={triggerClassName}
				onKeyDownCapture={stopPrintableKeys}
			>
				{icon}
				<SelectValue placeholder={placeholder}>{selected?.label}</SelectValue>
			</SelectTrigger>
			<SelectContent
				className={searchable ? "max-h-90" : undefined}
				onKeyDownCapture={handlePopupKeyDown}
				onMouseDown={keepPopupClickFocus}
			>
				{searchable && (
					<SelectSearch
						value={search}
						onChange={setSearch}
						placeholder={searchPlaceholder}
						resultCount={filteredItems.length}
						inputRef={searchInputRef}
					/>
				)}
				<SelectGroup
					className={searchable ? "max-h-80 overflow-y-auto" : undefined}
				>
					{groupLabel && <SelectLabel>{groupLabel}</SelectLabel>}
					{filteredItems.map((item) => (
						<SelectItem
							title={item.label}
							key={item.value}
							value={item.value}
							className="w-full min-w-0 overflow-hidden hover:bg-accent hover:text-accent-foreground hover:**:text-accent-foreground"
						>
							<span className="block min-w-0 flex-1 truncate">
								{item.label}
							</span>
						</SelectItem>
					))}
				</SelectGroup>
				{filteredItems.length === 0 && (
					<div className="px-3 pb-2 text-muted-foreground">{emptyText}</div>
				)}
			</SelectContent>
		</SelectRoot>
	);
}

function SelectSearch({
	value,
	onChange,
	placeholder,
	resultCount,
	inputRef,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	resultCount: number;
	inputRef: React.RefObject<HTMLInputElement | null>;
}) {
	const lastResultCountRef = useRef<number | null>(null);

	useEffect(() => {
		if (lastResultCountRef.current === resultCount) return;
		lastResultCountRef.current = resultCount;
		const input = inputRef.current;
		const frame = requestAnimationFrame(() => input?.focus());
		return () => cancelAnimationFrame(frame);
	}, [resultCount, inputRef]);

	return (
		<div className="text-sm border-b bg-popover relative z-20 flex h-10 items-center gap-2 px-3 py-2">
			<IconSearch
				size={14}
				className="pointer-events-none shrink-0 text-muted-foreground"
			/>
			<input
				ref={inputRef}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground"
			/>
		</div>
	);
}
