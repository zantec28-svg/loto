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
$('title').oninput=()=>save('loto-title',$('title').textContent);
$('title').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.target.blur()}};
let lots=[],li=0;
function saveLots(){save('loto-lots',JSON.stringify(lots));save('loto-li',String(li))}
function showLot(){
  $('lotName').textContent=lots.length?lots[li]:(load('loto-lot')||'');
  $('lotPos').textContent=lots.length?'Lot '+(li+1)+' / '+lots.length:'';
  $('lotPrev').disabled=!lots.length||li===0;
  $('lotNext').disabled=!lots.length||li===lots.length-1;
}
function go(d){if(!lots.length)return;li=Math.min(lots.length-1,Math.max(0,li+d));saveLots();showLot()}
$('lotPrev').onclick=()=>go(-1);
$('lotNext').onclick=()=>go(1);
$('lotName').oninput=()=>{const v=$('lotName').textContent;if(lots.length){lots[li]=v;saveLots()}else save('loto-lot',v)};
$('lotName').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.target.blur()}};
$('lotImport').onclick=()=>{$('lotText').value=lots.join('\n');$('dlg').showModal()};
$('lotFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$('lotText').value=String(r.result).replace(/^\uFEFF/,'')};r.readAsText(f);e.target.value=''};
$('lotCancel').onclick=()=>$('dlg').close();
$('lotOk').onclick=()=>{
  lots=$('lotText').value.split(/\r?\n/).map(x=>x.trim().replace(/^"(.*)"$/,'$1')).filter(Boolean);
  li=0;saveLots();showLot();$('dlg').close();
};
try{lots=JSON.parse(load('loto-lots')||'[]');li=parseInt(load('loto-li')||'0',10)||0;if(li>=lots.length)li=0}catch(e){lots=[];li=0}
showLot();
const t=load('loto-title');if(t)$('title').textContent=t;
try{(JSON.parse(load('loto-done')||'[]')).forEach(n=>{done.push(n);$('b'+n).classList.add('done')});renderHist()}catch(e){}
