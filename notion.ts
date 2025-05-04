import { NOTION_TOKEN, DEBUG } from "./config.ts";
import { GOOGLE_ROOT_FOLDER_ID, ROOT_PROJECTS_ID, ROOT_ARCHIVES_ID } from "./config.ts";

const NOTION_VERSION = "2022-06-28";
const BASE_URL = "https://api.notion.com/v1";

const PROJECTS_DATABASE_ID = Deno.env.get("PROJECTS_DATABASE_ID")!;

export async function getPageTitleWithPrefix(pageId: string): Promise<string | null> {
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
    if (DEBUG) console.log("⚠️ No title content — skipping.");
    return null;
  }

  const rawTitle = titleProp.title[0].text.content;

  if (!rawTitle || rawTitle.trim().toLowerCase() === "untitled") {
    if (DEBUG) console.log("⚠️ Skipping page with empty or placeholder title.");
    return null;
  }

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

export async function updateProjectName(pageId: string, newTitle: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      properties: {
        "Project Name": {
          title: [{ text: { content: newTitle } }],
        },
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("❌ Failed to update Project Name title:", error);
    throw new Error("Could not update Project Name title.");
  }

  if (DEBUG) console.log("✅ Project Name title updated in Notion.");
}

export async function updateProjectFolderUrl(pageId: string, folderUrl: string): Promise<void> {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
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
    console.error("❌ Failed to update Project Folder URL:", error);
    throw new Error("Notion API Error: " + error);
  }

  if (DEBUG) console.log(`✅ Notion page updated with Project Folder URL.`);
}

export async function getBrandNameFromPage(pageId: string): Promise<string | null> {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
    },
  });

  const page = await res.json();

  if (!res.ok) {
    console.error("❌ Failed to fetch page for brand lookup:", page);
    return null;
  }

  const brandRelation = page.properties["Brand"];
  const relatedId = brandRelation?.relation?.[0]?.id;

  if (!relatedId) {
    if (DEBUG) console.log("⚠️ No Brand relation found.");
    return null;
  }

  // Fetch the related brand page
  const brandRes = await fetch(`https://api.notion.com/v1/pages/${relatedId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
    },
  });

  const brandData = await brandRes.json();

  if (!brandRes.ok) {
    console.error("❌ Failed to fetch related Brand page:", brandData);
    return null;
  }

  const brandName = brandData.properties["Client"]?.title?.[0]?.text?.content;

  if (DEBUG) console.log("🏷️ Found Brand name:", brandName);
  return brandName || null;
}

export async function appendSyncedBlockTemplate(pageId: string) {
  const originalBlockId = "1e9ce390669880fbaf7fe516d0372241";

  if (DEBUG) {
    console.log("🚀 Appending synced block...");
    console.log("➡️ Target page ID:", pageId);
    console.log("🔗 Synced block source ID:", originalBlockId);
  }

  const url = `https://api.notion.com/v1/blocks/${pageId}/children`;

  const body = {
    children: [
      {
        object: "block",
        type: "synced_block",
        synced_block: {
          synced_from: {
            block_id: originalBlockId,
          },
        },
      },
    ],
  };

  if (DEBUG) {
    console.log("📦 Request payload:");
    console.dir(body, { depth: null });
  }

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify(body),
  });

  const result = await res.text();

  if (!res.ok) {
    console.error("❌ Failed to append synced block:");
    console.error("🧾 Response:", result);
    throw new Error("Could not insert synced block.");
  }

  if (DEBUG) {
    console.log("✅ Synced block appended successfully.");
    console.log("🧾 Response:", result);
  }
}
