# Kadesh Codex Apps Script Write-Back Prototype

This folder contains an isolated Google Apps Script prototype for writing Kadesh Codex records back into Google Sheets and storing related image/map assets in Google Drive.

It is intentionally not wired into the production frontend yet. The current app can continue loading published CSV data through `js/data-loader.js` while this backend is reviewed, tested, and revised.

## Prototype goals

The prototype can:

- receive structured JSON POST requests
- validate actions, entity types, fields, required fields, and uploads
- generate sequential IDs while holding a write lock
- append new POI, NPC, map, and DM Journal rows
- update existing rows by reference ID
- upload images/maps to configured Drive folders
- write uploaded Drive file IDs back into configured sheet fields
- return structured JSON success/error payloads

## Files

```text
appscript/
  Code.gs                 # doGet/doPost entrypoint and action dispatch
  config.gs               # entity schemas, sheet names, ID prefixes, property names
  ids.gs                  # sequential ID generation helpers
  sheets.gs               # Sheet open/read/find/append/update helpers
  drive.gs                # Drive upload helpers
  validation.gs           # request/auth/payload validation helpers
  README.md               # this file
  sample-requests.md      # example request bodies
  sample-responses.json   # example response shapes
```

## Current frontend relationship

The existing frontend data loader remains read-only and CSV-based. In `js/data-loader.js`, the app currently loads published CSV URLs for entities including `hexes`, `pois`, `npcs`, `regions`, `poiGroups`, `maps`, and `dmJournal`. The loader also indexes rows by fields such as `Hex_ID`, `POI_ID`, `NPC_ID`, `Region_ID`, `POI_Group_ID`, `Map_ID`, and `Entry_ID`.

This prototype does not replace that flow. A future integration can POST writes to Apps Script, then refresh the existing CSV-driven app data after Google Sheets republishes/updates.

## Deployment outline

1. Create a Google Apps Script project.
2. Add each `.gs` file from this folder into that Apps Script project.
3. In Apps Script project settings, add required ScriptProperties.
4. Deploy as a web app.
5. Choose the safest available execution/access mode for testing.
6. Test with `sample-requests.md` before connecting any production UI.

## Required ScriptProperties

| Property | Purpose |
| --- | --- |
| `KADESH_SPREADSHEET_ID` | Canonical Google Sheet ID to write into. |
| `KADESH_ALLOWED_WRITERS` | Comma-separated allowlist of writer emails. |
| `KADESH_SHARED_SECRET` | Optional fallback token for prototype requests. Avoid relying on this long-term. |
| `KADESH_FOLDER_POI_IMAGES` | Drive folder for POI image uploads. |
| `KADESH_FOLDER_NPC_IMAGES` | Drive folder for NPC image uploads. |
| `KADESH_FOLDER_MAP_IMAGES` | Drive folder for map image uploads. |
| `KADESH_FOLDER_MISC_UPLOADS` | Optional fallback Drive folder for miscellaneous uploads. |

The prototype fails closed when no writer authorization is configured.

## Expected sheet tabs and columns

The defaults in `config.gs` are placeholders based on the current frontend naming style and should be confirmed against the real Sheet headers before live testing.

### POIs

Default tab: `POIs`

Expected ID field: `POI_ID`

Required create fields:

- `Name`

Common supported fields:

- `Name`
- `POI_Type`
- `Hex_ID_Ref`
- `Region_ID_Ref`
- `POI_Group_ID`
- `Notoriety Tier`
- `Summary`
- `Description`
- `Image_Drive_ID`
- `Map_ID_Ref`
- `Faction_ID_Ref`
- `Tags`
- `Player_Visible`
- `DM_Notes`

### NPCs

Default tab: `NPCs`

Expected ID field: `NPC_ID`

Required create fields:

- `Name`

Common supported fields:

- `Name`
- `Race`
- `Occupation`
- `Faction`
- `Home_ID_Ref`
- `POI_ID_Ref`
- `POI_Group_ID_Ref`
- `Summary`
- `Description`
- `Image_Drive_ID`
- `Tags`
- `Player_Visible`
- `DM_Notes`

### Maps

Default tab: `Maps`

Expected ID field: `Map_ID`

Required create fields:

- `Map_Name`
- `Owner_Type`
- `Owner_ID_Ref`

Common supported fields:

- `Map_Name`
- `Owner_Type`
- `Owner_ID_Ref`
- `Map_Drive_ID`
- `Sort_Order`
- `Caption`
- `Player_Visible`
- `DM_Notes`

### DM Journal

Default tab: `DM Journal`

Expected ID field: `Entry_ID`

Required create fields:

- `Source_Type`
- `Source_ID`
- `Entry_Body`

Common supported fields:

- `Timestamp`
- `Created_By`
- `Session_ID`
- `Source_Type`
- `Source_ID`
- `Entry_Type`
- `Entry_Body`
- `Player_Visible`

