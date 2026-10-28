import { generateReactHelpers } from "@uploadthing/react";
import type { UploadRouter } from "@/app/api/uploadthing/route";

export const { useUploadThing, uploadFiles } =
	generateReactHelpers<UploadRouter>();
