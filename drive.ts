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

  // 🆕 Extract project number prefix if valid (e.g., "000_" at the start)
  const projMatch = folderName.match(/^(\d{3}_)/);
  if (projMatch) {
    const projPrefix = projMatch[1];
    const subfolders = ["Files", "Assets", "Deliverables"];
    if (DEBUG) console.log(`📦 Project prefix detected: "${projPrefix}". Creating subfolders...`);

    for (const sub of subfolders) {
      const subfolderName = `${projPrefix}${sub}`;
      if (DEBUG) console.log(`➡️ Creating subfolder: ${subfolderName}`);

      try {
        const subRes = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: subfolderName,
            mimeType: "application/vnd.google-apps.folder",
            parents: [data.id],
          }),
        });

        if (!subRes.ok) {
          const subError = await subRes.text();
          if (DEBUG) console.error(`⚠️ Failed to create subfolder "${subfolderName}":`, subError);
          continue; // Skip to next subfolder
        }

        const subData = await subRes.json();
        if (DEBUG) console.log(`✅ Subfolder created: ${subData.name} (${subData.id})`);

      } catch (err) {
        if (DEBUG) console.error(`🚨 Unexpected error while creating subfolder "${subfolderName}":`, err);
        continue;
      }
    }
  } else {
    if (DEBUG) console.warn("⚠️ Folder name does not start with a valid project number (e.g., '000_'). Skipping subfolder creation.");
  }

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
