"use client";

import { useTheme } from "@wrksz/themes/client";
import { DocViewer } from "omni-doc-viewer/react";
import { toast } from "sonner";
import MainLoader from "../loaders/MainLoader";

type DocType = File | string;

export function FileViewer({ file }: { file: DocType }) {
	const { resolvedTheme } = useTheme();
	return (
		<DocViewer
			source={file}
			pagination
			style={{ height: "85vh" }}
			onLoad={(meta) => console.log("loaded", meta.type, meta.pageCount)}
			onError={(err) => {
				console.error(err);
				toast.error("Could not preview this file.");
			}}
			loading={<MainLoader />}
			theme={resolvedTheme}
		/>
	);
}
