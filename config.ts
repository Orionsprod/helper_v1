export const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN")!;
export const GOOGLE_ROOT_FOLDER_ID = Deno.env.get("GOOGLE_ROOT_FOLDER_ID")!;
export const SERVICE_ACCOUNT_JSON = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")!;
export const DEBUG = Deno.env.get("DEBUG") === "true";
