/* NeuroFlow dyscalculia engine: six games, levels, CRA views, hesitation monitor, progress and settings.
   Ported from the single-file module; it draws into the elements rendered by Dyscalculia.jsx.
   Element ids are prefixed "dc-" (see $ below) so they cannot clash with the other sections. */
const $=i=>document.getElementById('dc-'+i),ROOT=()=>$('root'),R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,shuf=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const h=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
let tm=[];const later=(f,ms)=>tm.push(setTimeout(f,ms)),clr=()=>{tm.forEach(clearTimeout);tm=[]};

/* ---------- State ---------- */
const KEY='neuroflow_dyscalculia_v1';
const S={pts:0,st:0,av:'🙂',bd:'⭐',own:['🙂','⭐'],hi:false,last:null,hist:[],g:{},cur:null,prof:null,err:{},a:{snd:1,hap:0,pal:'',tc:'',oc:''},over:null,rem:null,edu:0,hes:{load:0,rush:0},help:{}};
const base=()=>({lv:1,run:0,pause:0,wr:0,t:0,a:0,c:0});
function save(){try{const {cur,...r}=S;localStorage.setItem(KEY,JSON.stringify(r))}catch(e){}}

/* ---------- Helpers for games ---------- */
function choices(a,vals,right,hint,et){const w=h('div','opts');vals.forEach(v=>{const b=h('button','opt');b.append(typeof v=='number'?dig(v):v);b.setAttribute('aria-label','Choose '+v);b.onclick=()=>answer(v===right,hint,b,et&&et(v));w.append(b)});a.append(w)}
function near(c,n,lo,hi){const s=new Set([c]);let g=0;while(s.size<n&&g++<80){const v=c+R(1,Math.max(2,Math.round(c*.3)+2))*(Math.random()<.5?-1:1);if(v>=lo&&v<=hi)s.add(v)}for(let v=lo;s.size<n&&v<=hi;v++)s.add(v);return shuf([...s])}

