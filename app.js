const $=id=>document.getElementById(id);
const done=[];
const save=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const load=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
function renderHist(){$('hist').innerHTML=done.length?'Derniers : '+done.slice(-8).reverse().map(n=>'<span>'+n+'</span>').join(''):''}
for(let n=1;n<=90;n++){
  const b=document.createElement('button');b.textContent=n;b.id='b'+n;
  b.onclick=()=>{
    $('num').textContent=n;
    if(!done.includes(n)){done.push(n);b.classList.add('done');save('loto-done',JSON.stringify(done));renderHist()}
  };
  $('grid').appendChild(b);
}
document.querySelectorAll('#phases button').forEach(b=>b.onclick=()=>{
  const on=b.classList.contains('on');
  document.querySelectorAll('#phases button').forEach(x=>x.classList.remove('on'));
  $('phase').textContent='';
  if(!on){b.classList.add('on');$('phase').textContent=b.dataset.p}
});
$('reset').onclick=()=>{
  if(!confirm('Remettre le tirage à zéro ?'))return;
  done.length=0;document.querySelectorAll('#grid .done').forEach(b=>b.classList.remove('done'));
  $('num').textContent='?';save('loto-done','[]');renderHist();
};
$('bg').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{document.body.style.backgroundImage='url('+r.result+')';save('loto-bg',r.result)};
  r.readAsDataURL(f);
};
$('title').oninput=()=>save('loto-title',$('title').textContent);
$('title').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.target.blur()}};
const t=load('loto-title');if(t)$('title').textContent=t;
const bg=load('loto-bg');if(bg)document.body.style.backgroundImage='url('+bg+')';
try{(JSON.parse(load('loto-done')||'[]')).forEach(n=>{done.push(n);$('b'+n).classList.add('done')});renderHist()}catch(e){}