## Endpoint behavior

### `GET`

Returns basic service information and supported actions.

### `POST`

All POST requests use JSON. Supported actions:

- `createRecord`
- `updateRecord`
- `uploadFile`
- `uploadAndLinkFile`
- `createDmJournalEntry`

Each write action is run under `LockService.getDocumentLock()` to reduce concurrent write hazards.

## Write-safety decisions in this prototype

### Authentication / authorization

The prototype supports two authorization modes:

1. `KADESH_ALLOWED_WRITERS`: checks the Apps Script session/effective email when Apps Script exposes it.
2. `KADESH_SHARED_SECRET`: a prototype fallback secret sent in the request body.

For a real public app, the shared-secret approach is not enough by itself. Anyone who can inspect frontend JavaScript can recover a frontend-shipped secret. Long-term options may include Google sign-in, a server-side proxy, or a different authenticated backend.

### ID generation

IDs are generated by scanning the target sheet for the largest numeric suffix matching the configured prefix, then appending the next number.

Example:

- `POI-0042` -> next `POI-0043`
- `NPC-0018` -> next `NPC-0019`

Generation and append happen while holding a document lock. This is slower than a cached counter but safer for the prototype because it respects existing live sheet data.

### Schema protection

The prototype refuses unknown fields instead of silently adding columns or writing into the wrong place. It also verifies required headers before appending or updating.

### Update semantics

Updates locate rows by entity ID and update only the fields supplied in `payload.fields`. ID fields cannot be updated.

### Audit fields

The prototype tries to populate common audit fields when matching headers exist:

- `Created_At`
- `Created_By`
- `Updated_At`
- `Updated_By`

If those headers do not exist, they are ignored by the sheet writer because only existing headers are written.

## Drive upload behavior

Uploads accept base64-encoded image bytes and write them to configured folders. Allowed MIME types are currently:

- `image/png`
- `image/jpeg`
- `image/webp`
- `image/gif`

Default upload limit is 10 MB.

For POIs and NPCs, uploaded file IDs can be written into `Image_Drive_ID`. For maps, uploaded file IDs can be written into `Map_Drive_ID`.

## Future integration with the current app

A small optional frontend adapter could eventually be added without replacing the CSV loader. The integration path should be staged:

1. Add a tiny write client that POSTs to the Apps Script URL.
2. Add dev-only UI actions for create/update/upload.
3. After a successful write, show the returned ID and ask the user to refresh or trigger the existing data reload.
4. Later, decide whether the app should poll/reload CSV data automatically after writes.
5. Only after the write model is stable, consider deeper integration into list/detail pages.

Avoid changing `js/data-loader.js` until the write backend is proven.

## Questions / decisions still open

1. Who is allowed to write?
   - Single DM only?
   - A small allowlist?
   - Any signed-in member of a Google Workspace/domain?

2. What is the auth model?
   - Apps Script session email?
   - Google Identity Services on the frontend?
   - A backend proxy?
   - Temporary shared secret only for local prototype testing?

3. What are the exact ID formats?
   - Are current IDs already `POI-0001`, `NPC-0001`, etc.?
   - Do any IDs have non-numeric suffixes?
   - Should IDs be per entity globally or scoped by region/type?

4. What are the exact sheet tab names and headers?
   - The current config uses likely names, not guaranteed names.
   - Confirm every allowed field against the real header row before live writes.

5. What is the Drive folder structure?
   - Separate folders for POIs, NPCs, maps?
   - Region-specific folders?
   - Public/player-visible assets separated from DM-only assets?

6. Does DM-only content need separate protection?
   - Currently the app has no planned player-visible data split.
   - If players can access the frontend and published CSVs, DM-only content in published sheets may be visible unless separated.

7. Do edits need audit logs or version history?
   - Google Sheets version history helps, but record-level audit rows may be better.
   - Consider an `Audit_Log` tab before allowing broad edits.

8. How strict should validation become?
   - Reference checks against known `Hex_ID`, `Region_ID`, `POI_Group_ID`, etc. can be added.
   - Enum validation can be added for POI type, terrain, visibility, source type, and so on.

9. What should happen on duplicate IDs or malformed existing IDs?
   - Current behavior scans valid numeric suffixes and skips duplicates defensively.
   - Malformed IDs are ignored for next-ID calculation.

10. What frontend UX should own writes?
    - Create buttons on index pages?
    - Edit buttons on detail pages?
    - Mobile utility modal integration?
    - DM-only editor mode?

## Known limitations

- No production-grade auth yet.
- No audit log tab yet.
- No reference integrity checks yet.
- No enum validation yet.
- No frontend adapter yet.
- No automated tests yet.
- Base64 uploads from a browser can be memory-heavy for large files.
- Apps Script CORS and identity behavior may require deployment-specific testing.