/* ---------- 6 Games (each make() returns the instruction text) ---------- */
const G=[
{id:'dots',name:'Dot flash',ic:'🔵',type:'focus',blurb:'See dots, say how many',
 make(a,L){let k=0;const c=cs('dots'),n=R(2,Math.min(c==2?12:10,[4,6,8,10,12][L-1])),ms=[3000,2500,2000,1500,1200][L-1]*(c==1?1.5:1),N=c<2?10:12,
  cells=c==1?[...Array(n).keys()]:shuf([...Array(N).keys()]).slice(0,n),d=h('div','dots'+(c<2?' tf':'')),o=h('div'),cn=h('div','big'),
  pick=()=>choices(o,near(n,4,1,12),n,'Group the dots in twos or fives, then add the groups.',v=>Math.abs(v-n)==1?'offby1':'subitize');
  for(let i=0;i<N;i++){const on=cells.includes(i),e=on&&c==0?h('button','d'):h('div','d'+(on?'':' e'));
   if(on&&c==0){e.setAttribute('aria-label','Dot. Tap to count it');e.onclick=()=>{if(!e.classList.contains('cnt')){e.classList.add('cnt');k++;cnt(k);cn.textContent='Counted: '+k}}}d.append(e)}
  a.append(d,cn,o);
  if(c==0){cn.textContent='Counted: 0';pick()}else later(()=>{d.className='ctr';d.textContent='?';pick()},ms);
  return c==0?'Concrete: tap every dot to count it. Then choose the total.':c==1?'Picture: the dots sit in a ten-frame. Look, then they hide.':'Number: look at the dots. They hide soon. How many were there?'}},
{id:'line',name:'Number line drop',ic:'📏',type:'focus',blurb:'Tap where a number lives',
 make(a,L){const c=cs('line'),M=[10,20,50,100,1000][L-1],t=R(1,M-1),tol=M*[.15,.12,.1,.08,.06][L-1]*(c==0?1.4:1),nl=h('div','nl'),big=h('div','big','Where is ');let kv=Math.round(M/2);
  big.append(dig(t),'?');S.q=t;S.qm=M;a.append(big);if(c==0&&t<100)a.append(bv(t));a.append(nl);nl.append(h('div','ln'));
  for(let i=0;i<=10;i++){const k=h('div','tk');k.style.left=i*10+'%';if(c==0||(c==1&&i%5==0)||i==0||i==10)k.append(h('span','',Math.round(i*M/10)));nl.append(k)}
  const go=v=>{if(S.cur.done)return;const m=h('div','mk'),sw=swap(t),ok=Math.abs(v-t)<=tol;m.style.left=v/M*100+'%';nl.append(m);if(!ok)later(()=>m.remove(),1000);
   answer(ok,'You chose '+v+'. '+(v<t?'Go a little to the right.':'Go a little to the left.'),null,sw!=t&&sw<=M&&Math.abs(v-sw)<=tol?'reversal':'magnitude')};
  nl.onpointerdown=e=>{const r=nl.getBoundingClientRect();go(Math.round(Math.min(1,Math.max(0,(e.clientX-r.left)/r.width))*M))};
  nl.tabIndex=0;nl.setAttribute('role','slider');nl.setAttribute('aria-label','Number line from 0 to '+M+'. Arrow keys move. Enter chooses.');nl.setAttribute('aria-valuemin',0);nl.setAttribute('aria-valuemax',M);nl.setAttribute('aria-valuenow',kv);
  nl.onkeydown=e=>{const s=e.shiftKey?Math.max(1,Math.round(M/10)):1;if(e.key=='ArrowRight')kv=Math.min(M,kv+s);else if(e.key=='ArrowLeft')kv=Math.max(0,kv-s);else if(e.key=='Enter'){go(kv);return}else return;e.preventDefault();nl.setAttribute('aria-valuenow',kv);cnt(Math.round(kv/M*10)+1)};
  return c==0?'Concrete: the blocks show the number. Tap the line where it belongs.':c==1?'Picture: the middle of the line is marked. Tap where the number belongs.':'Number: tap the line from 0 to '+M+'. You can also use arrow keys and Enter.'}},
{id:'blocks',name:'Build the number',ic:'🧱',type:'calm',blurb:'Make a number from tens and ones',
 make(a,L){const c=cs('blocks'),M=[10,20,40,70,99][L-1];let t=R(3,M),g=0,T=0,O=0;
  if(S.rem=='reversal'&&M>=20)while((Math.floor(t/10)==t%10||t<12)&&g++<99)t=R(12,M);
  const mat=h('div','mat'),info=h('div','big'),row=h('div','opts'),msg=h('div');info.setAttribute('aria-live','polite');
  const adj=(i,d)=>{if(S.cur.done)return;if(i)O=Math.max(0,O+d);else T=Math.max(0,T+d);msg.textContent='';if(O>=10){O-=10;T++;msg.textContent='10 ones became 1 ten!'}cnt(T*10+O||1);draw()};
  const draw=()=>{mat.innerHTML='';info.textContent='Target ';info.append(dig(t),' · You have ',dig(T*10+O));
   [['Tens','tn',0],['Ones','on',1]].forEach(([n,k,i])=>{if(!i&&M<=10)return;const q=i?O:T,col=h('div','col '+k);col.append(h('h4','',n+(c==1?': '+q:'')));
    if(c<2)for(let j=0;j<q;j++){const b=h('button',i?'o':'t');b.setAttribute('aria-label','Remove one '+n);b.onclick=()=>adj(i,-1);col.append(b)}
    else{const u=h('button','btn','▲'),d=h('button','btn','▼'),s=h('div','big');u.setAttribute('aria-label','More '+n);d.setAttribute('aria-label','Fewer '+n);u.onclick=()=>adj(i,1);d.onclick=()=>adj(i,-1);s.append(dig(q));col.className+=' stp';col.append(u,s,d)}
    mat.append(col)})};
  if(c<2){const x=h('button','btn','+1 one');x.onclick=()=>adj(1,1);row.append(x);if(M>10){const y=h('button','btn','+1 ten');y.onclick=()=>adj(0,1);row.append(y)}}
  const ck=h('button','btn p','Check');ck.onclick=()=>{const v=T*10+O,e=v!=t&&v==swap(t)?'reversal':v%10==t%10?'tens':Math.floor(v/10)==Math.floor(t/10)?'ones':'place';answer(v===t,v>t?'That is too many. Take some away.':'You need more. Count the tens first, then the ones.',null,e)};row.append(ck);
  a.append(info,mat,row,msg);draw();S.q=t;S.qm=M;
  return c==0?'Concrete: add blocks. Tap a block to take it away. Ten ones trade for one ten.':c==1?'Picture: the blocks have counts. Build the target.':'Number: use the arrows to set the tens digit and the ones digit.'}},
{id:'compare',name:'Bigger or smaller',ic:'⚖️',type:'focus',blurb:'Compare two numbers',
 make(a,L){const M=[9,20,50,100,999][L-1],mg=Math.max(1,Math.round(M*[.4,.25,.15,.08,.03][L-1]));let x=R(1,M),y=R(1,M),g=0;
  while(Math.abs(x-y)<mg&&g++<200){x=R(1,M);y=R(1,M)}if(x===y)y=x<M?x+1:x-1;
  const big=Math.random()<.5,right=big?Math.max(x,y):Math.min(x,y),w=h('div','opts');
  [x,y].forEach(v=>{const b=h('button','opt cmp',v);if(L<=3){const br=h('div');br.style.width=v/M*100+'%';b.append(br)}
   b.onclick=()=>answer(v===right,L<=3?'Look at the bars. A longer bar means a bigger number.':'Compare the tens first. Then compare the ones.',b);w.append(b)});
  a.append(w);return 'Tap the '+(big?'bigger':'smaller')+' number.'}},
{id:'sort',name:'Smallest to biggest',ic:'🔢',type:'calm',blurb:'Put numbers in order',
 make(a,L){const n=[3,3,4,5,6][L-1],M=[10,20,50,100,999][L-1],s=new Set();while(s.size<n)s.add(R(1,M));
  const asc=[...s].sort((p,q)=>p-q),w=h('div','opts');let k=0;
  shuf(asc).forEach(v=>{const b=h('button','opt',v);b.onclick=()=>{if(S.cur.done)return;
   if(v===asc[k]){k++;b.disabled=true;b.append(h('small','','#'+k));if(k===n)answer(true,'')}
   else answer(false,'Find the smallest number that is left. Look at the biggest digit place first.')};w.append(b)});
  a.append(w);return 'Tap the numbers from the smallest to the biggest.'}},
{id:'skip',name:'Skip count steps',ic:'🦘',type:'calm',blurb:'Find the missing step',
 make(a,L){const st=[2,5,10,3,4][L-1],s0=R(0,3)*st,seq=[0,1,2,3,4].map(i=>s0+i*st),m=R(1,4),r=h('div','seq');
  seq.forEach((v,i)=>r.append(h('div','cell',i===m?'?':v)));a.append(r);
  choices(a,near(seq[m],4,0,seq[m]+st*3),seq[m],'Each step adds '+st+'. Count on from the number before the gap.');
  return 'Count in steps of '+st+'. Which number fits in the gap?'}}
];
G.forEach(g=>S.g[g.id]=base());
try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');Object.assign(S,s);G.forEach(g=>S.g[g.id]=Object.assign(base(),S.g[g.id]))}catch(e){}
S.cur=null;S.a=Object.assign({snd:1,hap:0,pal:'',tc:'',oc:''},S.a);S.err=S.err||{};
const SK={dots:'sub',line:'ord',blocks:'pv',compare:'ord',sort:'ord',skip:'pv'},SN={sub:'seeing small groups',ord:'order and position',pv:'place value'};G.forEach(g=>g.skill=SK[g.id]);const gm=id=>G.find(g=>g.id===id);

