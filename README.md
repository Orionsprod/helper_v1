# 🗃️ Notion + Google Drive Folder Automation (via Deno Deploy)

This project auto-creates a Google Drive folder when a new Notion page is added to the **Projects** database, and inserts the folder URL into the page's `Master Folder` property.

---

## 🧱 Structure

- `config.ts` – securely handles environment variables
- `drive.ts` – creates Google Drive folder inside a root
- `notion.ts` – updates Notion page with new folder URL
- `handler.ts` – receives webhook, ties all logic together
- `deno.json` – Deno configuration
- `README.md` – you're reading it!

---

## ⚙️ Step-by-Step Setup

### 1. **Create Google Drive API Access**

- Enable the [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com).
- Create credentials (OAuth token or service account).
- Get an **access token** and **root folder ID**.

### 2. **Prepare Notion API Token**

- Create an integration at [Notion Integrations](https://www.notion.so/my-integrations).
- Share access with your "Projects" database.
- Copy the **Notion token**.

---

### 3. **Deploy to Deno Deploy**

1. Go to [Deno Deploy](https://dash.deno.com/)
2. Create a new project
3. Upload these files or connect a GitHub repo
4. In **Environment Variables**, add:

| Key                  | Value                          |
|----------------------|--------------------------------|
| `NOTION_TOKEN`       | your Notion secret             |
| `GOOGLE_DRIVE_API_KEY` | your Google Drive API token |
| `GOOGLE_ROOT_FOLDER_ID` | Google Drive root folder   |
| `DEBUG`              | `true` or `false`              |

---

### 4. **Set Up Notion Automation**

Use Notion’s internal automation or Zapier to:

- Trigger when a new page is added to the `Projects` database.
- Send a webhook to your Deno Deploy URL:
  ```
  POST https://your-deno-project.deno.dev/
  Body:
  {
    "pageId": "<page_id>",
    "folderName": "<project name>"
  }
  ```

---

### 5. **Done! ✅**

Once triggered:
- A folder is created in Drive
- That link is added to the page under `Master Folder`

Use `DEBUG=true` to see logs on Deno Deploy.

---

Happy automating!
