import { createDriveFolder } from "./drive.ts";
import { updateNotionPage, getPageTitle } from "./notion.ts";
import { DEBUG } from "./config.ts";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const pageId = body?.data?.id;

    if (!pageId) {
      console.error("❌ Missing pageId in webhook payload:", JSON.stringify(body, null, 2));
      return new Response("Bad Request: Missing pageId", { status: 400 });
    }

    console.log("✅ Webhook received for page ID:", pageId);

    const folderName = await getPageTitleWithPrefix(pageId);
    console.log("✅ Fetched Notion page title:", folderName);

    const folderUrl = await createDriveFolder(folderName);
    console.log("✅ Google Drive folder created at:", folderUrl);

    await updateNotionPage(pageId, folderUrl);
    console.log("✅ Notion page updated with folder URL.");

    return new Response("✅ Success", { status: 200 });

  } catch (e) {
    console.error("❌ Caught an error in webhook handler:");

    if (typeof e === "object" && e !== null) {
      if ("message" in e) console.error("Message:", (e as Error).message);
      if ("stack" in e) console.error("Stack:", (e as Error).stack);
      console.error("Full error object:", JSON.stringify(e, null, 2));
    } else {
      console.error("Error:", e);
    }

    return new Response("Internal Server Error", { status: 500 });
  }
});
