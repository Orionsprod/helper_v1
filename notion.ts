import { NOTION_TOKEN, DEBUG } from "./config.ts";

export async function getPageTitle(pageId: string): Promise<string> {
  const url = `https://api.notion.com/v1/pages/${pageId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
    },
  });

  if (!res.ok) {
    const error = await res.text();
    if (DEBUG) console.error("Failed to fetch page title:", error);
    throw new Error("Could not retrieve Notion page.");
  }

  const pageData = await res.json();

  const titleProp = pageData.properties["Project Name"];
  if (titleProp?.title?.[0]?.text?.content) {
    const title = titleProp.title[0].text.content;
    if (DEBUG) console.log("Fetched page title:", title);
    return title;
  } else {
    throw new Error("Could not extract title from Notion page.");
  }
}

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
        "Project Folder": {
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
