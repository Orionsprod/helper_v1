import { GOOGLE_DRIVE_API_KEY, GOOGLE_ROOT_FOLDER_ID, DEBUG } from "./config.ts";

export async function createDriveFolder(folderName: string): Promise<string> {
  const url = "https://www.googleapis.com/drive/v3/files?key=" + GOOGLE_DRIVE_API_KEY;

  const body = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [GOOGLE_ROOT_FOLDER_ID],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GOOGLE_DRIVE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    if (DEBUG) console.error("Drive folder creation failed:", error);
    throw new Error("Drive API Error: " + error);
  }

  const data = await res.json();
  if (DEBUG) console.log("Drive folder created:", data);

  return `https://drive.google.com/drive/folders/${data.id}`;
}
