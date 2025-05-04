import { NOTION_TOKEN, DEBUG } from "./config.ts";

const VIDEO_IMAGE = "https://em-content.zobj.net/source/apple/419/television_1f4fa.png";
const STATIC_IMAGE = "https://em-content.zobj.net/source/apple/419/framed-picture_1f5bc-fe0f.png";
const DEFAULT_IMAGE = "https://emoji.iamrohit.in/img-apple/1f3af.png";

export async function setProjectIconFromTitle(pageId: string, title: string): Promise<void> {
  try {
    const lower = title.toLowerCase();
    let imageUrl = DEFAULT_IMAGE;

    if (lower.includes("video")) {
      imageUrl = VIDEO_IMAGE;
      if (DEBUG) console.log("🎬 'video' detected in title — setting VIDEO_IMAGE.");
    } else if (lower.includes("image")) {
      imageUrl = STATIC_IMAGE;
      if (DEBUG) console.log("🖼️ 'image' detected in title — setting STATIC_IMAGE.");
    } else {
      if (DEBUG) console.log("📄 No keyword match — using DEFAULT_IMAGE.");
    }

    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        icon: {
          type: "external",
          external: { url: imageUrl }
        }
      })
    });

    if (res.status === 409 && retry < 1) {
      if (DEBUG) console.warn("⚠️ Conflict occurred while saving icon. Retrying...");
      await new Promise(resolve => setTimeout(resolve, 500)); // wait 500ms
      return await setProjectIcon(pageId, retry + 1);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Failed to update page icon:", errText);
      throw new Error("Icon update failed");
    }

    if (DEBUG) console.log("✅ Page icon successfully set to:", imageUrl);
  } catch (err) {
    console.error("🔥 Error setting project icon:", err?.message || err);
    if (err?.stack) console.error(err.stack);
  }
}
