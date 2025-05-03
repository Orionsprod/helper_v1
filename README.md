# 🗃️ Notion + Google Drive Folder Automation (Deno Deploy, Auto Refresh)

## 🔥 Features

- Auto-generates Google Drive folder named after Notion page
- Stores link in the `Master Folder` property
- Automatically fetches a new access token using service account JSON

---

## ✅ Environment Variables for Deno Deploy

| Name                       | Description                             |
|----------------------------|-----------------------------------------|
| `NOTION_TOKEN`             | Notion integration secret               |
| `GOOGLE_ROOT_FOLDER_ID`    | Drive folder ID to nest project folders |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON (stringified) from GCP     |
| `DEBUG`                    | `true` to enable logs                   |

To use `GOOGLE_SERVICE_ACCOUNT_JSON`, copy the contents of your `.json` file into an env var.

---

## 📦 Webhook Payload

```json
{
  "data": {
    "id": "<notion-page-id>"
  }
}
```

---

## ⏱️ No Manual Token Refresh Needed

The system signs a JWT and fetches a fresh token on every call — forever.

---
