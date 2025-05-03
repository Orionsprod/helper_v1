import { createDriveFolder } from "./drive.ts";
import { updateNotionPage, getPageTitle } from "./notion.ts";
import { DEBUG } from "./config.ts";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const pageId = body.data?.id;

    if (!pageId) {
      console.error("Missing pageId in webhook payload:", body);
      return new Response("Bad Request: Missing pageId", { status: 400 });
    }

    if (DEBUG) console.log("Webhook received for page ID:", pageId);

    const folderName = await getPageTitle(pageId);
    const folderUrl = await createDriveFolder(folderName);
    await updateNotionPage(pageId, folderUrl);

    return new Response("Success", { status: 200 });
  } catch (e) {
    if (DEBUG) console.error("Error in webhook handler:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
});
