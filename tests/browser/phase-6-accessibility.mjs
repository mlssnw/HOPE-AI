import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.HOPE_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.HOPE_CHROME_PATH});
const report={browser:browser.version(),viewports:[],contrast:[],focus:[]};
try {
  for(const [width,height,scale,textScale,name] of [[320,568,1,1,'small'],[390,844,1,1,'mobile'],[844,390,1,1,'landscape'],[720,450,2,1,'zoom-200-reflow'],[1440,900,1,1.3,'text-130']]) {
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:scale,isMobile:false,hasTouch:width<981});
    const page=await context.newPage();page.setDefaultTimeout(10000);
    await page.goto('http://127.0.0.1:8766');await page.waitForFunction(()=>document.querySelector('#memory-globe-shell').dataset.state==='ready');
    if(textScale!==1)await page.evaluate(factor=>document.documentElement.style.fontSize=`${16*factor}px`,textScale);
    const bounds=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,height:innerHeight,send:document.querySelector('#send-button').getBoundingClientRect().bottom,switchBottom:document.querySelector('#surface-switcher').getBoundingClientRect().bottom}));
    report.viewports.push({name,width,height,scale,textScale,...bounds});
    assert.ok(bounds.scrollWidth<=width,`${name}: horizontal overflow`);
    if(name==='small')assert.ok(bounds.switchBottom<=height,'320x568 primary surface switch is outside viewport');
    await page.locator('#prompt').focus();await page.locator('#prompt').fill('Rascunho com zoom e teclado');
    await page.locator('#send-button').scrollIntoViewIfNeeded();
    const send=await page.locator('#send-button').boundingBox();assert.ok(send.y>=0&&send.y+send.height<=height);
    await page.evaluate(()=>{const el=document.createElement('small');el.textContent='Implementação em andamento · dados de teste';el.style.cssText='position:fixed;bottom:0;right:0;z-index:9999;background:#030609;color:#fff8e9;padding:3px 6px;font:11px sans-serif';document.body.append(el);});
    await page.screenshot({path:`docs/evidence/phase-6/accessibility-${name}.png`,fullPage:true});
    if(name==='text-130') {
      report.accessibilityTree=await page.locator('body').ariaSnapshot();
      report.focus=await page.evaluate(()=>[...document.querySelectorAll('button,input,textarea,select,summary,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length).map(el=>el.id||el.textContent.trim()));
      const pairs=[['normal','#fff8e9','#1b2c38',4.5],['secondary','#b8ae9c','#1b2c38',4.5],['primary text','#030609','#f2ae3d',4.5],['danger text','#ff8796','#24131a',4.5],['focus','#ffd98a','#11110f',3],['control border','#84765b','#0b1015',3]];
      const luminance=hex=>{const rgb=hex.match(/[a-f0-9]{2}/gi).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
      for(const [label,fg,bg,min] of pairs){const a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);report.contrast.push({label,fg,bg,ratio});assert.ok(ratio>=min,label);}
      const focus=await page.locator('#prompt').evaluate(el=>({width:getComputedStyle(el).outlineWidth,style:getComputedStyle(el).outlineStyle}));
      // Keyboard focus, unlike a mouse click, must have a visible 2px indicator.
      await page.locator('#prompt').focus();await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineWidth),'2px');
    }
    await context.close();
  }
  await writeFile('docs/evidence/phase-6/accessibility-results.json',JSON.stringify(report,null,2));
  console.log('PASS accessible bounds, 200% reflow equivalent, 130% text, landscape reachability, contrast and focus');
} finally {await browser.close();}
