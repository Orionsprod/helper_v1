import { getPageTitleWithPrefix, updateProjectName, updateProjectFolderUrl } from "./notion.ts";
import { createDriveFolder } from "./drive.ts";
import { DEBUG } from "./config.ts";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const pageId = body.data?.id;

    if (!pageId) {
      console.error("❌ Missing pageId in webhook payload:", JSON.stringify(body, null, 2));
      return new Response("Bad Request: Missing pageId", { status: 400 });
    }

    if (DEBUG) console.log("📩 Webhook received for page ID:", pageId);

    const fullTitle = await getPageTitleWithPrefix(pageId);
    if (!fullTitle) {
      return new Response("⚠️ Skipped: title is not ready.", { status: 200 });
    }

    await updateProjectName(pageId, fullTitle);

    const folderUrl = await createDriveFolder(fullTitle);
    await updateProjectFolderUrl(pageId, folderUrl);

    return new Response("✅ Title, folder, and Notion update complete", { status: 200 });
  } catch (e) {
    console.error("🔥 Error in webhook handler:");
    console.error(e?.message || e);
    if (e?.stack) console.error(e.stack);
    return new Response("Internal Server Error", { status: 500 });
  }
});
