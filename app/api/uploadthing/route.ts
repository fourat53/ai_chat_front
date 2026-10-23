import {
	createRouteHandler,
	createUploadthing,
	type FileRouter,
} from "uploadthing/next";

const f = createUploadthing();

const fileRouter = {
	ragDocument: f({ blob: { maxFileSize: "16MB", maxFileCount: 1 } })
		.middleware(() => ({}))
		.onUploadComplete(async ({ file }) => {
			return { key: file.key, name: file.name };
		}),
} satisfies FileRouter;

export type UploadRouter = typeof fileRouter;

const handlers = createRouteHandler({ router: fileRouter });

export const GET = handlers.GET;
export const POST = handlers.POST;
