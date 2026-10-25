"use client";

import { DocViewer } from "omni-doc-viewer/react";
import MainLoader from "../loaders/MainLoader";
import { useTheme } from "@wrksz/themes/client";

type DocType = File | string;

export function FileViewer({ file }: { file: DocType }) {
	const { resolvedTheme } = useTheme();
	return (
		<DocViewer
			source={file}
			pagination
			style={{ height: "85vh" }}
			onLoad={(meta) => console.log("loaded", meta.type, meta.pageCount)}
			onError={(err) => console.error(err)}
			loading={<MainLoader />}
			theme={resolvedTheme}
		/>
	);
}
