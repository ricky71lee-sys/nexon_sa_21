/**
 * Asset rename + reference update
 * Convention: kebab-case, -pc / -mo / -tb suffixes
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG_DIR = path.join(ROOT, "assets", "images");

/** Explicit overrides (irregular legacy names) */
const OVERRIDES = {
  "event1_mobile_div1_01.png": "event01-panel-bg-phase-01-mo.png",
  "event1_mobile_div1_02.png": "event01-panel-bg-phase-02-mo.png",
  "event1_mobile_div1_03.png": "event01-panel-bg-phase-03-mo.png",
  "event1_mobile_div1_04.png": "event01-panel-bg-phase-04-mo.png",
  "event2_mobile_div-bg.png": "event02-panel-bg-mo.png",
  "attendance_mobile_div-bg.png": "event02-attendance-bg-mo.png",
  "hero_mobile_bg.png": "hero-bg-mo.png",
  "hero_desc_mobile.png": "hero-desc-mo.png",
  "hero_desc_tablet.png": "hero-desc-tb.png",
  "event03_bg_mobile22.png": "event03-bg-mo.png",
  "watch-d-01.png": "watch-detail-01-mo.png",
  "watch-d-02.png": "watch-detail-02-mo.png",
  "watch-d-03.png": "watch-detail-03-mo.png",
  "watch-d-04.png": "watch-detail-04-mo.png",
  "watch_event1.png": "watch-event-01-pc.png",
  "watch_event2.png": "watch-event-02-pc.png",
  "watch_event3.png": "watch-event-03-pc.png",
  "watch_event4.png": "watch-event-04-pc.png",
  "watch_event5.png": "watch-event-04-pc.png",
  "watch_event_num.png": "watch-event-num.png",
  "watch_reward_01_1.png": "watch-reward-01-1.png",
  "watch_reward_01_2.png": "watch-reward-01-2.png",
  "watch_reward_04.png": "watch-reward-04.png",
  "watch_reward_05.png": "watch-reward-05.png",
  "ms_icon_7.png": "ms-icon-07-pc.png",
  "ms_icon_7_mobile.png": "ms-icon-07-mo.png",
  "ms_icon_14.png": "ms-icon-14-pc.png",
  "ms_icon_14_mobile.png": "ms-icon-14-mo.png",
  "ms_icon_21.png": "ms-icon-21-pc.png",
  "ms_icon_21_mobile.png": "ms-icon-21-mo.png",
  "ms_icon_duo5.png": "ms-icon-duo-05-pc.png",
  "ms_icon_duo5_mobile.png": "ms-icon-duo-05-mo.png",
  "icon-duo-user.png": "icon-duo-user.png",
  "icon_duo_user.svg": "icon-duo-user.svg",
  "og_share.png": "og-share.png",
  "menu/mo_close.svg": "menu/mo-close.svg",
  "menu/mo_arrow.svg": "menu/mo-arrow.svg",
  "menu/mo_arrow_active.svg": "menu/mo-arrow-active.svg",
  "menu/mo_gift.svg": "menu/mo-gift.svg",
  "menu/mo_swap.svg": "menu/mo-swap.svg",
  "menu/mo_logo.png": "menu/mo-logo.png",
};

const DELETE_FILES = [
  "Group 31.png",
  "Property 1=Variant2.png",
  "image 27.png",
  "medal_ringv3.png",
  "event03-02-title_mobile.png",
  "event03-03-title_mobile.png",
];

function toKebab(name) {
  return name
    .replace(/_/g, "-")
    .replace(/([a-z])(\d)/g, "$1-$2")
    .replace(/-+/g, "-");
}

function convertFilename(file) {
  if (OVERRIDES[file]) return OVERRIDES[file];

  const parts = file.split("/");
  const base = parts.pop();
  const dir = parts.length ? parts.join("/") + "/" : "";

  const mMobile = base.match(/^(.+)_mobile(\.[a-z0-9]+)$/i);
  if (mMobile) {
    const stem = toKebab(mMobile[1].replace(/_mobile$/i, ""));
    return dir + stem + "-mo" + mMobile[2].toLowerCase();
  }

  const mTablet = base.match(/^(.+)_tablet(\.[a-z0-9]+)$/i);
  if (mTablet) {
    return dir + toKebab(mTablet[1]) + "-tb" + mTablet[2].toLowerCase();
  }

  const mHover = base.match(/^(.+)_hover(\.[a-z0-9]+)$/i);
  if (mHover) {
    return dir + toKebab(mHover[1]) + "-hover" + mHover[2].toLowerCase();
  }

  const mCal = base.match(/^cal-reward-icon-(\d{2})(-pc|-mo)?(\.[a-z0-9]+)$/i);
  if (mCal) return file;

  const mCalOld = base.match(/^cal_reward_icon(\d{2})(_mobile)?(\.[a-z0-9]+)$/i);
  if (mCalOld) {
    const suffix = mCalOld[2] ? "-mo" : "-pc";
    return dir + "cal-reward-icon-" + mCalOld[1] + suffix + mCalOld[3].toLowerCase();
  }

  const dot = base.lastIndexOf(".");
  if (dot === -1) return file;
  const stem = base.slice(0, dot);
  const ext = base.slice(dot).toLowerCase();

  if (/-(pc|mo|tb|hover|active)$/.test(stem)) {
    return dir + toKebab(stem) + ext;
  }

  if (stem.includes("_") || /[a-z]\d/.test(stem) || stem.includes("-")) {
    return dir + toKebab(stem) + "-pc" + ext;
  }

  return dir + stem + ext;
}

