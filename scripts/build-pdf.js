// Rebuild pdf/ from the course HTML files.
//
//   node scripts/build-pdf.js            # write straight into pdf/
//   node scripts/build-pdf.js out        # write into out/ instead
//   node scripts/build-pdf.js out 2 5    # only sessions 2 and 5 (plus nothing else)
//
// Page size comes from each file's own @page rule (preferCSSPageSize).
// Note: file names use Latin digits (جلسه-1_جزوه.pdf), not Persian ones.
//
// Requires the `playwright` package installed globally. It uses the bundled
// Chromium when present and falls back to the system Chrome channel, so do
// not run `playwright install` — in the cloud environment Chromium already
// sits in /opt/pw-browsers.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');

const REPO = path.resolve(__dirname, '..');
const DOCS = [
  ['article_fa/index.html', 'مقالهٔ-ترجمه‌شده'],
  ['handout.html', 'جزوه'],
  ['slides.html', 'اسلایدها'],
  ['syllabus.html', 'سیلابس'],
  ['teacher_guide.html', 'دفترچهٔ-استاد'],
];

function targets(sessions) {
  const out = [];
  for (let n = 1; n <= 5; n++) {
    if (sessions.length && !sessions.includes(String(n))) continue;
    for (const [src, fa] of DOCS) {
      const p = path.join('session_' + n, src);
      if (fs.existsSync(path.join(REPO, p))) out.push([p, `جلسه-${n}_${fa}`]);
    }
  }
  if (!sessions.length) {
    out.push(['glossary.html', '00_واژه‌نامهٔ-دوره'], ['index.html', '00_صفحهٔ-دوره']);
  }
  return out;
}

async function launch() {
  try {
    return await chromium.launch();
  } catch (e) {
    console.log('bundled Chromium unavailable, using system Chrome');
    return await chromium.launch({ channel: 'chrome' });
  }
}

(async () => {
  const outDir = path.resolve(REPO, process.argv[2] || 'pdf');
  const sessions = process.argv.slice(3);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await launch();
  for (const [src, out] of targets(sessions)) {
    const page = await browser.newPage();
    await page.goto('file://' + path.join(REPO, src).replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page.pdf({
      path: path.join(outDir, out + '.pdf'),
      preferCSSPageSize: true,
      printBackground: true,
    });
    await page.close();
    console.log(out + '.pdf');
  }
  await browser.close();
})();
