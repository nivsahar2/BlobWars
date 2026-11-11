'use strict';
/**
 * Generates build/icon.ico (+ build/icon.png) — a red blob in the game's own art style.
 *
 * Run with Electron (`npm run icon`): a hidden window draws the icon on a <canvas> at each size,
 * so small sizes are drawn natively (crisp) rather than downscaled from 256px.
 * The .ico uses PNG-compressed entries, which Windows has supported at every size since Vista.
 */
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const SIZES = [16, 24, 32, 48, 64, 128, 256];
const OUT = path.join(__dirname, '..', 'build');

// Drawn in a 100×100 design space, scaled to the target size. Colors come from the game:
// red team #ff5a4d / #8f1d15, sky #3d8fe0 → #9fd4f5, grass [108,196,62], antenna ball #ffd640.
const DRAW = `
function draw(S){
  const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
  g.scale(S/100,S/100);
  const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
  // tile: sky + rolling grass hill, clipped to a rounded square
  rr(3,3,94,94,22);g.save();g.clip();
  const sky=g.createLinearGradient(0,0,0,100);sky.addColorStop(0,'#3d8fe0');sky.addColorStop(1,'#bfe4fa');g.fillStyle=sky;g.fillRect(0,0,100,100);
  g.fillStyle='#8d5b34';g.beginPath();g.moveTo(0,100);g.lineTo(0,80);g.quadraticCurveTo(50,66,100,80);g.lineTo(100,100);g.fill();
  g.fillStyle='rgb(108,196,62)';g.beginPath();g.moveTo(0,84);g.lineTo(0,78);g.quadraticCurveTo(50,64,100,78);g.lineTo(100,84);g.quadraticCurveTo(50,70,0,84);g.fill();
  g.restore();
  // blob
  const lw=S<=24?5:3.4;g.lineJoin='round';
  g.strokeStyle='#8f1d15';g.lineWidth=lw;
  g.beginPath();g.moveTo(48,28);g.quadraticCurveTo(38,14,47,9);g.stroke();
  g.fillStyle='#ffd640';g.beginPath();g.arc(47,10,5.5,0,7);g.fill();g.stroke();
  g.fillStyle='#ff5a4d';g.beginPath();g.ellipse(50,54,31,29,0,0,7);g.fill();g.stroke();
  if(S>=32){g.fillStyle='rgba(255,255,255,.32)';g.beginPath();g.ellipse(36,42,7,10,-.5,0,7);g.fill()}
  // eyes look right, like a blob facing the enemy
  g.fillStyle='#fff';g.beginPath();g.arc(53,47,9.5,0,7);g.arc(70,47,8,0,7);g.fill();
  g.fillStyle='#16203a';g.beginPath();g.arc(56.5,47,4.6,0,7);g.arc(73,47,4,0,7);g.fill();
  if(S>=24){g.strokeStyle='#8f1d15';g.lineWidth=lw*.9;g.lineCap='round';g.beginPath();g.arc(62,59,8,.25,Math.PI-.55);g.stroke()}
  return c.toDataURL('image/png');
}`;

/** Packs PNG buffers into an ICO container: ICONDIR + one ICONDIRENTRY per image, then the PNG bytes. */
function buildIco(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e); // 0 means 256
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt8(0, e + 2); // palette colors
    header.writeUInt8(0, e + 3); // reserved
    header.writeUInt16LE(1, e + 4); // color planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(png.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((im) => im.png)]);
}

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  await w.loadURL('data:text/html,<!doctype html><title>icon</title>');
  await w.webContents.executeJavaScript(DRAW);
  const images = [];
  for (const size of SIZES) {
    const url = await w.webContents.executeJavaScript(`draw(${size})`);
    images.push({ size, png: Buffer.from(url.split(',')[1], 'base64') });
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'icon.ico'), buildIco(images));
  fs.writeFileSync(path.join(OUT, 'icon.png'), images[images.length - 1].png);
  console.log(`icon.ico written (${SIZES.join(', ')} px)`);
  app.quit();
});
