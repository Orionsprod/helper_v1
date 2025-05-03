export const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN")!;
export const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY")!;
export const GOOGLE_ROOT_FOLDER_ID = Deno.env.get("GOOGLE_ROOT_FOLDER_ID")!;
export const DEBUG = Deno.env.get("DEBUG") === "true";