/* ---------- Sound ---------- */
let ac;
function tone(f,t0,d,type,v){const T=ac.currentTime+t0,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;
 g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(v,T+.02);g.gain.exponentialRampToValueAtTime(.0001,T+d);o.connect(g).connect(ac.destination);o.start(T);o.stop(T+d+.05)}
function sound(ok){buzz(ok?30:10);if(!S.a.snd)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();
 if(ok)S.hi?[523,659,784,1047].forEach((f,i)=>tone(f,i*.07,.25,i%2?'square':'triangle',.06)):[523,659].forEach((f,i)=>tone(f,i*.14,.5,'sine',.06));
 else S.hi?tone(294,0,.25,'triangle',.07):tone(330,0,.5,'sine',.045)}catch(e){}}

/* ---------- Core: answers, levels, points ---------- */
function fb(m,c){const e=$('fb');e.textContent=m;e.className='fb '+(c||'')}
function answer(ok,hint,btn,et){
  if(!S.cur||S.cur.done)return;const g=S.g[S.cur.id];S.hist=[...S.hist,ok].slice(-6);g.a++;
  if(ok){S.cur.done=true;if(btn)btn.classList.add('ok');clearTimeout(hz);S.cur.cor=(S.cur.cor||0)+1;if(S.cur.shown)S.help[S.cur.shown]=(S.help[S.cur.shown]||0)+1;g.c++;const p=10*g.lv;S.pts+=p;S.st++;g.wr=0;let m='Nice! +'+p+' points.';
    if(g.pause>0)g.pause--;else g.run++;
    if(g.run>=3){if(g.lv<5){g.lv++;S.over=null;S.rem=null;m+=' Level up! Now level '+g.lv+'.'}g.run=0}
    sound(1);fb(m,'ok');ghost();later(next,1200);
  }else{const e=et||DEF[S.cur.id];S.err[e]=(S.err[e]||0)+1;S.rem=e;g.run=0;g.pause=2;g.wr++;let m='Not yet. '+hint;if(S.q!=null&&Date.now()-S.cur.q0<1200){S.hes.rush++;m='That was quick. Take a breath and look first. '+hint;showRep(alw()[0],'A quick look can help.')}
    if(g.wr>=2){const c=cs(S.cur.id);if(CR[S.cur.id]&&c>0){S.over=c-1;g.wr=0;m+=' Let us go back to '+['blocks','pictures'][c-1]+' for a moment.';later(next,2200)}else if(g.lv>1){g.lv--;g.wr=0;m+=' We will make it a little easier.'}}
    if(btn){btn.disabled=true;btn.classList.add('no')}sound(0);fb(m,'hint')}
  upd();save();
}
function next(){clr();S.cur.done=false;S.q=null;S.cur.q0=Date.now();S.cur.pz=0;S.cur.shown=null;$('rep').hidden=true;const a=$('area');a.innerHTML='';fb('Take your time. There is no timer.');$('ins').textContent=gm(S.cur.id).make(a,S.g[S.cur.id].lv);craBar();upd();poke()}
function craBar(){const b=$('cra');b.innerHTML='';if(!CR[S.cur.id])return;const c=cs(S.cur.id);['🧱 Blocks','🖼 Pictures','🔢 Numbers'].forEach((n,i)=>{const x=h('button','btn',n);x.setAttribute('aria-pressed',i==c);x.onclick=()=>{S.over=i;next()};b.append(x)})}
function open(id,c){S.over=c==null?null:c;S.cur={id,t0:Date.now(),done:false,cor:0};clearInterval(ght);ght=setInterval(ghost,1000);view('stage');ghost();$('gt').textContent=gm(id).ic+' '+gm(id).name;next()}

