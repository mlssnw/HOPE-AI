import assert from 'node:assert/strict';
const {chromium}=await import(process.env.HOPE_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.HOPE_CHROME_PATH});
try {
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:8766');
  const sample=await page.evaluate(async()=>{
    const {MemoryGlobeRenderer}=await import('/js/memory-globe.js');
    const canvas=document.createElement('canvas');canvas.width=200;canvas.height=200;
    canvas.style.cssText='width:200px;height:200px';document.body.append(canvas);
    const renderer=new MemoryGlobeRenderer(canvas);cancelAnimationFrame(renderer.frame);
    // An isolated 50%-opacity semantic line: alpha must not be squared by blending.
    renderer.gl.clearColor(0,0,0,0);renderer.gl.clear(renderer.gl.COLOR_BUFFER_BIT);
    renderer.gl.useProgram(renderer.program);
    renderer.gl.enable(renderer.gl.BLEND);
    renderer.draw(0);cancelAnimationFrame(renderer.frame);
    const gl=renderer.gl;gl.clear(gl.COLOR_BUFFER_BIT);
    renderer.drawItems([{x:-1,y:0,z:0,color:[1,.7,.2,.5]},{x:1,y:0,z:0,color:[1,.7,.2,.5]}],gl.LINES);
    const pixels=new Uint8Array(200*200*4);gl.readPixels(0,0,200,200,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    let alpha=0;for(let i=3;i<pixels.length;i+=4)alpha=Math.max(alpha,pixels[i]);
    return {alpha,premultiplied:gl.getContextAttributes().premultipliedAlpha};
  });
  console.log(sample);
  assert.ok(sample.alpha>=120,'50% line opacity was attenuated again by framebuffer blending');
  assert.equal(sample.premultiplied,true,'RGB already blended with alpha must not be multiplied again by the compositor');
} finally {await browser.close();}
