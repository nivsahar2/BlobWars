'use strict';
/**
 * Desktop shell for "מלחמת הבלובים" (Blob Wars).
 *
 * The game itself is one self-contained HTML file (app/index.html) with no Node usage, so the window
 * is locked down: sandboxed, no node integration, no navigation, no popups. Its only network use is
 * online play: PeerJS (app/vendor) asks the public PeerJS server to introduce two players, then the
 * match runs over a direct WebRTC data channel — none of that needs anything from the main process.
 * localStorage (settings + win record) persists automatically in the app's userData folder.
 */
const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');

// A second launch (double-clicking the shortcut again) focuses the running game instead of opening a twin.
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

/** @type {BrowserWindow | null} */
let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    // Below ~900px wide the game's "rotate your phone" overlay and stacked menu kick in — keep it desktop-sized.
    minWidth: 900,
    minHeight: 560,
    backgroundColor: '#0b1730', // matches the game's page background, so there is no white flash on launch
    title: 'מלחמת הבלובים',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      // The game builds its WebAudio context on first input; this lets a key press (not only a click) start sound.
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });

  const wc = win.webContents;

  // There is no menu bar, so wire the usual fullscreen shortcuts by hand: F11 and Alt+Enter.
  wc.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11' || (input.alt && input.key === 'Enter')) {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  // The page has its own camera zoom (wheel / +/-); stop Chromium from also zooming the whole page.
  wc.setVisualZoomLevelLimits(1, 1);
  wc.on('zoom-changed', () => wc.setZoomFactor(1));

  // The game never navigates or opens windows; refuse anything that tries.
  wc.on('will-navigate', (event) => event.preventDefault());
  wc.setWindowOpenHandler(() => ({ action: 'deny' }));

  win.on('closed', () => {
    win = null;
  });
}

app.on('second-instance', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

// No application menu: it would add Ctrl+R (reload = lose the match) and Ctrl+Shift+I accelerators.
Menu.setApplicationMenu(null);

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
