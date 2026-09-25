import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.HOPE_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.HOPE_CHROME_PATH,args:['--autoplay-policy=no-user-gesture-required']});
const base='http://127.0.0.1:8766',output='docs/evidence/phase-6';
const report={browser:browser.version(),tests:[],performance:[]};
async function setup(options={}) {
  const context=await browser.newContext({viewport:{width:1440,height:900},...options});
  const page=await context.newPage();page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('503'))errors.push(m.text());});
  // Observe the actual application renderer without a production test hook.
  await page.route('**/js/memory-globe.js',async route=>{
    const response=await route.fetch();const source=await response.text();
    await route.fulfill({response,body:source+'\nconst originalDraw=MemoryGlobeRenderer.prototype.draw;MemoryGlobeRenderer.prototype.draw=function(time){globalThis.fixtureRenderer=this;return originalDraw.call(this,time);};'});
  });
  return {context,page,errors};
}
async function screenshot(page,name){
  await page.evaluate(()=>{const el=document.createElement('small');el.id='evidence-label';el.textContent='Implementação em andamento · dados de teste';el.style.cssText='position:fixed;bottom:0;right:0;z-index:9999;background:#030609;color:#fff8e9;padding:3px 6px;font:11px sans-serif';document.body.append(el);});
  await page.screenshot({path:`${output}/${name}.png`,fullPage:true,animations:'disabled'});await page.locator('#evidence-label').evaluate(el=>el.remove());
}
async function ready(page){await page.waitForFunction(()=>globalThis.fixtureRenderer&&document.querySelector('#memory-globe-shell').dataset.state==='ready');}
try {
  {
    const {context,page,errors}=await setup();let socket,graphRequests=0,allowReconnect=false;
    page.on('request',r=>{if(r.url().includes('/api/memories/graph'))graphRequests++;});
    await page.routeWebSocket('**/ws/hope*',ws=>{if(socket&&!allowReconnect){ws.close();return;}socket=ws;});
    await page.goto(base);await ready(page);
    const baseline=await page.evaluate(()=>fixtureRenderer.graphSnapshot);
    const node={...baseline.nodes[0],id:'20000000-0000-4000-8000-000000000099',title:'Memória de teste realtime',content:'Conteúdo controlado.'};
    await page.route(`**/api/memories/${node.id}/explanation`,route=>route.fulfill({json:{memory:node,sources:[],relations:[],entities:[],events:[]}}));
    const send=(type,payload)=>socket.send(JSON.stringify({type,payload}));
    const originalRequestCount=graphRequests;
    send('MEMORY_CREATED',{node});
    await page.waitForFunction(()=>fixtureRenderer.layout.nodeMap.has('20000000-0000-4000-8000-000000000099'));
    await page.locator('#globe-list-toggle').click();await page.locator(`[data-node-id="${node.id}"]`).click();
    const edge={id:'40000000-0000-4000-8000-000000000099',source_memory_id:node.id,target_memory_id:baseline.nodes[0].id,relation_type:'related_to',weight:.7};
    send('MEMORY_RELATION_CREATED',{edge});
    await page.waitForFunction(()=>document.querySelectorAll('#memory-related button').length===1);
    send('MEMORY_UPDATED',{node:{...node,title:'Título atualizado'}});
    await page.waitForFunction(()=>document.querySelector('#memory-inspector-title').textContent==='Título atualizado');
    send('MEMORY_RELATION_DELETED',{relation_id:edge.id});
    await page.waitForFunction(()=>document.querySelectorAll('#memory-related button').length===0);
    send('MEMORY_DELETED',{memory_id:node.id});
    await page.waitForFunction(()=>document.querySelector('#memory-inspector').hidden);
    assert.equal(graphRequests,originalRequestCount,'Incremental events must not reload graph HTTP');
    for(const state of ['thinking','searching','speaking','error','idle']) {
      send('AI_STATE_CHANGED',{state});await page.waitForFunction(value=>document.querySelector('#hope-state').dataset.state===value,state);
    }
    let pong=false;socket.onMessage(message=>{if(JSON.parse(message).type==='PONG')pong=true;});
    send('PING',{});await page.waitForTimeout(100);assert.equal(pong,true);
    socket.close();await page.waitForFunction(()=>!document.querySelector('#realtime-retry').hidden);
    await screenshot(page,'realtime-degraded');
    const beforePeriodic=graphRequests;
    await page.waitForTimeout(30500);
    assert.ok(graphRequests>beforePeriodic,'Disconnected mode must periodically reconcile through HTTP');
    const before=graphRequests;await page.locator('#globe-refresh').click();await page.waitForFunction(()=>document.querySelector('#memory-globe-shell').dataset.state==='ready');assert.ok(graphRequests>before);
    allowReconnect=true;await page.locator('#realtime-retry').click();
    await page.waitForFunction(()=>document.querySelector('#realtime-status').textContent==='Sincronização em tempo real');
    assert.deepEqual(errors,[]);report.tests.push('all six realtime events, no full HTTP reload per event, heartbeat PONG, disconnected HTTP sync and reconnect');await context.close();
  }
  {
    const {context,page,errors}=await setup();
    await page.goto(base);await ready(page);
    const measured=await page.evaluate(async()=>{
      const r=fixtureRenderer;
      const gl=r.gl,extension=gl.getExtension('WEBGL_debug_renderer_info');
      const hardware={renderer:extension?gl.getParameter(extension.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),cores:navigator.hardwareConcurrency};
      const original=r.graphSnapshot;
      const nodes=Array.from({length:3000},(_,i)=>({...original.nodes[0],id:`benchmark-${i}`,category:['identity','temporal','knowledge','context','applications','long_term'][i%6],importance:(i%101)/100}));
      const edges=nodes.slice(1).map((node,index)=>({id:`benchmark-edge-${index}`,source_memory_id:nodes[index].id,target_memory_id:node.id,relation_type:'related_to',weight:.7}));
      r.setGraph({nodes,edges,entities:[],entity_links:[]});
      const results=[];
      for(const quality of ['low','medium','high','ultra']) {
        r.setQuality(quality);r.setReducedMotion(false);
        await new Promise(resolve=>setTimeout(resolve,300));
        const frames=[];let last;const start=performance.now();
        await new Promise(resolve=>{const frame=time=>{if(last)frames.push(time-last);last=time;if(time-start<1800)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
        const sorted=[...frames].sort((a,b)=>a-b);
        results.push({quality,viewport:[innerWidth,innerHeight],inputNodes:3000,inputEdges:2999,renderedNodes:r.projected.length,frames:frames.length,fps:1000/(frames.reduce((a,b)=>a+b,0)/frames.length),p95FrameMs:sorted[Math.floor(sorted.length*.95)]});
      }
      r.setGraph(original);return {hardware,results};
    });
    report.hardware=measured.hardware;report.performance=measured.results;
    assert.ok(measured.results.find(result=>result.quality==='high').fps>=45,'HIGH must meet the measured 45 FPS target');
    console.log('PERFORMANCE',JSON.stringify(measured));
    for(const [i,quality] of ['low','medium','high','ultra'].entries()){
      assert.equal(measured.results[i].renderedNodes,[400,1000,2500,3000][i]);
      await page.locator('#globe-quality').selectOption(quality);await screenshot(page,`profile-${quality}`);
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>fixtureRenderer.reducedMotion);
    const camera=await page.evaluate(()=>({...fixtureRenderer.camera}));await page.waitForTimeout(250);
    assert.deepEqual(await page.evaluate(()=>({...fixtureRenderer.camera})),camera);
    await page.locator('#globe-list-toggle').click();await page.locator('#memory-list button').first().click();
    await page.locator('#memory-focus').click();assert.equal(await page.evaluate(()=>fixtureRenderer.camera.zoom),camera.zoom);
    await screenshot(page,'reduced-motion');assert.deepEqual(errors,[]);report.tests.push('all quality caps preserve data; reduced motion removes continuous movement and automatic zoom');await context.close();
  }
  {
    const {context,page,errors}=await setup();
    await page.goto(base);await ready(page);
    const before=await page.locator('#globe-count').textContent();
    await page.locator('#globe-list-toggle').click();await page.locator('#memory-list button').first().click();
    await page.evaluate(()=>dispatchEvent(new CustomEvent('hope:operation',{detail:{source:'chat',state:'started'}})));
    await page.evaluate(()=>fixtureRenderer.gl.getExtension('WEBGL_lose_context').loseContext());
    await page.waitForFunction(()=>!document.querySelector('#webgl-fallback').hidden);
    assert.equal(await page.locator('#globe-count').textContent(),before);assert.ok(await page.locator('#memory-list button').count());
    await page.locator('#webgl-retry').click();
    await page.waitForFunction(()=>document.querySelector('#webgl-fallback').hidden);
    await page.waitForFunction(()=>fixtureRenderer.inspectorOpen&&fixtureRenderer.aiState==='thinking');
    await screenshot(page,'webgl-restored');assert.deepEqual(errors,[]);report.tests.push('context loss preserves data and switches to textual fallback; retry restores WebGL');await context.close();
  }
  {
    const {context,page,errors}=await setup();
    // Valid local PCM fixture exercises the real Audio element, not a paid TTS.
    const pcm=Buffer.alloc(44+16000*2);pcm.write('RIFF');pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(16000,24);pcm.writeUInt32LE(32000,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(pcm.length-44,40);
    await page.route('**/api/tts',route=>route.fulfill({contentType:'audio/wav',body:pcm}));
    await page.goto(base);await ready(page);await page.locator('#voice-toggle').click();await page.locator('#prompt').fill('Leia a resposta');await page.locator('#send-button').click();
    await page.waitForFunction(()=>document.querySelector('#hope-state').dataset.state==='speaking');await screenshot(page,'voice-speaking');
    await page.locator('#speech-stop').click();assert.equal(await page.locator('#hope-state').getAttribute('data-state'),'idle');
    // A newer response cancels a pending older synthesis, not the newer one.
    await page.unroute('**/api/tts');let calls=0;
    await page.route('**/api/tts',async route=>{calls++;if(calls===1)await new Promise(resolve=>setTimeout(resolve,800));await route.fulfill({contentType:'audio/wav',body:pcm}).catch(()=>{});});
    await page.locator('#prompt').fill('Primeira síntese lenta');await page.locator('#send-button').click();
    await page.locator('#speech-stop').waitFor({state:'visible'});
    await page.locator('#prompt').fill('Resposta mais recente');await page.locator('#send-button').click();
    await page.waitForFunction(()=>document.querySelector('#hope-state').dataset.state==='speaking');
    await page.locator('#speech-stop').click();
    await page.unroute('**/api/tts');await page.locator('#prompt').fill('Leitura com falha');await page.locator('#send-button').click();
    await page.waitForFunction(()=>document.querySelector('#live-status').textContent.includes('Voz simulada'));
    assert.equal(await page.locator('#speech-stop').isVisible(),false);assert.deepEqual(errors,[]);report.tests.push('real audio playing/stop with local PCM; TTS error retains text and exits speaking');await context.close();
  }
  await writeFile(`${output}/runtime-results.json`,JSON.stringify(report,null,2));
  console.log('PASS runtime scenarios');
} finally {await browser.close();}
