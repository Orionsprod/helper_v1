import { NOTION_TOKEN, DEBUG } from "./config.ts";

const NOTION_VERSION = "2022-06-28";
const BASE_URL = "https://api.notion.com/v1";

const PROJECTS_DATABASE_ID = Deno.env.get("PROJECTS_DATABASE_ID")!;

export async function getPageTitleWithPrefix(pageId: string): Promise<string> {
  const pageRes = await fetch(`${BASE_URL}/pages/${pageId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
    },
  });

  const pageData = await pageRes.json();

  if (!pageRes.ok) {
    console.error("❌ Failed to fetch Notion page:", pageData);
    throw new Error("Notion API Error");
  }

  const titleProp = pageData.properties["Project Name"];
  if (!titleProp?.title?.[0]?.text?.content) {
    throw new Error("Project Name is missing.");
  }

  const rawTitle = titleProp.title[0].text.content;

  const count = await getDatabasePageCount();
  const prefix = `${String(count).padStart(3, "0")}_`;

  const fullTitle = `${prefix}${rawTitle}`;
  if (DEBUG) console.log("✅ Computed full project title:", fullTitle);

  return fullTitle;
}

async function getDatabasePageCount(): Promise<number> {
  let hasMore = true;
  let nextCursor = undefined;
  let total = 0;

  while (hasMore) {
    const body = {
      page_size: 100,
      start_cursor: nextCursor,
    };

    const res = await fetch(`${BASE_URL}/databases/${PROJECTS_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Failed to query database:", data);
      throw new Error("Notion DB Query Error");
    }

    total += data.results.length;
    hasMore = data.has_more;
    nextCursor = data.next_cursor;
  }

  if (DEBUG) console.log("📊 Database entry count:", total);
  return total;
}

export async function updateProjectFolderUrl(pageId: string, folderUrl: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
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

  if (DEBUG) console.log(`✅ Project page updated with folder URL.`);
}
