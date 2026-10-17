const sections = [
 { id:'home', title:'Kezdőlap', description:'Az első benyomás: bevezető, főcím és nyitókép.', blocks:[{title:'Nyitószövegek',fields:[['6','Bevezető felirat'],['7','Főcím'],['8','Rövid leírás'],['9','Gomb felirata']]}], images:[['hero','Nyitókép']] },
 { id:'work', title:'Portfólió', description:'A nyolc portfóliókártya címe, leírása és képe.', blocks:[{title:'Bevezető',fields:[['10','Szakaszcím'],['67','Rövid bemutatás'],['11','Kapcsolatfelvételi gomb']]},...Array.from({length:8},(_,i)=>({title:`${i+1}. portfóliókártya`,fields:[[String(50+i*2),'Cím'],[String(51+i*2),'Leírás']],images:[[`portfolio-${i}`,'Kártya képe']]}))] },
 { id:'about', title:'Rólam', description:'Rövid, személyes bemutatkozás a munkáid mögött.', blocks:[{title:'Bemutatkozás',fields:[['20','Szakaszcím'],['21','Cím'],['22','Első bekezdés'],['23','Második bekezdés'],['24','Gomb felirata']]}] },
 { id:'carousel', title:'Carousel', description:'A tervezési folyamat tíz lépése. Kép nélkül a grafikus borító marad.', blocks:Array.from({length:10},(_,i)=>({title:`${i+1}. lépés`,fields:[[String(80+i*2),'Cím'],[String(81+i*2),'Leírás']],images:[[`carousel-${i}`,'A lépés képe']]})) },
 { id:'contact', title:'Kapcsolat', settings:true, description:'Szövegek, amelyek segítenek elindítani a közös munkát.', blocks:[{title:'Kapcsolatfelvétel',fields:[['25','Szakaszcím'],['26','Főcím'],['100','Bevezető'],['104','Szakterületek'],['105','Kártya felirata'],['101','Kártya címe'],['102','Útmutató az érdeklődőnek'],['27','E-mail-gomb felirata'],['103','Upwork-gomb felirata']]}] },
 { id:'labels', title:'Menü és feliratok', description:'Navigáció és kiegészítő feliratok.', blocks:[{title:'Menü',fields:[['1','Munkák menüpont'],['2','Rólam menüpont'],['3','Kapcsolat menüpont'],['4','Beszéljünk gomb'],['5','Beszéljünk gomb az aloldalon']]},{title:'Lábléc és projektoldal',fields:[['28','Lábléc leírása'],['29','Vissza az elejére'],['30','Vissza a munkákhoz'],['31','Projektoldal felirata'],['32','Projektoldal főcíme'],['33','Terület felirata'],['34','Fókusz felirata'],['35','Fókusz leírása'],['36','Projektbemutató felirata'],['37','Projektbemutató címe'],['38','Projektbemutató szövege'],['39','További munkák gomb'],['40','Vissza a kezdőlapra']]}] }
];
const $ = selector => document.querySelector(selector);
const state = { section:sections[0], language:'hu', defaults:{}, content:{translations:{},images:{},settings:{}}, revision:0, publishedRevision:0, ready:false, busy:false, saved:'', user:'' };
const clone = value => structuredClone(value);
const plain = html => { const node=document.createElement('div');node.innerHTML=html.replace(/<br\s*\/?>/gi,'\n');return node.textContent; };
const dirty = () => JSON.stringify(state.content)!==state.saved;
function feedback(message){$('#feedback').textContent=message;}
function syncControls(){
 $('#editor-fields').disabled=!state.ready||state.busy;
 for(const id of ['save','preview','publish'])$('#'+id).disabled=!state.ready||state.busy;
 $('#save-state').textContent=dirty()?'Nem mentett módosítások':state.ready?'Minden módosítás mentve':'';
 $('#connection-state').textContent=state.ready?'Kapcsolódva':'Beállítás szükséges';
 $('#connection-state').classList.toggle('ready',state.ready);
}
function makeTextField(key,label){
 const wrap=document.createElement('div');wrap.className='field';
 const labelEl=document.createElement('label');labelEl.htmlFor='text-'+key;labelEl.textContent=label;
 const language=document.createElement('span');language.textContent=state.language==='hu'?'Magyar':'English';labelEl.append(language);
 const input=document.createElement('textarea');input.id='text-'+key;input.name='text-'+key;input.maxLength=5000;
 const baseline=plain(state.defaults[key]?.[state.language]||'');input.value=state.content.translations[key]?.[state.language]??baseline;
 input.rows=input.value.length>220?5:input.value.includes('\n')?3:2;
 input.addEventListener('input',()=>{const value=input.value;const entry=state.content.translations[key]||{};if(value===baseline)delete entry[state.language];else entry[state.language]=value;if(Object.keys(entry).length)state.content.translations[key]=entry;else delete state.content.translations[key];syncControls();feedback('A változások még a piszkozatban sincsenek elmentve.');});
 wrap.append(labelEl,input);return wrap;
}
function makeImageField(key,label){
 const wrap=document.createElement('div');wrap.className='field';
 const labelEl=document.createElement('label');labelEl.htmlFor='image-'+key;labelEl.textContent=label;
 const input=document.createElement('input');input.type='text';input.inputMode='url';input.id='image-'+key;input.placeholder='https://… vagy /images/…';input.value=state.content.images[key]||'';input.maxLength=2048;
 const hint=document.createElement('p');hint.className='field-hint';hint.textContent='Adj meg egy HTTPS-képcímet vagy egy meglévő /images/ útvonalat. Üresen az eredeti kép vagy grafikus borító marad. A kép mindkét nyelven közös.';
 const image=document.createElement('img');image.className='image-preview';image.alt='Kép előnézete';image.hidden=true;image.referrerPolicy='no-referrer';
 function updatePreview(){const value=input.value.trim();if(value&&(value.startsWith('https://')||(value.startsWith('/')&&!value.startsWith('//')))){image.src=value;image.hidden=false;}else{image.removeAttribute('src');image.hidden=true;}}
 input.addEventListener('input',()=>{const value=input.value.trim();if(value)state.content.images[key]=value;else delete state.content.images[key];updatePreview();syncControls();feedback('A kép módosult. Mentsd el a piszkozatot.');});image.addEventListener('error',()=>{image.hidden=true;});updatePreview();wrap.append(labelEl,input,hint,image);return wrap;
}
function makeSettingField(key,label,baseline){
 const wrap=document.createElement('div');wrap.className='field';const labelEl=document.createElement('label');labelEl.htmlFor='setting-'+key;labelEl.textContent=label;
 const input=document.createElement('input');input.type=key==='email'?'email':'url';input.id='setting-'+key;input.value=state.content.settings?.[key]??baseline;
 input.addEventListener('input',()=>{const settings=state.content.settings||{};if(input.value.trim()===baseline)delete settings[key];else settings[key]=input.value.trim();state.content.settings=settings;syncControls();feedback('A kapcsolati adat módosult. Mentsd el a piszkozatot.');});
 const hint=document.createElement('p');hint.className='field-hint';hint.textContent='Mindkét nyelven közös. Az e-mail-gombok hivatkozásai is frissülnek.';wrap.append(labelEl,input,hint);return wrap;
}
function render(){
 $('#section-title').textContent=state.section.title;$('#section-description').textContent=state.section.description;
 $('#fields').replaceChildren();
 const blocks=[...state.section.blocks];if(state.section.images)blocks.push({title:'Kép',fields:[],images:state.section.images});
 for(const block of blocks){const card=document.createElement('section');card.className='field-card';const title=document.createElement('h2');title.textContent=block.title;card.append(title);for(const [key,label]of block.fields)card.append(makeTextField(key,label));for(const [key,label]of block.images||[])card.append(makeImageField(key,label));$('#fields').append(card);}
 if(state.section.settings){const card=document.createElement('section');card.className='field-card';const title=document.createElement('h2');title.textContent='Elérhetőségek';card.append(title,makeSettingField('email','E-mail-cím','jrepas@icloud.com'),makeSettingField('upworkUrl','Upwork-profil','https://www.upwork.com/freelancers/jrepas'));$('#fields').append(card);}
 for(const button of document.querySelectorAll('[data-edit-language]'))button.setAttribute('aria-pressed',String(button.dataset.editLanguage===state.language));
 for(const button of document.querySelectorAll('[data-section]')){if(button.dataset.section===state.section.id)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
 syncControls();
}
async function api(path,body){
 const response=await fetch('/admin/api/'+path,{credentials:'same-origin',headers:body?{'Content-Type':'application/json','X-Requested-With':'jrepas-admin'}:{},method:body?'POST':'GET',body:body?JSON.stringify(body):undefined});
 let result;try{result=await response.json();}catch{throw new Error('Az admin nem érhető el. Ellenőrizd a belépést és a Cloudflare Pages telepítését.');}
 if(!response.ok){const error=new Error(result.error||'A művelet nem sikerült.');error.status=response.status;error.missing=result.missing;throw error;}return result;
}
function accept(result){state.content=clone(result.draft.content);state.revision=result.draft.revision;state.publishedRevision=result.published.revision;state.saved=JSON.stringify(state.content);if(result.user)state.user=result.user.email;$('#editor-user').textContent=state.user;}
async function load(){
 state.busy=true;syncControls();feedback('Adatok betöltése…');
 try{const [defaults,result]=await Promise.all([fetch('/admin/defaults.json').then(r=>{if(!r.ok)throw new Error('A kiinduló szövegek nem tölthetők be.');return r.json();}),api('content')]);state.defaults=defaults;accept(result);state.ready=true;$('#connection-panel').hidden=true;feedback('Válassz egy részt, és szerkeszd a szövegeket.');render();}
 catch(error){state.ready=false;$('#connection-panel').hidden=false;$('#connection-title').textContent=error.status===401?'Jelentkezz be a szerkesztéshez':'Az admin még nincs aktiválva';$('#connection-message').textContent=error.message;$('#missing-settings').replaceChildren();const names={SITE_DB:'D1 adatbázis összekapcsolása (SITE_DB)',CF_ACCESS_TEAM_DOMAIN:'Cloudflare Access csapatdomain megadása',CF_ACCESS_AUD:'Az admin Access-alkalmazás azonosítójának megadása'};for(const key of error.missing||[]){const li=document.createElement('li');li.textContent=names[key]||key;$('#missing-settings').append(li);}feedback(error.message);}
 finally{state.busy=false;syncControls();}
}
async function save(){
 if(!state.ready||state.busy)return false;
 state.busy=true;syncControls();feedback('Piszkozat mentése…');
 try{const result=await api('draft',{revision:state.revision,content:state.content});accept(result);feedback('Piszkozat elmentve. Az élő oldal még nem változott.');return true;}
 catch(error){feedback(error.message);return false;}
 finally{state.busy=false;syncControls();}
}
for(const section of sections){const button=document.createElement('button');button.type='button';button.dataset.section=section.id;button.textContent=section.title;button.addEventListener('click',()=>{state.section=section;render();});$('#sections').append(button);}
for(const button of document.querySelectorAll('[data-edit-language]'))button.addEventListener('click',()=>{state.language=button.dataset.editLanguage;render();});
$('#save').addEventListener('click',save);$('#retry').addEventListener('click',load);$('#editor-form').addEventListener('submit',event=>event.preventDefault());
$('#preview').addEventListener('click',async()=>{const preview=window.open('about:blank','_blank');if(preview)preview.opener=null;if(dirty()&&!await save()){preview?.close();return;}if(preview)preview.location.href='/?admin-preview=1';else feedback('Engedélyezd az előnézethez a felugró ablakot, majd próbáld újra.');});
$('#publish').addEventListener('click',()=>{ $('#publish-dialog').returnValue='cancel'; $('#publish-dialog').showModal(); });
$('#publish-dialog').addEventListener('close',async()=>{if($('#publish-dialog').returnValue!=='publish')return;if(dirty()&&!await save())return;state.busy=true;syncControls();feedback('Közzététel…');try{accept(await api('publish',{revision:state.revision}));feedback('Közzétéve. A friss tartalom már az élő oldalon van.');}catch(error){feedback(error.message);}finally{state.busy=false;syncControls();}});
window.addEventListener('beforeunload',event=>{if(state.ready&&dirty()){event.preventDefault();event.returnValue='';}});
render();load();