const swap=n=>+String(n).split('').reverse().join(''),CR={dots:1,line:1,blocks:1},cs=id=>S.over!=null?S.over:(S.g[id].lv<3?0:S.g[id].lv<5?1:2);
const dig=n=>{const s=h('span','dg'),t=String(n);[...t].forEach((c,i)=>s.append(h('b','d'+Math.min(3,t.length-i),c)));return s};
const buzz=ms=>{if(S.a.hap&&navigator.vibrate)navigator.vibrate(ms)};
const bv=n=>{const w=h('div','tower');for(let i=0;i<Math.floor(n/10);i++)w.append(h('div','t'));for(let i=0;i<n%10;i++)w.append(h('div','o'));w.setAttribute('role','img');w.setAttribute('aria-label',Math.floor(n/10)+' tens and '+n%10+' ones');return w};
const PEN=[262,294,330,392,440,523,587,659,784,880];
function cnt(k){buzz(15);if(!S.a.snd)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();tone(PEN[(Math.max(1,k)-1)%10],0,.3,S.hi?'triangle':'sine',.05)}catch(e){}}
const EL={reversal:'Reversed digits',tens:'Tens column',ones:'Ones column',place:'Place value',magnitude:'Number size on the line',subitize:'Seeing small groups',offby1:'Off-by-one counting',order:'Ordering numbers',pattern:'Counting patterns'};
const DEF={dots:'subitize',line:'magnitude',blocks:'place',compare:'order',sort:'order',skip:'pattern'};
const FX={reversal:['blocks','Use the coloured columns. Say the tens first.'],tens:['blocks','Count tens bars first, in their own column.'],ones:['blocks','Trade 10 ones for 1 ten to see regrouping.'],place:['blocks','Build on the tens and ones mat before using digits.'],magnitude:['line','Use the blocks above the line and the halfway mark.'],subitize:['dots','Practise ten-frames and tap-counting.'],offby1:['dots','Tap-count each dot with the sound steps.'],order:['sort','Compare the tens first.'],pattern:['skip','Count on from the number before the gap.']};
function view(v){['dash','stage','prog'].forEach(i=>$(i).hidden=i!=v);ROOT().scrollIntoView({block:'start'})}

