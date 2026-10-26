# User studies

Static pages served with GitHub Pages. Answers are posted to a Google Sheet through a small Apps Script web app.

| Folder | What it is |
|---|---|
| `ranking/` | Study 1: rank four motion-transfer methods from best to worst |
| `config.js` | `ENDPOINT`, the Apps Script URL every study posts to (empty = preview mode, nothing is sent) |
| `apps_script/Code.gs` | The script that receives answers and writes them into the sheet |
| `tools/` | Build scripts that pick the examples and copy the videos |

## Study 1: ranking (`ranking/`)

There are 10 examples: 2 drawn at random (seed 20261026) from each of the 5 motions in the selected 50 pairs
(`v26/tools/quant6_best50_margin_yatim.json`). Each example shows the source motion, the target image and four videos: ours,
DisMo, the text baseline and FlexiAct. Participants click the four videos from best to worst on one overall question: how closely
each video follows the source motion while keeping the look of the target image.

- Each participant gets their own example order and their own A–D video positions in each example, so position and order effects
  average out. Nothing on screen names a method.
- The videos are the display copies from the Quant Set page. Every clip is retimed to the same 2.75 s and is 360 px tall, and
  DisMo and FlexiAct have their padding removed. All five clips loop together.
- `ranking/draw.json` lists the drawn pairs and which file belongs to which method.
- Rebuild with `python tools/build_ranking.py` (needs Pillow and ffprobe; reads the local diffusion-pipe folders).

The sheet gets one row per example, in a tab named `ranking`:

| Column | Meaning |
|---|---|
| `received` | Server time |
| `submission`, `participant` | One id per completed study; one id per browser (repeat takes share it) |
| `position` | Where the example came in this participant's order (1–10) |
| `trial`, `pair`, `motion`, `target` | Which example |
| `ranking` | Methods best to worst, e.g. `ours > flexiact > text > dismo` |
| `rank_ours`, `rank_dismo`, `rank_text`, `rank_flexiact` | Rank given to each method (1 = best) |
| `shown` | Which method sat at A–D |
| `seconds` | Time spent on the example |
| `started`, `finished`, `screen`, `user_agent` | Session details |

A `raw` tab keeps every submission exactly as received.

## Collecting answers (one-time setup)

1. Create a Google Sheet, for example "User study answers".
2. In the sheet, open **Extensions → Apps Script**. Replace the editor's contents with `apps_script/Code.gs` and save.
3. Click **Deploy → New deployment**. Choose type **Web app**, set **Execute as: Me** and **Who has access: Anyone**, then click
   **Deploy** and allow the permissions it asks for.
4. Copy the web-app URL (it ends in `/exec`) into `config.js`:
   `const ENDPOINT = 'https://script.google.com/macros/s/.../exec';`
5. Check the setup: open the URL in a browser. It should show `{"ok":true,"service":"userstudies"}`. Then finish the study once
   yourself; your rows should appear in the sheet. Delete those test rows before sharing the link.

If you edit `Code.gs` later, redeploy with **Deploy → Manage deployments → Edit → Version: New version**. This keeps the same URL.

## Hosting

1. Push this repo to GitHub.
2. Go to **Settings → Pages** and set **Deploy from a branch** to `main` / `(root)`.
3. The study is then at `https://timbrevideomotionspace.github.io/userstudies/ranking/`.

Local preview: run `python3 -m http.server 8765` in this folder, then open `http://127.0.0.1:8765/ranking/`.