function walkImages(dir, prefix = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walkImages(path.join(dir, entry.name), rel));
    else out.push(rel.replace(/\\/g, "/"));
  }
  return out;
}

function updateSources(replacements) {
  const files = [];
  function walk(d, ext) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory() && e.name !== "node_modules") walk(p, ext);
      else if (e.isFile() && ext.some((x) => e.name.endsWith(x))) files.push(p);
    }
  }
  walk(ROOT, [".html", ".js", ".scss", ".md", ".json"]);

  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    let changed = false;
    for (const [oldName, newName] of replacements) {
      if (oldName === newName) continue;
      if (content.includes(oldName)) {
        content = content.split(oldName).join(newName);
        changed = true;
      }
    }
    if (changed) fs.writeFileSync(file, content, "utf8");
  }
}

function patchJsHelpers() {
  const eventJs = path.join(ROOT, "assets", "scripts", "event.js");
  let js = fs.readFileSync(eventJs, "utf8");

  js = js.replace(
    /function calIconPath\(index, mobile = false\) \{[\s\S]*?\}/,
    `function calIconPath(index, mobile = false) {
        const n = String(index + 1).padStart(2, "0");
        return "./assets/images/cal-reward-icon-" + n + (mobile ? "-mo" : "-pc") + ".png";
      }`
  );

  js = js.replace(
    /function msIconPath\(iconFile, mobile = false\) \{[\s\S]*?\}/,
    `function msIconPath(iconFile, mobile = false) {
        if (!iconFile) return "";
        const file = mobile ? iconFile.replace(/-pc\\.png$/i, "-mo.png") : iconFile;
        return "./assets/images/" + file;
      }`
  );

  js = js.replace(/icon: "ms_icon_7\.png"/, 'icon: "ms-icon-07-pc.png"');
  js = js.replace(/icon: "ms_icon_14\.png"/, 'icon: "ms-icon-14-pc.png"');
  js = js.replace(/icon: "ms_icon_21\.png"/, 'icon: "ms-icon-21-pc.png"');
  js = js.replace(/icon: "ms_icon_duo5\.png"/, 'icon: "ms-icon-duo-05-pc.png"');
  js = js.replace(/icon: "watch_event5\.png"/, 'icon: "watch-event-04-pc.png"');

  fs.writeFileSync(eventJs, js, "utf8");
}

function patchHtmlClasses() {
  const htmlPath = path.join(ROOT, "index.html");
  let html = fs.readFileSync(htmlPath, "utf8");
  html = html
    .replace(/event-01-title/g, "sec-title--event01")
    .replace(/event-02-title/g, "sec-title--event02")
    .replace(/event-03-title/g, "sec-title--event03")
    .replace(/event-04-title/g, "sec-title--event04")
    .replace(
      /event1_mobile_div1_0/g,
      "event01-panel-bg-phase-0"
    )
    .replace(/\.png'/g, (m, off) => {
      return m;
    });
  html = html.replace(
    "'./assets/images/event01-panel-bg-phase-0' + medal.phase + '.png'",
    "'./assets/images/event01-panel-bg-phase-0' + medal.phase + '-mo.png'"
  );
  html = html.replace(/srcset="assets\/images\//g, 'srcset="./assets/images/');
  html = html.replace(/src="assets\/images\//g, 'src="./assets/images/');
  fs.writeFileSync(htmlPath, html, "utf8");

  const sectionScss = path.join(ROOT, "assets", "styles", "partials", "components", "_section.scss");
  let scss = fs.readFileSync(sectionScss, "utf8");
  scss = scss
    .replace(/\.event-01-title/g, ".sec-title--event01")
    .replace(/\.event-02-title/g, ".sec-title--event02")
    .replace(/\.event-03-title/g, ".sec-title--event03")
    .replace(/\.event-04-title/g, ".sec-title--event04");
  fs.writeFileSync(sectionScss, scss, "utf8");
}

// --- run ---
const allFiles = walkImages(IMG_DIR);
const renames = [];
for (const file of allFiles) {
  const next = convertFilename(file);
  if (next !== file) renames.push([file, next]);
}

// longest first to avoid partial replace issues in file paths
renames.sort((a, b) => b[0].length - a[0].length);

console.log(`Renaming ${renames.length} files...`);
for (const [oldRel, newRel] of renames) {
  const oldAbs = path.join(IMG_DIR, oldRel);
  const newAbs = path.join(IMG_DIR, newRel);
  if (!fs.existsSync(oldAbs)) continue;
  fs.mkdirSync(path.dirname(newAbs), { recursive: true });
  if (fs.existsSync(newAbs)) {
    console.warn("Skip (target exists):", oldRel, "->", newRel);
    continue;
  }
  fs.renameSync(oldAbs, newAbs);
  try {
    execSync(`git add "${oldAbs.replace(/\\/g, "/")}" "${newAbs.replace(/\\/g, "/")}"`, {
      cwd: ROOT,
      stdio: "ignore",
    });
  } catch {
    /* not in git yet */
  }
}

console.log("Updating source references...");
updateSources(renames);
patchJsHelpers();
patchHtmlClasses();

console.log("Deleting junk files...");
for (const file of DELETE_FILES) {
  const abs = path.join(IMG_DIR, file);
  if (fs.existsSync(abs)) {
    fs.unlinkSync(abs);
    console.log("Deleted:", file);
  }
}

console.log("Done. Run npm run build to refresh style.css");
