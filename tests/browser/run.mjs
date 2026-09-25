// Own one disposable harness process. Refuse an occupied port rather than testing
// an unknown application. No reload worker, real DB, or external provider calls.
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {createServer} from 'node:net';
const port=8766;
await new Promise((accept,reject)=>{const probe=createServer();probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(accept));});
const python=process.env.HOPE_PYTHON || resolve(process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python');
const server=spawn(python,['-m','uvicorn','tests.e2e_app:app','--host','127.0.0.1','--port',String(port)],{
  windowsHide:true,stdio:['ignore','pipe','pipe'],
  env:{...process.env,DATABASE_URL:'',ANTHROPIC_API_KEY:'',ELEVENLABS_API_KEY:'',TAVILY_API_KEY:''},
});
try {
  await new Promise((accept,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('Disposable harness did not start within 20 seconds')),20000);
    const handle=data=>{if(String(data).includes('Uvicorn running')){clearTimeout(timeout);accept();}};
    server.stdout.on('data',handle);server.stderr.on('data',handle);
    server.once('error',error=>{clearTimeout(timeout);reject(error);});
    server.once('exit',code=>{clearTimeout(timeout);reject(new Error(`Harness exited before tests: ${code}`));});
  });
  for(const script of ['globe-compositing','phase-6','phase-6-runtime','phase-6-accessibility','phase-6-flows']) {
    await new Promise((accept,reject)=>{
      const test=spawn(process.execPath,[`tests/browser/${script}.mjs`],{windowsHide:true,stdio:'inherit'});
      test.once('error',reject);test.once('exit',code=>code===0?accept():reject(new Error(`${script}: exit ${code}`)));
    });
  }
  console.log('PASS complete Phase 6 browser package; disposable state only.');
} finally {server.kill();}
