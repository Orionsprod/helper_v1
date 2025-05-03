import { NOTION_TOKEN, DEBUG } from "./config.ts";

export async function updateNotionPage(pageId: string, folderUrl: string): Promise<void> {
  const url = `https://api.notion.com/v1/pages/${pageId}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      properties: {
        "Master Folder": {
          url: folderUrl,
        },
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    if (DEBUG) console.error("Notion page update failed:", error);
    throw new Error("Notion API Error: " + error);
  }

  if (DEBUG) console.log(`Notion page updated with folder URL: ${folderUrl}`);
}
