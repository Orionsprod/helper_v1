import { NOTION_TOKEN, DEBUG } from "./config.ts";

export async function getPageTitleWithPrefix(pageId: string): Promise<string> {
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
  const projNumberProp = pageData.properties["Proj Number"];

  if (!titleProp?.title?.[0]?.text?.content) {
    throw new Error("Project Name is missing.");
  }

  const title = titleProp.title[0].text.content;
  const projNumber = projNumberProp?.rollup?.array?.[0]?.number;

  let prefix = "";
  if (typeof projNumber === "number") {
    const padded = projNumber.toString().padStart(3, "0");
    prefix = `${padded}_`;
  }

  const fullTitle = `${prefix}${title}`;
  if (DEBUG) console.log("Computed full project title:", fullTitle);
  return fullTitle;
}

export async function updateProjectFolderUrl(pageId: string, folderUrl: string): Promise<void> {
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
