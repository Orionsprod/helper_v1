  // 🆕 Extract project number prefix if valid (e.g., "000_" at the start)
  const projMatch = folderName.match(/^(\d{3}_)/);
  if (projMatch) {
    const projPrefix = projMatch[1];

    const subfolders = ["Files", "Assets", "Deliverables"];

    for (const sub of subfolders) {
      const subfolderName = `${projPrefix}${sub}`;

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
        if (DEBUG) console.error(`❌ Failed to create subfolder ${subfolderName}:`, subError);
        throw new Error(`Drive API Error (subfolder ${subfolderName}): ${subError}`);
      }

      const subData = await subRes.json();
      if (DEBUG) console.log(`📁 Created subfolder: ${subData.name} (${subData.id})`);
    }
  } else {
    if (DEBUG) console.warn("⚠️ Folder name does not start with a valid project number (e.g., '000_'). Skipping subfolder creation.");
  }
