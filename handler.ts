import { createDriveFolder } from "./drive.ts";
import { updateNotionPage } from "./notion.ts";
import { DEBUG } from "./config.ts";

Deno.serve(async (req) => {
  try {
    const { pageId, folderName } = await req.json();

    if (DEBUG) console.log("Webhook received:", { pageId, folderName });

    const folderUrl = await createDriveFolder(folderName);
    await updateNotionPage(pageId, folderUrl);

    return new Response("Success", { status: 200 });
  } catch (e) {
    if (DEBUG) console.error("Error in webhook handler:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
});