function diag(){clr();clearTimeout(hz);clearInterval(ght);$('gh').hidden=true;$('rep').hidden=true;S.cur={id:'diag',t0:Date.now(),done:true};S.over=null;view('stage');$('gt').textContent='Warm-up quest';$('lvl').textContent='';$('cra').innerHTML='';
 const Q=[],sc={sub:0,ord:0,pv:0};let lim=0,rv=0,i=0;
 [3,5,7].forEach(n=>Q.push({k:'sub',n,o:near(n,4,1,9),r:n}));
 [[19,1],[70,-1],[48,1]].forEach(([x,d])=>Q.push({k:'ord',q:'Which number comes right '+(d>0?'after ':'before ')+x+'?',o:[x+d,x+2*d,x-d,x+10*d],r:x+d}));
 [['3 tens and 5 ones make…',[35,53,305,8],35],['How many tens are in 62?',[6,2,8,62],6],['4 tens and 7 ones make…',[47,74,407,11],47]].forEach(([q,o,r])=>Q.push({k:'pv',q,o,r}));
 const end=()=>{S.prof={sub:sc.sub,ord:sc.ord,pv:sc.pv,lim,rv};G.forEach(g=>S.g[g.id].lv=Math.min(4,1+S.prof[g.skill]));save();const a=$('area');a.innerHTML='';fb('All done. Your path is ready.','ok');
  const b=h('button','btn p','See my path');b.onclick=()=>{S.cur=null;view('dash');dash();upd()};a.append(h('p','','Thanks! Each game now starts at a comfortable level and follows your progress.'),b)};
 const go=()=>{if(i>=Q.length)return end();const q=Q[i],a=$('area'),o=h('div');a.innerHTML='';fb('No scores and no timer. Question '+(i+1)+' of '+Q.length+'.');$('ins').textContent=q.k=='sub'?'Look at the dots. Then pick how many.':q.q;
  const pick=()=>{const w=h('div','opts');shuf(q.o).forEach(v=>{const b=h('button','opt');b.append(dig(v));b.setAttribute('aria-label','Choose '+v);
   b.onclick=()=>{if(v===q.r){sc[q.k]++;if(q.k=='sub')lim=Math.max(lim,q.n)}else if(q.k=='pv'&&v===swap(q.r)){rv++;S.err.reversal=(S.err.reversal||0)+1}buzz(10);i++;go()};w.append(b)});o.append(w)};
  if(q.k=='sub'){const cl=shuf([...Array(12).keys()]).slice(0,q.n),d=h('div','dots');for(let j=0;j<12;j++)d.append(h('div','d'+(cl.includes(j)?'':' e')));a.append(d,o);later(()=>{d.className='ctr';d.textContent='?';pick()},1800)}else{a.append(o);pick()}};
 go()}

