/**
 * Post-rename fixes: correct paths, normalize event01 naming, remove legacy duplicates
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG = path.join(ROOT, "assets", "images");

const FILE_RENAMES = [
  ["event-01-title-pc.png", "event01-title-pc.png"],
  ["event-01-title-mo.png", "event01-title-mo.png"],
  ["event-02-title-pc.png", "event02-title-pc.png"],
  ["event-02-title-mo.png", "event02-title-mo.png"],
  ["event-03-title-pc.png", "event03-title-pc.png"],
  ["event-03-title-mo.png", "event03-title-mo.png"],
  ["event-04-title-pc.png", "event04-title-pc.png"],
  ["event-04-title-mo.png", "event04-title-mo.png"],
  ["event-03-match-date-pc.png", "event03-match-date-pc.png"],
  ["caster-kim-pc.png", "caster-kim.png"],
  ["caster-son-pc.png", "caster-son.png"],
  ["caster-gyuni-pc.png", "caster-gyuni.png"],
];

const TEXT_REPLACEMENTS = [
  ["sec-title--event01-pc.png", "event01-title-pc.png"],
  ["sec-title--event01-mo.png", "event01-title-mo.png"],
  ["sec-title--event02-pc.png", "event02-title-pc.png"],
  ["sec-title--event02-mo.png", "event02-title-mo.png"],
  ["sec-title--event03-pc.png", "event03-title-pc.png"],
  ["sec-title--event03-mo.png", "event03-title-mo.png"],
  ["sec-title--event04-pc.png", "event04-title-pc.png"],
  ["sec-title--event04-mo.png", "event04-title-mo.png"],
  ["event-01-title-pc.png", "event01-title-pc.png"],
  ["event-01-title-mo.png", "event01-title-mo.png"],
  ["event-02-title-pc.png", "event02-title-pc.png"],
  ["event-02-title-mo.png", "event02-title-mo.png"],
  ["event-03-title-pc.png", "event03-title-pc.png"],
  ["event-03-title-mo.png", "event03-title-mo.png"],
  ["event-04-title-pc.png", "event04-title-pc.png"],
  ["event-04-title-mo.png", "event04-title-mo.png"],
  ["event-03-match-date-pc.png", "event03-match-date-pc.png"],
  ["caster-kim-pc.png", "caster-kim.png"],
  ["caster-son-pc.png", "caster-son.png"],
  ["caster-gyuni-pc.png", "caster-gyuni.png"],
  ["'./assets/images/sns_' + link.icon + '.png'", "'./assets/images/sns-' + link.icon + '-pc.png'"],
  ["'./assets/images/sns_' + link.icon + '_hover.png'", "'./assets/images/sns-' + link.icon + '-hover.png'"],
  ["'assets/images/watch-d-' + ev.no + '.png'", "'./assets/images/watch-detail-' + ev.no + '-mo.png'"],
  ["share_kakao.svg", "share-kakao.svg"],
  ["share_facebook.svg", "share-facebook.svg"],
  ["share_x.svg", "share-x.svg"],
  ["share_instagram.svg", "share-instagram.svg"],
  ["share_link.svg", "share-link.svg"],
];

const DELETE_LEGACY = [
  "sns_home.png", "sns_home_hover.png", "sns_facebook.png", "sns_facebook_hover.png",
  "sns_youtube.png", "sns_youtube_hover.png", "sns_instagram.png", "sns_instagram_hover.png",
  "side_nav_medal.png", "side_nav_medal_hover.png", "side_nav_attend.png", "side_nav_attend_hover.png",
  "side_nav_showcase.png", "side_nav_showcase_hover.png", "side_nav_vault.png", "side_nav_exchange.png",
  "watch_event1.png", "watch_event2.png", "watch_event3.png", "watch_event4.png", "watch_event5.png",
  "watch_event_num.png", "watch_reward_01_1.png", "watch_reward_01_2.png", "watch_reward_04.png", "watch_reward_05.png",
  "event-01-title-pc.svg", "event-02-title-pc.svg", "event-03-title-pc.svg", "event-04-title-pc.svg",
  "event-03-02-title-mo.png", "event-03-03-title-mo.png",
  "Property 1=Variant2.png",
];

function walk(d, exts, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory() && e.name !== "node_modules") walk(p, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

for (const [oldName, newName] of FILE_RENAMES) {
  const oldAbs = path.join(IMG, oldName);
  const newAbs = path.join(IMG, newName);
  if (fs.existsSync(oldAbs) && !fs.existsSync(newAbs)) fs.renameSync(oldAbs, newAbs);
}

for (const file of walk(ROOT, [".html", ".js", ".scss", ".md", ".json"])) {
  let c = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const [a, b] of TEXT_REPLACEMENTS) {
    if (c.includes(a)) { c = c.split(a).join(b); changed = true; }
  }
  if (changed) fs.writeFileSync(file, c, "utf8");
}

// SCSS legacy class names
const completeScss = path.join(ROOT, "assets/styles/partials/events/_event01-complete.scss");
let cs = fs.readFileSync(completeScss, "utf8");
cs = cs
  .replace(/\.medal_complete_visual_mobile/g, ".medal-complete__visual-img--mo")
  .replace(/\.medal_complete_visual-img/g, ".medal-complete__visual-img")
  .replace(/\.medal_complete_visual_pc/g, ".medal-complete__visual-img--pc");
fs.writeFileSync(completeScss, cs, "utf8");

// index.html medal complete picture classes if any
const htmlPath = path.join(ROOT, "index.html");
let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(/medal_complete_visual/g, "medal-complete__visual-img");
fs.writeFileSync(htmlPath, html, "utf8");

for (const f of DELETE_LEGACY) {
  const abs = path.join(IMG, f);
  if (fs.existsSync(abs)) { fs.unlinkSync(abs); console.log("deleted", f); }
}

console.log("Post-fix done");
