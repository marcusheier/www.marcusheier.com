const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'../..');
function app(role='public') {
  let active='owner@example.test', effective=active, counter=0;
  const tables = new Map();
  function sheet(name,rows) {
    const s = {rows, appendRow(r){ rows.push(r); }, getDataRange(){return {getValues:()=>structuredClone(rows)};},
      getRange(row,col,n=1,width=1){return {getValues:()=>[rows[row-1].slice(col-1,col-1+width)],setValue(v){rows[row-1][col-1]=v;}}}};
    tables.set(name,s); return s;
  }
  sheet('Testimonials',[['Date','Name','Text','Image','Studio','Status','ID','Image ID'],[new Date(),'Legacy person','Unchanged original','https://drive.google.com/old','old studio link','Received','old-id','']]);
  const props = {SPREADSHEET_ID:'existing-sheet',SHEET_NAME:'Testimonials',PORTRAIT_FOLDER_ID:'existing-folder',GRAPHICS_FOLDER_ID:'graphics-folder',STUDIO_URL:'https://script.google.com/macros/s/owner/exec',OWNER_EMAIL:'owner@example.test',NOTIFICATION_EMAIL:'owner@example.test'};
  const book = {getSheetByName:n=>tables.get(n),insertSheet:n=>sheet(n,[])};
  const mails=[], files=[], cached=new Map();
  const context = vm.createContext({console:{error(){}},Date,Map,Set,JSON,String,Number,Array,Error,RegExp,encodeURIComponent,
    PropertiesService:{getScriptProperties:()=>({getProperties:()=>props})},
    Session:{getActiveUser:()=>({getEmail:()=>active}),getEffectiveUser:()=>({getEmail:()=>effective})},
    SpreadsheetApp:{openById:id=>{assert.equal(id,'existing-sheet');return book;}},
    Utilities:{getUuid:()=>`id-${++counter}`,base64Decode:s=>[...Buffer.from(s,'base64')],base64Encode:b=>Buffer.from(b).toString('base64'),base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url'),computeDigest:(_,s)=>require('node:crypto').createHash('sha256').update(s).digest(),DigestAlgorithm:{SHA_256:'sha256'},newBlob:(b,m,n)=>({b,m,n})},
    CacheService:{getScriptCache:()=>({get:k=>cached.get(k),put:(k,v)=>cached.set(k,v)})},
    LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
    MailApp:{sendEmail:m=>mails.push(m)},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})},
    HtmlService:{createTemplateFromFile:()=>({evaluate:()=>({setTitle:()=>({page:true})})})},
    DriveApp:{getFolderById:id=>({createFile(blob){files.push({id,blob});return {getId:()=>`image-${files.length}`,getUrl:()=>`https://drive.google.com/file/d/image-${files.length}`};}}),getFileById:()=>({getParents:()=>({hasNext:()=>false}),getMimeType:()=> 'image/jpeg',getSize:()=>10})}
  });
  vm.runInContext(fs.readFileSync(path.join(root,'testimonials-studio/core.gs'),'utf8')+'\n'+fs.readFileSync(path.join(root,`testimonials-studio/${role}.gs`),'utf8'),context);
  function call(code){return vm.runInContext(code,context);}
  if(role==='admin') call('setupStudio()');
  else { sheet('Testimonial permissions v1',[['Record ID','Received','Text permission','Portrait permission','Permission version','Notification']]);sheet('Testimonial studio v1',[['Record ID','Settings JSON']]); }
  return {context,call,tables,mails,files,props,identity(a,e=a){active=a;effective=e;},
    post(p){context.input=p;return call('doPost({postData:{contents:JSON.stringify(input)}})');},
    api(action,p={}){context.request={action,payload:p};return call('studioApi(request)');}};
}
test('legacy originals remain unchanged and default to pending, without consent',()=>{
 const a=app('admin'),before=structuredClone(a.tables.get('Testimonials').rows); a.call('setupStudio()');
 const r=a.api('list').reviews[0]; assert.equal(r.id,'old-id');assert.equal(r.state,'pending');assert.equal(r.permission,false);assert.equal(r.selected,false);
 assert.deepEqual(a.tables.get('Testimonials').rows,before);
});
test('submission appends privately with permission receipt, pending ID and email deep link',()=>{
 const a=app(),before=structuredClone(a.tables.get('Testimonials').rows[1]);
 assert.equal(a.post({name:'=unsafe',testimonial:'+original words',permission:true,portraitPermission:false}).ok,true);
 const rows=a.tables.get('Testimonials').rows;assert.deepEqual(rows[1],before);assert.equal(rows[2][1],"'=unsafe");assert.equal(rows[2][2],"'+original words");assert.equal(rows[2][5],'Pending');
 assert.equal(a.tables.get('Testimonial permissions v1').rows[1][2],true);assert.match(a.mails[0].body,/Review in Studio: https:\/\/script.google.com\/macros\/s\/owner\/exec\?id=id-/);
 assert.deepEqual(a.call('doGet({parameter:{action:"published"}})').reviews,[]);
 assert.equal(a.post({name:'=unsafe',testimonial:'+original words',permission:true,portraitPermission:false}).ok,true);assert.equal(rows.length,3);assert.equal(a.mails.length,1);
});
test('public routes reject private reads, arbitrary image IDs, graphic saves and moderation',()=>{
 const a=app(); for(const action of ['submission','image','list','saveGraphic','save','create','graphic']) {
 assert.equal(a.call(`doGet({parameter:{action:${JSON.stringify(action)},id:"old-id"}})`).ok,false);
 assert.equal(a.post({action,name:'Example',testimonial:'Text',permission:true,portraitPermission:false}).ok,false);
 }
 assert.equal(typeof a.context.studioApi,'undefined');assert.equal(a.tables.get('Testimonials').rows.length,2);
});
test('every admin action denies anonymous, other accounts and effective-user mismatches',()=>{
 const a=app('admin');for(const identity of [[''],['other@example.test'],['owner@example.test','other@example.test']]){
 a.identity(...identity);for(const action of ['list','portrait','save','create','graphic'])assert.throws(()=>a.api(action),/Owner access/);
 assert.throws(()=>a.call('doGet({parameter:{id:"old-id"}})'),/Owner access/);
 }
});
function draft(r,extra={}){return {id:r.id,revision:r.revision,state:r.state,selected:r.selected,order:0,displayName:r.name,excerpt:'',category:'Healing',showPortrait:false,permissionNote:'',...extra};}
test('deep-link GET is read-only; publish, selection, permission, order and hide are independent',()=>{
 const a=app('admin'),before=structuredClone(a.tables.get('Testimonials').rows);a.call('doGet({parameter:{id:"old-id",action:"publish"}})');assert.equal(a.api('list').reviews[0].state,'pending');
 let r=a.api('list').reviews[0];assert.throws(()=>a.api('save',draft(r,{state:'published',selected:true})),/permission/);
 assert.throws(()=>a.api('save',draft(r,{verifiedPermission:true})),/source of permission/);
 a.api('save',draft(r,{state:'published',verifiedPermission:true,permissionNote:'Archived written permission, test fixture'}));
 r=a.api('list').reviews[0];assert.equal(a.call('eligible_(records_()[0])'),false);
 a.api('save',draft(r,{state:'published',selected:true,order:12,verifiedPermission:true,permissionNote:r.permissionNote,excerpt:'Shorter display only'}));
 assert.equal(a.call('eligible_(records_()[0])'),true);assert.equal(a.call('records_()[0].order'),12);assert.equal(a.call('publicRecord_(records_()[0]).testimonial'),'Shorter display only');
 r=a.api('list').reviews[0];a.api('save',draft(r,{state:'hidden',selected:true,verifiedPermission:true,permissionNote:r.permissionNote}));assert.equal(a.call('eligible_(records_()[0])'),false);assert.deepEqual(a.tables.get('Testimonials').rows,before);
 assert.throws(()=>a.api('save',draft(r)),/changed in another window/);
});
test('server validates missing consent, long text and image type/signature before Drive upload',()=>{
 const a=app();for(const payload of [{name:'A',testimonial:'B'},{name:'A',testimonial:'x'.repeat(12001),permission:true,portraitPermission:false},{name:'A',testimonial:'B',permission:true,portraitPermission:false,imageData:'data:image/svg+xml;base64,PHN2Zz4='},{name:'A',testimonial:'B',permission:true,portraitPermission:false,imageData:'data:image/png;base64,aW52YWxpZA=='}])assert.equal(a.post(payload).ok,false);
 assert.equal(a.files.length,0);assert.equal(a.tables.get('Testimonials').rows.length,2);
 const jpeg='data:image/jpeg;base64,'+Buffer.from([255,216,255,0]).toString('base64');assert.equal(a.post({name:'A',testimonial:'B',permission:false,portraitPermission:false,imageData:jpeg}).ok,true);assert.equal(a.files[0].id,'existing-folder');assert.equal(a.tables.get('Testimonials').rows[2][7],'image-1');
});
test('approved public shape excludes original IDs, originals and Drive links; portraits require both permissions and folder membership',()=>{
 const a=app('admin');a.call('records_ = () => [{id:"private-id",name:"Original",displayName:"Display",testimonial:"Original text",excerpt:"Excerpt",category:"Healing",imageId:"private-image",imageUrl:"private-link",state:"published",selected:true,permission:true,portraitPermission:false,showPortrait:true}]');
 const r=a.call('publicRecord_(records_()[0])');assert.deepEqual(Object.keys(r).sort(),['category','name','portrait','testimonial']);assert.equal(r.portrait,'');
 assert.throws(()=>a.call('portrait_({imageId:"outside-folder"})'),/outside/);
});
test('explicit Sheet name is required; no first-tab fallback',()=>{const a=app();a.props.SHEET_NAME='Wrong tab';assert.throws(()=>a.call('sheet_()'),/no fallback/);});

test('headerless legacy sheet includes the first submission',()=>{ const a=app('admin');a.tables.get('Testimonials').rows.shift();const r=a.api('list').reviews;assert.equal(r.length,1);assert.equal(r[0].id,'old-id'); });