function prog(){const p=$('prog');p.innerHTML='';view('prog');
 const top=h('div','bar'),bk=h('button','btn','← Back to menu'),tg=h('button','btn',S.edu?'Show learner view':'Show educator view');
 bk.onclick=()=>{view('dash');dash()};tg.onclick=()=>{S.edu=S.edu?0:1;save();prog()};top.append(bk,h('h2','','Progress'),tg);p.append(top);
 const sec=t=>{const s=h('section','sec');s.append(h('h3','',t));p.append(s);return s},E=Object.entries(S.err).sort((x,y)=>y[1]-x[1]),tot=E.reduce((x,y)=>x+y[1],0)||1;
 const m=sec('Number-sense map');
 if(S.prof){[['sub','Seeing small groups'],['ord','Order and position'],['pv','Place value']].forEach(([k,n])=>{m.append(h('p','',n+': '+S.prof[k]+' of 3 in the warm-up'));const b=h('div','pb'),f=h('i');f.style.width=S.prof[k]/3*100+'%';b.append(f);m.append(b)});m.append(h('p','','Largest group seen at a glance: '+S.prof.lim))}
 else m.append(h('p','','Take the warm-up quest to see your map.'));
 const e=sec('Error patterns');
 if(!E.length)e.append(h('p','','No mistakes recorded yet. Patterns show up here as you play.'));
 else if(!S.edu)E.slice(0,3).forEach(([k,n])=>{const r=h('div','setrow'),b=h('button','btn p','Practise this');r.append(h('span','',EL[k]+': '+n+' times. Tip: '+FX[k][1]));b.onclick=()=>{S.rem=k;open(FX[k][0],0)};r.append(b);e.append(r)});
 else{const t=h('table');t.innerHTML='<tr><th>Pattern</th><th>Count</th><th>Share</th></tr>';E.forEach(([k,n])=>{const r=t.insertRow();r.insertCell().textContent=EL[k];r.insertCell().textContent=n;r.insertCell().textContent=Math.round(n/tot*100)+'%'});e.append(t)}
 if(S.edu){const g=sec('Game summary'),t=h('table');t.innerHTML='<tr><th>Game</th><th>Level</th><th>Accuracy</th><th>Time</th></tr>';
  G.forEach(x=>{const s=S.g[x.id],r=t.insertRow();r.insertCell().textContent=x.name;r.insertCell().textContent=s.lv;r.insertCell().textContent=s.a?Math.round(s.c/s.a*100)+'% of '+s.a:'-';r.insertCell().textContent=Math.round(s.t/60)+' min'});g.append(t);
  const c=h('button','btn p','Copy report');c.onclick=()=>{const x='NeuroFlow dyscalculia report\n'+E.map(([k,n])=>EL[k]+': '+n+'. '+FX[k][1]).join('\n');if(navigator.clipboard)navigator.clipboard.writeText(x).then(()=>c.textContent='Copied')};g.append(c)}
 const hs=sec('Hesitation and what helps'),hp=Object.entries(S.help);
 hs.append(h('p','','Long pauses: '+S.hes.load+'. Rushed wrong answers: '+S.hes.rush),h('p','',hp.length?'Views that helped: '+hp.map(([k,n])=>k+' ('+n+')').join(', '):'Views that help will show here.'));
 const rd=h('button','btn','Redo the warm-up quest');rd.onclick=diag;p.append(rd)}

function sets(){$('mt').textContent='Comfort settings';$('mmsg').textContent='Change anything, any time.';$('modal').hidden=false;const b=$('mbody');b.innerHTML='';
 const tg=(l,k)=>{const r=h('div','setrow'),x=h('button','btn',S.a[k]?'On':'Off');x.setAttribute('aria-pressed',!!S.a[k]);x.onclick=()=>{S.a[k]=S.a[k]?0:1;save();sets()};r.append(h('span','',l),x);b.append(r)};
 tg('Counting sounds','snd');tg('Vibration (phones)','hap');
 const r=h('div','setrow');r.append(h('span','','Colour palette'));
 [['','Soft'],['pal-hc','Strong contrast'],['pal-yb','Yellow on black']].forEach(([k,n])=>{const x=h('button','btn'+(S.a.pal==k?' p':''),n);x.onclick=()=>{S.a.pal=k;pal();save();sets()};r.append(x)});b.append(r);
 [['tc','Tens digit colour','#2b6cb0'],['oc','Ones digit colour','#c05621']].forEach(([k,l,d])=>{const r=h('div','setrow'),i=h('input');i.type='color';i.value=S.a[k]||d;i.setAttribute('aria-label',l);i.oninput=()=>{S.a[k]=i.value;pal();save()};r.append(h('span','',l),i);b.append(r)})}
