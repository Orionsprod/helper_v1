import { GOOGLE_ROOT_FOLDER_ID, ROOT_PROJECTS_ID, ROOT_ARCHIVES_ID, DEBUG } from "./config.ts";
import { getAccessTokenFromServiceAccount } from "./google_auth.ts";

export async function createDriveFolder(folderName: string, brandName?: string): Promise<string> {
  const accessToken = await getAccessTokenFromServiceAccount();

  let parentId = GOOGLE_ROOT_FOLDER_ID;

  if (brandName) {
    const brandFolder = await findMatchingParentFolder(brandName, accessToken);
    if (brandFolder) {
      parentId = brandFolder;
      if (DEBUG) console.log("📂 Using brand folder as parent:", brandFolder);
    } else {
      if (DEBUG) console.log("📁 No matching brand folder found. Using default root.");
    }
  }

  const url = "https://www.googleapis.com/drive/v3/files";
  const body = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentId],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    if (DEBUG) console.error("❌ Drive folder creation failed:", error);
    throw new Error("Drive API Error: " + error);
  }

  const data = await res.json();
  if (DEBUG) console.log("✅ Drive folder created:", data.name, data.id);

  return `https://drive.google.com/drive/folders/${data.id}`;
}

async function findMatchingParentFolder(brand: string, token: string): Promise<string | null> {
  const roots = [ROOT_PROJECTS_ID, ROOT_ARCHIVES_ID];

  for (const rootId of roots) {
    if (DEBUG) console.log("🔍 Searching for brand folder under:", rootId);

    const folderId = await searchFolderRecursively(rootId, brand.toLowerCase(), token);
    if (folderId) {
      if (DEBUG) console.log(`✅ Found brand folder: ${folderId}`);
      return folderId;
    }
  }

  if (DEBUG) console.log("❌ No brand folder match found in any root.");
  return null;
}

async function searchFolderRecursively(parentId: string, keyword: string, token: string): Promise<string | null> {
  const q = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1000`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ Failed to search folders:", err);
    return null;
  }

  const { files } = await res.json();
  for (const file of files) {
    if (file.name.toLowerCase().includes(keyword)) {
      return file.id;
    }
    const found = await searchFolderRecursively(file.id, keyword, token);
    if (found) return found;
  }

  return null;
}
