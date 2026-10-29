// The Hungarian About HTML is the single source for both the website and this CV.
// Read fresh content on every visit; no separately maintained CV copy.
const target = document.querySelector('#cv');
const printButton = document.querySelector('#print');
const el = (tag, text, className) => { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; };
async function loadCV() {
 try {
  const response = await fetch('/rolam/', {cache:'no-store'});
  if (!response.ok) throw new Error('CV source unavailable');
  const source = new DOMParser().parseFromString(await response.text(), 'text/html');
  const sections = [...source.querySelectorAll('.resume-section')];
  const find = title => sections.find(s => s.querySelector('h2')?.textContent.trim() === title);
  const cloneSection = title => {const section = find(title); if (!section) throw new Error(`Missing section: ${title}`); return section.cloneNode(true);};
  const first = el('article', '', 'cv-sheet');
  const header = el('header', '', 'cv-heading');
  header.append(el('p','SZAKMAI ÖNÉLETRAJZ','cv-label'),el('h1',source.querySelector('h1').textContent),el('p','Senior Graphic Designer','cv-role'),el('p',source.querySelector('.resume-summary').textContent,'cv-summary'));
  const contacts = el('div','','cv-contacts');
  source.querySelectorAll('.resume-contact a').forEach(link => {const a=el('a',link.textContent.trim()); a.href=link.getAttribute('href'); contacts.append(a);});
  header.append(contacts);first.append(header,cloneSection('Szakmai tapasztalat'));
  const second = el('article','','cv-sheet');second.append(el('p','RÉPÁS JÁNOS / SZAKMAI ÖNÉLETRAJZ','cv-label'));
  const skills = el('section','','resume-section');skills.append(el('h2','Fő kompetenciák'));
  source.querySelectorAll('.skill-card').forEach(card=>{const item=el('article');const list=el('ul','','cv-competencies');card.querySelectorAll('.skill-competencies li').forEach(skill=>list.append(el('li',skill.textContent)));item.append(el('h3',card.querySelector('.skill-category').textContent),list);skills.append(item);});
  second.append(skills);
  const software=cloneSection('Szoftverismeret');software.querySelectorAll('.software-logo').forEach(n=>n.remove());second.append(software,cloneSection('Tanulmányok'),cloneSection('Nyelvtudás'));
  const portfolio=el('section','','resume-section');portfolio.append(el('h2','Portfólió'));['https://jrepas.hu','https://www.behance.net/jrepas'].forEach(url=>{const p=el('p');const a=el('a',url);a.href=url;p.append(a);portfolio.append(p);});second.append(portfolio);
  [first,second].forEach((page,i)=>page.append(el('footer',`jrepas.hu · hello@jrepas.hu                       ${i+1} / 2`)));
  target.replaceChildren(first,second);await document.fonts.ready;printButton.disabled=false;document.documentElement.dataset.ready='true';
 } catch(error) { target.replaceChildren(el('p','Az önéletrajz nem tölthető be. Térj vissza a Rólam oldalra, és próbáld újra.')); console.error(error); }
}
printButton.addEventListener('click',()=>window.print());
loadCV();