function pal(){ROOT().classList.remove('pal-hc','pal-yb');if(S.a.pal)ROOT().classList.add(S.a.pal);const s=ROOT().style;S.a.tc?s.setProperty('--tens',S.a.tc):s.removeProperty('--tens');S.a.oc?s.setProperty('--ones',S.a.oc):s.removeProperty('--ones')}

/* ---------- Hesitation monitor, other views, ghost ---------- */
const MOD=['Digits','Number line','Blocks','Rhythm'],HZ={line:[2,3,0],blocks:[1,3,0]};let hz,ght;
const alw=()=>HZ[S.cur.id].filter(m=>m==0||S.q<100);
function poke(){clearTimeout(hz);if(S.cur&&!S.cur.done&&S.q!=null)hz=setTimeout(pause,6000)}
function pause(){if(!S.cur||S.cur.done||S.q==null)return;S.hes.load++;S.cur.pz++;const a=alw();showRep(a[(S.cur.pz-1)%a.length],'Taking a moment is fine. Here is another way to look at it.');if(S.cur.pz<3)poke();save()}
function showRep(m,why){const n=S.q,M=S.qm,r=$('rep');S.cur.shown=MOD[m];r.hidden=false;r.innerHTML='';r.append(h('p','',why+' ('+MOD[m]+')'));
 if(m==0){const d=h('div','big');d.append(dig(n));r.append(d,h('p','','Halfway on this scale is '+M/2+'. '+n+' is '+(n<M/2?'before':'after')+' halfway.'))}
 else if(m==1){const l=h('div','nl'),k=h('div','mk');l.append(h('div','ln'),k);k.style.left=n/M*100+'%';[0,M].forEach((v,i)=>{const t=h('div','tk');t.style.left=i*100+'%';t.append(h('span','',v));l.append(t)});r.append(l)}
 else if(m==2)r.append(bv(n));
 else{const b=h('button','btn','▶ Play the beats');b.onclick=()=>beats(n);r.append(h('p','','Long beats are tens. Short beats are ones.'),b)}}
function beats(n){if(!S.a.snd){fb('Turn on counting sounds in settings to hear the beats.','hint');return}
 try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();let T=0;const ty=S.hi?'triangle':'sine';for(let i=0;i<Math.floor(n/10);i++){tone(196,T,.5,ty,.08);T+=.7}T+=.2;for(let i=0;i<n%10;i++){tone(440,T,.18,ty,.06);T+=.35}}catch(e){}}
function ghost(){const e=$('gh'),g=S.cur&&S.g[S.cur.id];if(!g){e.hidden=true;return}e.hidden=false;e.innerHTML='';
 if(!g.spc){e.append(h('p','','Play a few rounds. Next time you can race your own ghost.'));return}
 const gh=Math.floor((Date.now()-S.cur.t0)/1000/(g.spc*1.15));
 [['You',S.cur.cor||0],['Your ghost from last time (a little slower)',gh]].forEach(([n,v])=>{e.append(h('p','',n+': '+v+' correct'));const b=h('div','pb'),f=h('i');f.style.width=Math.min(100,v*10)+'%';b.append(f);e.append(b)})}

/* ---------- Dashboard + AI recommendation ---------- */
function rec(){const lt=S.last&&gm(S.last).type,load=S.hist.filter(x=>!x).length;
  let pool=G.filter(g=>g.id!==S.last);if(lt)pool=pool.filter(g=>g.type!==lt);
  if(load>=3){const c=pool.filter(g=>g.type==='calm');if(c.length)pool=c}
  const g=pool.sort((x,y)=>(S.prof?S.prof[x.skill]-S.prof[y.skill]:0)||S.g[x.id].t-S.g[y.id].t)[0]||G[0];
  const why=load>=3?'Recent questions felt tricky, so here is a calmer one.':!lt?'A gentle place to start.':lt==='focus'?'You just did a focus game, so this one is more relaxed.':'You just did a calm game, so this one asks for a little more focus.';
  return{g,why:why+(S.prof?' It works on '+SN[g.skill]+'.':'')}}
