import test from 'node:test';
import assert from 'node:assert/strict';
import { initialQuality, operationalState, displayedState } from '../../frontend/js/presentation-state.js';
test('quality defaults never opt into ULTRA',()=>{
  assert.deepEqual([320,680,681,1279,1280,1920].map(initialQuality),['low','low','medium','medium','high','high']);
});
test('cancel ignores stale remote processing until the next local request',()=>{
  let state={chat:'thinking',voice:'idle',remote:'searching'};
  state=operationalState(state,{source:'chat',state:'cancelled'});
  state=operationalState(state,{source:'realtime',state:'thinking'});
  assert.equal(displayedState(state),'idle');
  state=operationalState(state,{source:'chat',state:'started'});
  state=operationalState(state,{source:'realtime',state:'searching'});
  assert.equal(displayedState(state),'searching');
});
test('voice states require actual voice events; unsupported states are not presented',()=>{
  let state={chat:'idle',voice:'idle',remote:'idle'};
  state=operationalState(state,{source:'realtime',state:'executing'});
  assert.equal(displayedState(state),'idle');
  state=operationalState(state,{source:'voice',state:'listening'});
  assert.equal(displayedState(state),'listening');
  state=operationalState(state,{source:'voice',state:'idle'});
  assert.equal(displayedState(state),'idle');
});
