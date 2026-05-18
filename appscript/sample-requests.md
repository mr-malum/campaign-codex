# Kadesh Codex Apps Script Prototype — Sample Requests

Replace `SCRIPT_WEB_APP_URL` with the Apps Script web app URL.

For prototype testing, include either:

- a deployed Apps Script session identity that appears in `KADESH_ALLOWED_WRITERS`, or
- a `secret` value matching `KADESH_SHARED_SECRET`.

## Create POI

```json
{
  "action": "createRecord",
  "secret": "dev-secret-only-if-configured",
  "entityType": "poi",
  "fields": {
    "Name": "The Salt-Crowned Shrine",
    "POI_Type": "Shrine",
    "Hex_ID_Ref": "HEX-0123",
    "Region_ID_Ref": "REG-0007",
    "POI_Group_ID": "PGRP-0002",
    "Notoriety Tier": "Local",
    "Summary": "A wind-scoured shrine overlooking the coast.",
    "Description": "Ancient stones crusted with sea salt surround a cracked altar.",
    "Player_Visible": "TRUE"
  }
}
```

## Create NPC

```json
{
  "action": "createRecord",
  "secret": "dev-secret-only-if-configured",
  "entityType": "npc",
  "fields": {
    "Name": "Marra Vey",
    "Race": "Human",
    "Occupation": "Harbormaster",
    "Faction": "Misty Coast Authority",
    "Home_ID_Ref": "POI-0042",
    "Summary": "A patient official who knows every ship that enters the bay.",
    "Description": "Marra keeps three ledgers and trusts only one of them.",
    "Player_Visible": "TRUE"
  }
}
```

## Update existing record

```json
{
  "action": "updateRecord",
  "secret": "dev-secret-only-if-configured",
  "entityType": "poi",
  "id": "POI-0042",
  "fields": {
    "Summary": "Updated short player-facing summary.",
    "Notoriety Tier": "Regional"
  }
}
```

## Upload image only

```json
{
  "action": "uploadFile",
  "secret": "dev-secret-only-if-configured",
  "entityType": "poi",
  "file": {
    "name": "salt-crowned-shrine.webp",
    "mimeType": "image/webp",
    "base64": "BASE64_IMAGE_BYTES_HERE",
    "description": "Prototype POI image upload"
  }
}
```

## Upload image and link it to an existing POI

```json
{
  "action": "uploadAndLinkFile",
  "secret": "dev-secret-only-if-configured",
  "entityType": "poi",
  "file": {
    "name": "salt-crowned-shrine.webp",
    "mimeType": "image/webp",
    "base64": "BASE64_IMAGE_BYTES_HERE"
  },
  "linkTo": {
    "entityType": "poi",
    "id": "POI-0042"
  }
}
```

## Upload map image and link it to an existing map row

```json
{
  "action": "uploadAndLinkFile",
  "secret": "dev-secret-only-if-configured",
  "entityType": "map",
  "file": {
    "name": "misty-coast-local-map.png",
    "mimeType": "image/png",
    "base64": "BASE64_IMAGE_BYTES_HERE"
  },
  "linkTo": {
    "entityType": "map",
    "id": "MAP-0003"
  }
}
```

## Create map record after separate upload

```json
{
  "action": "createRecord",
  "secret": "dev-secret-only-if-configured",
  "entityType": "map",
  "fields": {
    "Map_Name": "Misty Coast Bay Detail",
    "Owner_Type": "region",
    "Owner_ID_Ref": "REG-0007",
    "Map_Drive_ID": "DRIVE_FILE_ID_FROM_UPLOAD",
    "Sort_Order": "10",
    "Caption": "A local view of the rounded bay and narrow entrance.",
    "Player_Visible": "TRUE"
  }
}
```

## Add DM Journal entry

```json
{
  "action": "createDmJournalEntry",
  "secret": "dev-secret-only-if-configured",
  "sourceType": "poi",
  "sourceId": "POI-0042",
  "entryType": "secret",
  "sessionId": "S004",
  "body": "The shrine bell rings only when something beneath the bay moves.",
  "playerVisible": false
}
```
