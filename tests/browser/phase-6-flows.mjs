// Browser regression suite. Start a FRESH tests.e2e_app on 127.0.0.1:8766.
// All deletion targets are the harness's synthetic UUIDs; never point at live data.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const {chromium}=await import(process.env.HOPE_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.HOPE_CHROME_PATH});
const base='http://127.0.0.1:8766', output='docs/evidence/phase-6';
const id='20000000-0000-4000-8000-000000000001';
const results=[];
await mkdir(output,{recursive:true});
const shot=async(page,name)=>{
  await page.evaluate(()=>{
    const label=document.createElement('div');label.id='evidence-label';label.textContent='Implementação em andamento · dados de teste';
    label.style.cssText='position:fixed;bottom:0;right:0;z-index:9999;background:#030609;color:#fff8e9;padding:3px 6px;font:11px sans-serif;pointer-events:none';
    document.body.append(label);
  });
  await page.screenshot({path:`${output}/${name}.png`,fullPage:true,animations:'disabled'});
  await page.locator('#evidence-label').evaluate(el=>el.remove());
};
const ready=page=>page.waitForFunction(()=>document.querySelector('#memory-globe-shell').dataset.state==='ready');
async function scenario(name,fn,options={}) {
  const context=await browser.newContext({viewport:{width:1440,height:900},...options});
  const page=await context.newPage();page.setDefaultTimeout(10000);
  const errors=[],badAssets=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{
    // 4xx/5xx are deliberate API failure scenarios below, never asset failures.
    if(message.type()==='error'&&!/Failed to load resource: the server responded with a status of (428|503|500)/.test(message.text()))errors.push(message.text());
  });
  page.on('response',response=>{if(response.status()>=400&&/\/(js|styles)\//.test(response.url()))badAssets.push(response.url());});
  try {await fn(page,context);assert.deepEqual(errors,[]);assert.deepEqual(badAssets,[]);results.push({name,status:'PASS'});console.log('PASS',name);}
  finally {await context.close();}
}
try {
  await scenario('opt-in/out, local history, message sources and keyboard',async page=>{
    const requests=[];page.on('request',r=>{if(r.url().endsWith('/api/chat'))requests.push(r.postDataJSON());});
    await page.goto(base);await ready(page);
    await page.keyboard.press('Tab');assert.equal(await page.locator('.skip-link').evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Enter');assert.equal(await page.locator('#prompt').evaluate(el=>el===document.activeElement),true);
    await page.locator('#prompt').fill('primeira linha');await page.locator('#prompt').press('Shift+Enter');
    assert.ok((await page.locator('#prompt').inputValue()).includes('\n'));assert.equal(requests.length,0);
    await page.locator('#prompt').fill('Olá');await page.locator('#prompt').press('Enter');
    await page.waitForFunction(()=>document.querySelectorAll('.message.assistant').length===1);
    assert.equal(requests[0].memory_enabled,false);
    assert.equal(await page.evaluate(()=>localStorage.getItem('hope.history.v1')),null);
    await page.locator('#persist-history').check();assert.equal(await page.locator('#memory-enabled').isChecked(),false);
    await page.locator('#memory-enabled').check();
    await page.locator('#prompt').fill('O que você sabe sobre a arquitetura da HOPE?');await page.locator('#prompt').press('Enter');
    await page.waitForFunction(()=>document.querySelectorAll('.message.assistant').length===2);
    assert.equal(requests[1].memory_enabled,true);
    assert.equal(await page.locator('.message.assistant .message-context').count(),2);
    assert.ok(await page.locator('.message-context button').count());
    await page.reload();await ready(page);assert.equal(await page.locator('.message').count(),4);
    await page.locator('#persist-history').uncheck();assert.equal(await page.locator('#memory-enabled').isChecked(),true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('hope.history.v1')),null);
    await page.locator('#clear-history').click();assert.equal(await page.locator('.message').count(),0);
    await page.locator('#memory-enabled').uncheck();
    await page.locator('#prompt').fill('erro controlado');await page.locator('#send-button').click();
    await page.waitForFunction(()=>document.querySelector('#urgent-status').textContent.length>0);
    assert.equal(await page.locator('#live-status').getAttribute('aria-live'),'polite');
    await shot(page,'chat-error');
  });
  await scenario('search, list, inspector, Escape and fullscreen focus',async page=>{
    await page.goto(base);await ready(page);
    await page.locator('#globe-search').fill('arquitetura');await page.locator('#globe-search').press('Enter');
    await page.waitForFunction(()=>!document.querySelector('#search-results').hidden);
    assert.ok(await page.locator('#memory-list button').count());
    await page.locator('#memory-list button').first().focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#memory-inspector-title').evaluate(el=>el===document.activeElement),true);
    await page.waitForTimeout(450);await shot(page,'inspector-focused');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#memory-inspector').isVisible(),false);
    assert.ok(await page.locator('#memory-list button').first().evaluate(el=>el===document.activeElement));
    await page.locator('#search-clear').click();await page.locator('#globe-list-toggle').click();
    await page.locator('#globe-expand').click();
    assert.equal(await page.locator('#conversation').evaluate(el=>el.inert),true);
    await page.keyboard.press('Shift+Tab');
    assert.ok(await page.locator('#memory-globe-shell').evaluate(el=>el.contains(document.activeElement)));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#globe-expand').evaluate(el=>el===document.activeElement),true);
    await page.locator('#globe-search').fill('sem-correspondencia-999');await page.locator('#globe-search').press('Enter');
    await page.waitForFunction(()=>document.querySelector('#search-summary').textContent.includes('Nenhuma'));
    assert.match(await page.locator('#globe-count').textContent(),/3 memórias/);
    await shot(page,'search-empty');
  });
  await scenario('mobile chat-first, state/focus preservation and touch targets',async page=>{
    await page.goto(base);await ready(page);
    assert.equal(await page.locator('#globe-quality').inputValue(),'low');
    await page.locator('#prompt').fill('rascunho preservado');
    await page.locator('#show-memory').click();await page.locator('#globe-list-toggle').click();
    await page.locator('#memory-list button').first().click();
    await shot(page,'inspector-mobile');
    const sheet=await page.locator('#memory-inspector').boundingBox();assert.ok(sheet.height<=844*.88);
    await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.keyboard.press('Escape');
    assert.equal(await page.locator('#conversation').isVisible(),true);
    assert.equal(await page.locator('#prompt').inputValue(),'rascunho preservado');
    assert.equal(await page.locator('#show-memory').evaluate(el=>el===document.activeElement),true);
    const small=await page.locator('button,input[type=checkbox],summary').evaluateAll(elements=>elements.filter(el=>{
      const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<44||r.height<44);
    }).map(el=>el.id||el.textContent));assert.deepEqual(small,[]);
  },{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await scenario('fallback without WebGL retains search, relations and chat',async page=>{
    await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:original.call(this,type,...args);};});
    await page.goto(base);await ready(page);
    assert.equal(await page.locator('#webgl-fallback').isVisible(),true);
    assert.equal(await page.locator('#memory-list button').count(),4);
    await page.locator('#memory-list button').first().click();assert.ok(await page.locator('#memory-related button').count());
    await page.locator('#memory-focus').click();assert.ok(await page.locator('#memory-list button').count()>=2);
    await page.locator('#memory-ask').click();assert.ok((await page.locator('#prompt').inputValue()).includes('Arquitetura'));
    await page.locator('#prompt').press('Enter');await page.waitForFunction(()=>document.querySelector('.message.assistant'));
    await page.locator('#globe-search').fill('arquitetura');await page.locator('#globe-search').press('Enter');
    await page.waitForFunction(()=>!document.querySelector('#search-results').hidden);await shot(page,'no-webgl');
  });
  for(const state of ['loading','empty','unavailable','error'])await scenario(`memory ${state}`,async page=>{
    let release;const gate=new Promise(resolve=>release=resolve);
    await page.route('**/api/memories/graph?*',async route=>{
      if(state==='loading')await gate;
      await route.fulfill({status:state==='unavailable'?503:state==='error'?500:200,contentType:'application/json',body:JSON.stringify(state==='empty'?{nodes:[],edges:[],entities:[],entity_links:[]}:{detail:'Falha simulada'})});
    });
    await page.goto(base);await page.waitForFunction(expected=>document.querySelector('#memory-globe-shell').dataset.state===expected,state);
    await shot(page,`memory-${state}`);release();
    if(state!=='loading') {
      await page.locator('#prompt').fill('chat sem contexto');await page.locator('#send-button').click();
      await page.waitForFunction(()=>document.querySelector('.message.assistant'));
    }
  });
  await scenario('voice unavailable and unsupported have clear text',async page=>{
    await page.addInitScript(()=>{delete window.SpeechRecognition;delete window.webkitSpeechRecognition;});
    await page.route('**/api/health',async route=>{const response=await route.fetch();const json=await response.json();json.elevenlabs={configured:false,available:false};await route.fulfill({json});});
    await page.goto(base);await ready(page);
    assert.equal(await page.locator('#mic-button').isDisabled(),true);assert.equal(await page.locator('#voice-toggle').isDisabled(),true);
    assert.match(await page.locator('#voice-status').textContent(),/não suportado/);await shot(page,'voice-unavailable');
  });
  await scenario('listening begins/ends only with actual recognition callbacks',async page=>{
    await page.addInitScript(()=>{
      window.SpeechRecognition=class {constructor(){window.fixtureRecognition=this;}start(){}stop(){this.onend?.();}};
    });
    await page.goto(base);await ready(page);await page.locator('#mic-button').click();
    assert.notEqual(await page.locator('#hope-state').getAttribute('data-state'),'listening');
    await page.evaluate(()=>window.fixtureRecognition.onstart());
    assert.equal(await page.locator('#hope-state').getAttribute('data-state'),'listening');await shot(page,'voice-listening');
    await page.locator('#mic-button').click();assert.equal(await page.locator('#hope-state').getAttribute('data-state'),'idle');
    await page.evaluate(()=>window.fixtureRecognition.onerror({error:'not-allowed'}));
    assert.match(await page.locator('#voice-status').textContent(),/Microfone não autorizado/);
  });
  await scenario('safe forgetting: 428, cancel, error, submitting, exact UUID, relations removed',async(page,context)=>{
    await page.goto(base);await ready(page);
    const headers={'X-Hope-User-Id':await page.evaluate(()=>localStorage.getItem('hope.user-id.v1'))};
    const graph=await (await context.request.get(`${base}/api/memories/graph`,{headers})).json();
    assert.equal(graph.nodes.find(node=>node.id===id)?.title,'Arquitetura da HOPE','Use only a fresh synthetic harness');
    assert.equal((await context.request.delete(`${base}/api/memories/${id}`,{headers})).status(),428);
    assert.equal((await context.request.delete(`${base}/api/memories/${id}`,{headers:{...headers,'X-Hope-Confirm-Memory-Id':'20000000-0000-4000-8000-000000000002'}})).status(),428);
    await page.locator('#memory-enabled').check();await page.locator('#prompt').fill('Esqueça a memória sobre a arquitetura da HOPE');await page.locator('#send-button').click();
    await page.locator('#memory-delete-dialog').waitFor({state:'visible'});
    assert.match(await page.locator('#memory-delete-target').textContent(),/Arquitetura/);
    assert.equal(await page.locator('#memory-delete-cancel').evaluate(el=>el===document.activeElement),true);
    await page.locator('#memory-delete-cancel').click();
    await page.locator('#globe-list-toggle').click();await page.locator(`#memory-list [data-node-id="${id}"]`).click();await page.locator('#memory-forget').click();
    await page.route(`**/api/memories/${id}`,route=>route.fulfill({status:503,json:{detail:'Exclusão simulada indisponível'}}));
    await page.locator('#memory-delete-confirm').click();await page.locator('#memory-delete-error').waitFor({state:'visible'});
    assert.equal(await page.locator('#memory-delete-cancel').evaluate(el=>el===document.activeElement),true);await shot(page,'delete-error');
    await page.unroute(`**/api/memories/${id}`);
    let release;const gate=new Promise(resolve=>release=resolve);let request;
    await page.route(`**/api/memories/${id}`,async route=>{request=route.request();await gate;await route.continue();});
    await page.locator('#memory-delete-confirm').click();await page.waitForFunction(()=>document.querySelector('#memory-delete-confirm').disabled);
    await page.keyboard.press('Escape');assert.equal(await page.locator('#memory-delete-dialog').isVisible(),true);
    await shot(page,'delete-submitting');release();
    await page.locator('#memory-delete-dialog').waitFor({state:'hidden'});
    assert.equal(request.headers()['x-hope-confirm-memory-id'],id);
    const after=await(await context.request.get(`${base}/api/memories/graph`,{headers})).json();
    assert.equal(after.nodes.some(node=>node.id===id),false);
    assert.equal(after.edges.some(edge=>edge.source_memory_id===id||edge.target_memory_id===id),false);
    assert.match(await page.locator('#globe-count').textContent(),/2 memórias/);
    await shot(page,'delete-success');
  });
  await writeFile(`${output}/flows-results.json`,JSON.stringify({browser:browser.version(),results},null,2));
} finally {await browser.close();}
