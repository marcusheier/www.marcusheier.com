const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
test('four export formats preserve all testimonial words across their slides without ratings',async()=>{
 const elements=new Map(), words=Array.from({length:2500},(_,i)=>'word'+i);
 function element(id){if(!elements.has(id))elements.set(id,{style:{},value:'',src:'',textContent:id==='#art-quote'?words.join(' '):id==='#art-name'?'Example':id==='#art-date'?'2026-10-18':'',addEventListener(){},getBoundingClientRect:()=>({width:600})});return elements.get(id);}
 const context=vm.createContext({window:{addEventListener(){}},document:{querySelector:element,querySelectorAll:()=>[],createElement(){const c={texts:[],width:0,height:0};c.getContext=()=>({measureText:s=>({width:s.length*12}),createLinearGradient:()=>({addColorStop(){}}),fillRect(){},beginPath(){},roundRect(){},fill(){},fillText:s=>c.texts.push(s)});return c;}},Math,Promise,Number,setTimeout,URL:{}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../graphics.js'),'utf8'),context);
 for(const [width,height] of [[1080,1350],[1080,1080],[1080,1920],[1200,627]]){
  context.dimensions={width,height};vm.runInContext('Object.assign(studioSettings,dimensions)',context);const canvases=await vm.runInContext('makeCanvases()',context);
  assert.ok(canvases.length>1);for(const canvas of canvases){assert.equal(canvas.width,width);assert.equal(canvas.height,height);assert.ok(!canvas.texts.some(t=>t.includes('★')));}
  const exported=canvases.flatMap(c=>c.texts.filter(t=>t.startsWith('word')).flatMap(t=>t.split(' ')));assert.deepEqual(Array.from(exported),words);
 }
});
