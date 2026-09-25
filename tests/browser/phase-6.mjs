// Run against tests.e2e_app ONLY; fixtures and destructive targets are synthetic.
// HOPE_PLAYWRIGHT_MODULE may point to an existing Playwright installation.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.HOPE_PLAYWRIGHT_MODULE || 'playwright');
const base = 'http://127.0.0.1:8766';
const output = process.env.HOPE_EVIDENCE_DIR || 'docs/evidence/phase-6';
await mkdir(output, { recursive:true });
const browser = await chromium.launch({ headless:true, executablePath:process.env.HOPE_CHROME_PATH });
const errors = [];
async function screenshot(path) {
  await page.evaluate(()=>{const el=document.createElement('small');el.id='evidence-label';el.textContent='Implementação em andamento · dados de teste';el.style.cssText='position:fixed;bottom:0;right:0;z-index:9999;background:#030609;color:#fff8e9;padding:3px 6px;font:11px sans-serif';document.body.append(el);});
  await page.screenshot({path,fullPage:true,animations:'disabled'});await page.locator('#evidence-label').evaluate(el=>el.remove());
}
const context = await browser.newContext({ viewport:{width:1440,height:900} });
const page = await context.newPage();
page.setDefaultTimeout(10000);
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if(m.type()==='error') errors.push(m.text()); });
page.on('response', r => { if(r.status()>=400 && /\/(js|styles)\//.test(r.url())) errors.push(`${r.status()} ${r.url()}`); });
try {
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector('#memory-globe-shell').dataset.state === 'ready');
  assert.equal(await page.locator('#memory-enabled').isChecked(),false);
  assert.equal(await page.locator('#persist-history').isChecked(),false);
  assert.equal(await page.locator('#webgl-fallback').isVisible(),false);
  for (const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[1280,720],[1440,900],[1920,1080]]) {
    await page.setViewportSize({width,height});
    await page.reload();await page.waitForFunction(()=>document.querySelector('#memory-globe-shell').dataset.state==='ready');
    assert.equal(await page.locator('#globe-quality').inputValue(),width<=680?'low':width<1280?'medium':'high');
    await screenshot(`${output}/${width}x${height}-chat.png`);
    const geometry = await page.evaluate(() => ({width:document.documentElement.scrollWidth,viewport:innerWidth,send:document.querySelector('#send-button').getBoundingClientRect().bottom,height:innerHeight}));
    console.log('viewport',width,height,geometry);
    assert.ok(geometry.width<=width,`Horizontal overflow at ${width}`);
    if(width===1280) assert.ok(geometry.send<=height,'Composer not visible at 1280x720');
    if(width<=980) {
      assert.equal(await page.locator('#conversation').isVisible(),true);
      await page.locator('#show-memory').click();
      await screenshot(`${output}/${width}x${height}-memory.png`);
      await page.locator('#globe-close').click();
    }
  }
  await page.setViewportSize({width:1440,height:900});
  await page.locator('#memory-enabled').check();
  await page.locator('#prompt').fill('O que você sabe sobre a arquitetura da HOPE?');
  await page.locator('#prompt').press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.message.assistant').length===1);
  assert.equal(await page.locator('.message-body img').count(),0);
  assert.ok(await page.locator('.message-context').count());
  await page.locator('#globe-list-toggle').click();
  await page.locator('#memory-list button').first().click();
  await page.waitForFunction(() => !document.querySelector('#memory-provenance').textContent.includes('Recuperando'));
  await page.waitForTimeout(450);await screenshot(`${output}/inspector-desktop.png`);
  await page.locator('#memory-forget').click();
  assert.equal(await page.locator('#memory-delete-cancel').evaluate(el=>el===document.activeElement),true);
  await screenshot(`${output}/confirmation.png`);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#memory-delete-dialog').isVisible(),false);
  await page.locator('#memory-inspector-close').click();
  await page.locator('#prompt').fill('aguarde');
  await page.locator('#send-button').click();
  await page.locator('#cancel-button').click();
  assert.equal(await page.locator('#hope-state').getAttribute('data-state'),'idle');
  await page.waitForTimeout(3300);
  assert.equal(await page.locator('#hope-state').getAttribute('data-state'),'idle');
  assert.equal(await page.locator('.message.assistant').count(),1);
  assert.deepEqual(errors,[]);
  console.log('PASS: viewport, opt-in, chat, inert HTML, contextual sources, inspector, safe cancel, operational cancellation; console/assets clean');
} finally { await browser.close(); }