function dash(){const ai=$('ai'),gr=$('grid');ai.innerHTML='';const d=h('div');let b;
  if(!S.prof){d.append(h('b','','Start with the warm-up quest'),h('p','','Nine short, gentle questions. No score and no timer. They set your starting path.'));b=h('button','btn p','Start');b.onclick=diag}
  else{const r=rec();d.append(h('b','','Recommended next: '+r.g.ic+' '+r.g.name),h('p','',r.why));b=h('button','btn p','Play');b.onclick=()=>open(r.g.id)}
  ai.append(d,b);gr.innerHTML='';G.forEach(g=>{const c=h('button','card'),t=S.g[g.id].t;c.append(h('span','ic',g.ic),h('b','',g.name),h('small','',g.blurb),h('small','','Level '+S.g[g.id].lv+', '+(t<60?t+' sec':Math.round(t/60)+' min')+' played'));c.onclick=()=>open(g.id);gr.append(c)})}
function upd(){$('st').textContent=S.st;$('pt').textContent=S.pts;$('avE').textContent=S.av;$('avB').textContent=S.bd;
  $('mode').textContent=S.hi?'⚡ High stimulation':'🌿 Low stimulation';$('mode').setAttribute('aria-pressed',S.hi);
  if(S.cur&&S.g[S.cur.id]){const g=S.g[S.cur.id];$('lvl').textContent='Level '+g.lv+' of 5, '+g.run+'/3 in a row'}}

/* ---------- Sensory toggle ---------- */

/* ---------- Avatar shop ---------- */
const AV=[['🙂',0],['🦊',30],['🐼',50],['🦉',80],['🐙',120],['🦄',200]],BD=[['⭐',0],['🌱',20],['🎈',40],['🏅',80],['👑',150]];
function shop(){$('mt').textContent='Avatar shop';$('mmsg').textContent='Spend points on a new avatar or badge.';$('modal').hidden=false;const bx=$('mbody');bx.innerHTML='';
  [['Avatar',AV,'av'],['Badge',BD,'bd']].forEach(([t,L,k])=>{bx.append(h('h3','',t));const w=h('div','opts');
    L.forEach(([e,c])=>{const own=S.own.includes(e),b=h('button','opt',e);b.append(h('small','',S[k]===e?'Wearing':own?'Wear':c+' pts'));
      b.onclick=()=>{if(!own){if(S.pts<c){$('mmsg').textContent='Not enough points yet. Keep playing and come back!';return}S.pts-=c;S.own.push(e)}S[k]=e;save();upd();shop();$('mmsg').textContent='Looking good!'};w.append(b)});bx.append(w)})}

/* ---------- Start: bind to the elements React rendered ---------- */
let started=false;
export function start(){
  if(started)return;started=true;
  $('back').onclick=()=>{clr();clearTimeout(hz);clearInterval(ght);if(S.cur&&S.g[S.cur.id]){const g=S.g[S.cur.id],el=(Date.now()-S.cur.t0)/1000;g.t+=Math.round(el);if(S.cur.cor>0)g.spc=el/S.cur.cor;S.last=S.cur.id}S.cur=null;S.over=null;save();view('dash');dash();upd()};
  $('mode').onclick=()=>{S.hi=!S.hi;ROOT().classList.toggle('high-stim',S.hi);save();upd();sound(1)};
  $('av').onclick=shop;$('mclose').onclick=()=>$('modal').hidden=true;
  addEventListener('keydown',e=>{if(e.key==='Escape')$('modal').hidden=true});
  $('bp').onclick=prog;$('bs').onclick=sets;$('area').addEventListener('pointerdown',poke);$('area').addEventListener('keydown',poke);pal();ROOT().classList.toggle('high-stim',S.hi);dash();upd();
}

/* Called by the page when this section is hidden: same as pressing "Back to menu", and close any dialog. */
export function stop(){
  if(!started)return;
  $('modal').hidden=true;
  if(!$('stage').hidden)$('back').click();
}
