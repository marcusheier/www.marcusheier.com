const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
test('four export formats preserve all testimonial words across their slides without ratings',async()=>{
 const elements=new Map(), words=Array.from({length:2500},(_,i)=>'word'+i);
 function element(id){if(!elements.has(id))elements.set(id,{style:{},value:'',src:'',textContent:id==='#art-quote'?words.join(' '):id==='#art-name'?'Example':id==='#art-date'?'2026-10-18':'',addEventListener(){},getBoundingClientRect:()=>({width:600})});return elements.get(id);}
 const context=vm.createContext({window:{addEventListener(){}},document:{querySelector:element,querySelectorAll:()=>[],createElement(){const c={texts:[],cards:[],width:0,height:0,toDataURL:()=>"data:image/png;base64,"};c.getContext=()=>({measureText:s=>({width:s.length*12}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),save(){},restore(){},translate(){},scale(){},fillRect(){},beginPath(){},roundRect:(x,y,w,h)=>c.cards.push({x,y,w,h}),fill(){},fillText:s=>c.texts.push(s)});return c;}},Math,Promise,Number,setTimeout,URL:{}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../graphics.js'),'utf8'),context);
 for(const [width,height] of [[1080,1350],[1080,1080],[1080,1920],[1200,627]]){
  context.dimensions={width,height};vm.runInContext('Object.assign(studioSettings,dimensions)',context);const canvases=await vm.runInContext('makeCanvases()',context);
  assert.ok(canvases.length>1);for(const canvas of canvases){assert.equal(canvas.width,width);assert.equal(canvas.height,height);assert.ok(!canvas.texts.some(t=>t.includes('★')));}
  for(const canvas of canvases){for(const card of canvas.cards){assert.ok(card.y>=0);assert.ok(card.y+card.h<=height);}}
  const exported=canvases.flatMap(c=>c.texts.filter(t=>t.startsWith('word')).flatMap(t=>t.split(' ')));assert.deepEqual(Array.from(exported),words);
 }
 element('#art-quote').textContent='A short fictional testimonial.';
 const short=(await vm.runInContext('makeCanvases()',context))[0];
 assert.ok(short.cards[0].h < short.height*.8, 'short card should hug its content');
 assert.equal(vm.runInContext('formatGraphicDate("2026-08-27T00:00:00Z")',context),'27/08/2026');
 assert.equal(vm.runInContext('validGraphicDate("31/02/2026")',context),false);
 assert.equal(vm.runInContext('validGraphicDate("27/08/2026")',context),true);
});
