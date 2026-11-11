# מלחמת הבלובים · Blob Wars

קרב ארטילריה בתורות: שתי קבוצות בלובים, 30+ נשקים, 11 זירות הרוסות, ומשחק ברשת עם חבר.
A turn-based artillery game for Windows: two teams of blobs, 30+ weapons, 11 destructible arenas — and online play with a friend.

## הורדה והפעלה · Download and run

1. מורידים את `BlobWars-<version>-win-x64.zip` מעמוד ה-**Releases** של המאגר.
2. קליק ימני על הקובץ ← **Extract All** (לחלץ קודם — לא להריץ מתוך ה-zip).
3. פותחים את התיקייה `BlobWars` ומריצים את `BlobWars.exe`.

- Windows עלול להציג **"Windows protected your PC"** כי הקובץ לא חתום: **More info ← Run anyway**.
- בפעם הראשונה ש-Windows שואל על חומת האש — לאשר (**Allow**), אחרת משחק ברשת עלול לא להתחבר.

Download the zip from **Releases**, extract it (don't run it from inside the zip), and run `BlobWars\BlobWars.exe`.
The exe is unsigned, so SmartScreen may warn: *More info → Run anyway*. Allow it through the firewall if asked.

## משחק ברשת · Playing online

| מי | מה עושים |
|---|---|
| המארח | **🌐 משחק ברשת עם חבר ← צור חדר חדש**, ושולח לחבר את הקוד בן 5 התווים |
| החבר | **🌐 משחק ברשת עם חבר**, מקליד את הקוד ← **הצטרף** |
| המארח | בוחר זירה והגדרות (החבר רואה אותן) ← **▶ התחל משחק ברשת** |

- המארח הוא האדומים ומתחיל ראשון; ב**משחק חוזר** מתחלפים הצבעים ומי שמתחיל.
- Esc פותח תפריט, אבל המשחק **ממשיך** — אי אפשר לעצור משחק ברשת באמצע.
- שני השחקנים צריכים **את אותה גרסה** של המשחק.

One player creates a room and sends the 5-character code; the other joins with it. The host picks the
rules and starts; rematches swap colours so the first move alternates. Both players need the same build.

### How it works

- **No server of our own.** The free public [PeerJS](https://peerjs.com) server only introduces the two PCs (the
  room code is a PeerJS id). The match itself runs over a direct WebRTC data channel; when a router blocks that,
  PeerJS's public TURN relay carries it instead.
- **Deterministic lockstep.** Both PCs run the identical simulation at 60 ticks/s and only inputs travel. The player
  whose turn it is streams their input for every tick; the other PC replays those ticks and never runs ahead of
  them. Everything random in the game comes from one seeded generator, and the guest uses the host's terrain mask
  (canvas anti-aliasing can differ between GPUs), so both sides stay bit-for-bit identical. A state hash is
  compared every second, and a desync would show a warning on screen.

## Development

```sh
npm install
npm start               # run from source (Electron)
npm run package         # → dist/BlobWars-win32-x64/BlobWars.exe
npm run dist            # package + zip → release/BlobWars-<version>-win-x64.zip (for sharing)
npm run install-app     # install the packaged build for this user, with Desktop + Start Menu shortcuts
npm run vendor          # refresh app/vendor/peerjs.min.js from node_modules after upgrading peerjs
```

The whole game is `app/index.html` (canvas + Web Audio, no framework); `main.js` is the locked-down Electron shell.
`window.__dbg` exposes the simulation (`step`, `newGame`, `NET`, `stateHash`, …) for headless tests.
