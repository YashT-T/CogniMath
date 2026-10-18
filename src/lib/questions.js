/* Question bank. Maths-type topics use generators, so numbers change every time and
   a sprint can never repeat a question. Text topics use a fixed pool, drawn without replacement. */
const CM={};
const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1)), pick=a=>a[r(0,a.length-1)];
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=r(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
const sup=n=>n===1?'':String(n).replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]), px=n=>'x'+sup(n);
const tm=(c,n)=>n===0?String(c):(c===1?'':c===-1?'−':c)+px(n);
const fm=n=>n.toLocaleString('en-IN');

// mk(prompt, correct answer, wrong answers, explanation, tag) -> shuffled multiple-choice question
function mk(p,ans,wr,e,tag){
  const w=[...new Set(wr.map(String))].filter(x=>x!==String(ans));
  for(let i=1;w.length<3;i++){
    if(typeof ans==='number')[ans+i,ans-i].forEach(v=>{if(v>=0&&!w.includes(String(v)))w.push(String(v))});
    else w.push(ans+' + '+i);
  }
  const a=shuf([String(ans),...w.slice(0,3)]);
  return {p,a,c:a.indexOf(String(ans)),e,tag};
}

const DIFF=[
()=>{const a=r(2,9),n=r(2,6);return mk(`Differentiate ${tm(a,n)}.`,tm(a*n,n-1),[tm(a,n-1),tm(a*n,n),tm(a*(n-1),n-1),tm(n,n-1)],
  `Power rule: multiply by the exponent, then lower the exponent by one. ${a} × ${n} = ${a*n}, and ${px(n)} becomes ${n-1===1?'x':px(n-1)}.`,'Power rule')},
()=>{const a=r(1,5),n=r(2,4),k=r(2,4),f=a*n*k**(n-1);return mk(`If f(x) = ${tm(a,n)}, what is f′(${k})?`,f,[a*k**n,a*n*k**n,n*k**(n-1),a*(n-1)*k**(n-1)],
  `First differentiate: f′(x) = ${tm(a*n,n-1)}. Then substitute x = ${k} to get ${f}.`,'Evaluating a derivative')},
()=>{const F=[['sin x','cos x'],['cos x','−sin x'],['eˣ','eˣ'],['ln x','1/x'],['tan x','sec² x']],c=r(2,7),i=r(0,4),
  ap=(c,d)=>d==='1/x'?`${c}/x`:d[0]==='−'?`−${c}${d.slice(1)}`:`${c}${d}`;
  return mk(`Differentiate ${c}${F[i][0]}.`,ap(c,F[i][1]),F.filter((_,j)=>j!==i).map(f=>ap(c,f[1])),
  `The constant ${c} just rides along. The standard result is d/dx(${F[i][0]}) = ${F[i][1]}.`,'Standard derivatives')},
()=>{const a=r(2,5),b=r(1,9),n=r(2,5),s=`${a}x + ${b}`;return mk(`Differentiate (${s})${sup(n)}.`,`${n*a}(${s})${sup(n-1)}`,
  [`${n}(${s})${sup(n-1)}`,`${n*a}(${s})${sup(n)}`,`${a}(${s})${sup(n-1)}`,`${n*a+b}(${s})${sup(n-1)}`],
  `Chain rule: differentiate the outside to get ${n}(${s})${sup(n-1)}, then multiply by the derivative of the inside, ${a}.`,'Chain rule')},
()=>{const n=r(2,5);return mk(`Differentiate ${px(n)} sin x.`,`${tm(n,n-1)} sin x + ${px(n)} cos x`,
  [`${tm(n,n-1)} cos x`,`${tm(n,n-1)} sin x − ${px(n)} cos x`,`${px(n)} cos x`,`${tm(n,n-1)} sin x · ${px(n)} cos x`],
  `Product rule: (uv)′ = u′v + uv′. Here u = ${px(n)}, v = sin x, so u′ = ${tm(n,n-1)} and v′ = cos x. Add the two parts; do not multiply them.`,'Product rule')}
];

const MATHS=[
()=>{const P=r(2,20)*100,d=pick([10,15,20,25,30,40]),o=P*d/100;return mk(`A ₹${fm(P)} item is ${d}% off. What is the sale price?`,'₹'+fm(P-o),['₹'+fm(o),'₹'+fm(P+o),'₹'+fm(P-d)],
  `${d}% of ₹${fm(P)} is ₹${fm(o)}. The sale price is what is left: ₹${fm(P)} − ₹${fm(o)} = ₹${fm(P-o)}.`,'Percentages')},
()=>{const s=r(4,16)*10,t=pick([1.5,2,2.5,3,4]),d=s*t;return mk(`A bus covers ${d} km in ${t} hours. What is its average speed?`,s+' km/h',[`${d-t} km/h`,`${d*t} km/h`,`${s+10} km/h`,`${Math.round(d/(2*t))} km/h`],
  `Average speed = distance ÷ time = ${d} ÷ ${t} = ${s} km/h.`,'Speed, distance, time')},
()=>{const n=r(3,12),u=r(4,45),m=n+r(2,8);return mk(`${n} notebooks cost ₹${n*u}. What do ${m} cost at the same price?`,'₹'+m*u,['₹'+(n*u*m),'₹'+(n*u+m),'₹'+(u+m),'₹'+(n+m)*u],
  `Find the price of one first: ₹${n*u} ÷ ${n} = ₹${u}. Then ${m} × ₹${u} = ₹${m*u}.`,'Unit rates')},
()=>{const b=pick([2,4,5,6,8]),u=r(30,90),p=b+pick([-1,1,2,3,4,6]);return mk(`A recipe for ${b} people needs ${b*u} g of rice. How much for ${p} people?`,p*u+' g',
  [`${b*u+(p-b)} g`,`${Math.round(b*u*b/p)} g`,`${p*u+u} g`,`${p*u-u} g`],`Per person: ${b*u} ÷ ${b} = ${u} g. For ${p} people: ${p} × ${u} = ${p*u} g.`,'Ratios and scaling')},
()=>{const q=pick([10,20,25,50]),a=r(2,12)*100,b=a*(100+q)/100;return mk(`A phone plan rises from ₹${a} to ₹${b}. What is the percentage increase?`,q+'%',[`${q*2}%`,`${q+5}%`,`${Math.round(q/2)}%`,`${Math.round((b-a)/b*100)}%`],
  `The rise is ₹${b-a}. Percentage change is measured against the original price: ${b-a} ÷ ${a} = ${q}%, not against the new price.`,'Percentage change')}
];

const NAMES=['Mira','Jai','Lee','Anya','Dev','Sana','Rohan','Tara'];
const LOGIC=[
()=>{const n=shuf(NAMES).slice(0,pick([3,4])),w=pick([['taller','tallest','shortest'],['older','oldest','youngest'],['faster','fastest','slowest']]),top=r(0,1)===0,ans=top?n[0]:n[n.length-1];
  const st=shuf(n.slice(0,-1).map((x,i)=>`${x} is ${w[0]} than ${n[i+1]}.`)).join(' ');
  return mk(`${st} Who is the ${top?w[1]:w[2]}?`,ans,[...n.filter(x=>x!==ans),'Cannot tell'],
  `Chain the statements into one order: ${n.join(' > ')}. The ${top?w[1]:w[2]} is ${ans}.`,'Ordering and ranking')},
()=>{const W=['CAT','DOG','SUN','MAP','BAG','PEN','FOX','JAR','HEN','TIN'],[x,y]=shuf(W),k=r(1,4),
  en=(w,s)=>[...w].map(c=>String.fromCharCode((c.charCodeAt(0)-65+s+26)%26+65)).join('');
  return mk(`In a code, every letter moves ${k} place${k>1?'s':''} forward, so ${x} becomes ${en(x,k)}. What does ${y} become?`,en(y,k),[en(y,k+1),en(y,k-1),en(y,-k)],
  `Shift each letter ${k} forward: ${[...y].map(c=>c+'→'+en(c,k)).join(', ')}.`,'Letter codes')},
()=>{const [x,y,z]=shuf(['glips','mords','zems','blips','tarns','vols']);
  return r(0,1)?mk(`All ${x} are ${y}. All ${y} are ${z}. Which must be true?`,`All ${x} are ${z}`,[`All ${z} are ${x}`,`Some ${z} are not ${y}`,`No ${x} are ${z}`,`All ${y} are ${x}`],
  `${x} sit inside ${y}, and ${y} sit inside ${z}, so ${x} sit inside ${z}. The reverse direction is not guaranteed.`,'Deduction')
  :mk(`No ${x} are ${y}. All ${z} are ${x}. Which must be true?`,`No ${z} are ${y}`,[`Some ${z} are ${y}`,`All ${y} are ${z}`,`All ${z} are ${y}`],
  `${z} sit entirely inside ${x}, and ${x} never overlap ${y}, so ${z} cannot overlap ${y}.`,'Deduction')},
()=>{const s=r(1,9),d=r(1,4),q=r(1,3),t=[s];let g=d;for(let i=0;i<5;i++){t.push(t[i]+g);g+=q}const nx=t[5]+g,df=t.slice(1).map((v,i)=>v-t[i]);
  return mk(`What comes next? ${t.join(', ')}, …`,nx,[t[5]+g-q,nx+q,nx+2*q],`The gaps are ${df.join(', ')}: each gap grows by ${q}. The next gap is ${g}, so ${t[5]} + ${g} = ${nx}.`,'Growing differences')}
];

const S=['▲','●','■','◆','★'];
const PAT=[
()=>{const s=r(2,30),d=r(3,9),t=[0,1,2,3,4].map(i=>s+i*d),nx=s+5*d;return mk(`Find the next term: ${t.join(', ')}, …`,nx,[nx+d,nx-1,nx+1],`Each term adds ${d}, so ${t[4]} + ${d} = ${nx}.`,'Arithmetic sequences')},
()=>{const s=r(1,5),k=pick([2,3]),t=[0,1,2,3,4].map(i=>s*k**i),nx=t[4]*k;return mk(`Find the next term: ${t.join(', ')}, …`,nx,[t[4]+k,t[4]+(t[4]-t[3]),nx+s],`Each term is ${k} times the one before, so ${t[4]} × ${k} = ${nx}.`,'Geometric sequences')},
()=>{const o=r(1,6),c=r(0,5),t=[0,1,2,3,4].map(i=>(o+i)**2+c),nx=(o+5)**2+c;return mk(`Find the next term: ${t.join(', ')}, …`,nx,[t[4]+(t[4]-t[3]),nx+2,nx-2],
  `Each term is n²${c?` + ${c}`:''}. The next is ${o+5}²${c?` + ${c}`:''} = ${nx}. The gaps grow, so adding the last gap again does not work.`,'Square patterns')},
()=>{const a=r(1,5),b=r(1,5),t=[a,b];for(let i=2;i<5;i++)t.push(t[i-1]+t[i-2]);const nx=t[4]+t[3];return mk(`Find the next term: ${t.join(', ')}, …`,nx,[t[4]*2,t[4]+t[2],nx+1],
  `Each term is the sum of the two before it: ${t[3]} + ${t[4]} = ${nx}.`,'Recurrence patterns')},
()=>{const x=r(1,9),dx=r(2,5),y=r(30,50),dy=r(2,5),t=[x,y,x+dx,y-dy,x+2*dx,y-2*dy],nx=x+3*dx;return mk(`Find the next term: ${t.join(', ')}, …`,nx,[y-3*dy,t[5]+dx,t[5]-dy],
  `Two sequences are interleaved. Terms 1, 3, 5 rise by ${dx}; terms 2, 4, 6 fall by ${dy}. Term 7 continues the first one: ${t[4]} + ${dx} = ${nx}.`,'Interleaved patterns')},
()=>{const cy=shuf(S).slice(0,pick([3,4])),L=cy.length,seq=Array.from({length:7},(_,i)=>cy[i%L]),ans=cy[7%L];return mk(`Which shape comes next? ${seq.join(' ')} …`,ans,S.filter(s=>s!==ans),
  `The pattern repeats every ${L} shapes (${cy.join(' ')}). Shape 8 is position ${7%L+1} of the cycle: ${ans}.`,'Repeating cycles')}
];

const CT=[
()=>mk('A café raises prices and sales fall. Someone says the price rise caused the drop. What should you check first?','Whether anything else changed at the same time',['How big the new menu is','Whether the café has a logo','Whether sales ever change'],
  'Two things happening in sequence does not prove one caused the other. Competitors, season or footfall may explain the drop.','Cause and effect'),
()=>mk('A poll says 80% of students love a new app. What is the most important first question?','Who answered, and how were they chosen?',['Was the app colourful?','Did the poll have a catchy name?','Can 80% be rounded to 100%?'],
  'A result is only as trustworthy as its sample. If only app fans were asked, 80% says little about all students.','Sample quality'),
()=>mk('“We changed our logo and then won the match, so the logo made us win.” What is the main flaw?','It assumes causation from sequence alone',['The logo may be too small','Winning cannot be measured','The team probably trained too much'],
  'A change that comes before an outcome has not been shown to cause it. Training, opponents and luck are all alternative explanations.','Cause and effect'),
()=>mk('“Everyone I know uses this app, so it must be the most popular.” What is the weakness?','Your friends are not a representative sample',['Popular apps are always free','Friends cannot use apps','The app may be new'],
  'People tend to know people like themselves. Popularity needs a broad, unbiased sample.','Sample quality'),
()=>mk('A study funded by a juice company finds juice is very healthy. What should you check first?','Who designed and ran the study, and what they stood to gain',['How tall the researchers are','Whether the juice is sweet','How long the report is'],
  'A funder with a stake is not proof the result is wrong, but it is a reason to look closely at the method and whether independent studies agree.','Source reliability'),
()=>mk('“Either we cut prices or we go bankrupt.” What is wrong with this argument?','It offers only two options when more may exist',['It uses numbers','It mentions bankruptcy','It is too short'],
  'This is a false dilemma. There may be other options, such as cutting costs, finding new customers or changing the product.','False dilemma'),
()=>mk('Ice-cream sales and drownings both rise in summer. Does ice cream cause drownings?','No: hot weather probably drives both',['Yes, sugar causes cramps','Yes, because they rise together','Only on weekends'],
  'A third factor (heat) explains both. Things that move together are correlated, but that does not make one the cause of the other.','Cause and effect'),
()=>mk('A famous chef says one phone is the best. Why is this weak evidence?','Cooking expertise does not make someone a phone expert',['Chefs never use phones','Famous people always lie','Phones cannot be ranked'],
  'Expertise is specific. Reviews, tests and specifications are better evidence than a celebrity opinion outside their field.','Authority claims'),
()=>mk('A medicine helped 3 of the 4 people who tried it. What is the biggest limit of this evidence?','Tiny sample and no comparison group',['The medicine is new','Three is an odd number','It was tested on people'],
  'Four people is too few to rule out chance, and without a group who did not take it, you cannot tell if they would have improved anyway.','Evidence strength'),
()=>mk('After a new teaching method, test scores rose 5%. Is the method proven to work?','Not yet: you need a comparison and to rule out other causes',['Yes, any rise proves it','No, scores cannot change','Yes, if teachers liked it'],
  'Scores may have risen anyway because of an easier test or a different cohort. A comparison group is what isolates the effect of the method.','Evidence strength')
];

const GR=[
()=>mk('Choose the correct sentence.','Neither of the answers is correct.',['Neither of the answers are correct.','Neither answers is correct.','Neither of answers are correct.'],'“Neither” takes a singular verb here, so use “is”.','Subject–verb agreement'),
()=>mk('Choose the best fit: “Had I known, I ___ earlier.”','would have left',['will leave','would leave','left'],'“Had I known” is a third conditional (unreal past), which pairs with “would have + past participle”.','Conditionals'),
()=>mk('Which is correct?','They’re going to miss the bus if they don’t hurry.',['Their going to miss the bus if they don’t hurry.','There going to miss the bus if they don’t hurry.','Theyre going to miss the bus if they don’t hurry.'],'“They’re” is short for “they are”. “Their” shows ownership and “there” points to a place.','Homophones'),
()=>mk('Choose the correct word: “The dog wagged ___ tail.”','its',['it’s','its’','it is'],'“Its” is the possessive and has no apostrophe. “It’s” always means “it is” or “it has”.','Apostrophes'),
()=>mk('Choose the correct word: “There are ___ cars on the road today.”','fewer',['less','lesser','more less'],'Use “fewer” for things you can count (cars) and “less” for amounts you cannot (traffic).','Countable nouns'),
()=>mk('Choose the correct word: “To ___ should I address the letter?”','whom',['who','whose','who’s'],'“Whom” is the object form, used after a preposition like “to”. Test it: “address it to him” works, so use “whom”.','Pronoun case'),
()=>mk('Choose the correct word: “The new rule will ___ everyone.”','affect',['effect','effects','affection'],'“Affect” is usually the verb (to influence). “Effect” is usually the noun (a result).','Commonly confused words'),
()=>mk('Which sentence is parallel in structure?','She likes hiking, swimming and reading.',['She likes hiking, swimming and to read.','She likes to hike, swimming and reading.','She likes hiking, to swim and reading.'],'Items in a list should share one form. Here all three use -ing.','Parallel structure'),
()=>mk('Choose the correct word: “She is taller ___ her brother.”','than',['then','that','as'],'“Than” compares two things. “Then” refers to time.','Comparisons'),
()=>mk('Choose the correct word: “I have lived here ___ 2019.”','since',['for','from','at'],'Use “since” with a starting point in time (2019) and “for” with a length of time (five years).','Tense markers'),
()=>mk('Find the error: “Each of the players have a locker.”','have',['Each','players','locker'],'“Each” is singular, so the verb should be “has”.','Subject–verb agreement'),
()=>mk('Which sentence is punctuated correctly?','It was late, so we left.',['It was late, we left.','It was late so, we left.','It was late; so, we left.'],'Two full sentences need more than a comma. A comma plus “so” joins them correctly.','Run-on sentences')
];

CM.TOPICS=[
 {id:'diff',name:'Differentials',blurb:'Derivatives, minus the lecture hall.',glyph:'ƒ′',color:'#ff927c',gens:DIFF,ghost:{name:'Varun’s ghost',rating:'1,248'}},
 {id:'crit',name:'Critical thinking',blurb:'Spot weak evidence and hidden assumptions.',glyph:'!?',color:'#a9d8ff',gens:CT,ghost:{name:'Nina’s ghost',rating:'1,232'}},
 {id:'logic',name:'Logical reasoning',blurb:'Deductions, codes and ordering puzzles.',glyph:'∴',color:'#baf3d5',gens:LOGIC,ghost:{name:'Kabir’s ghost',rating:'1,255'}},
 {id:'maths',name:'Everyday maths',blurb:'Discounts, speed, ratios and rates.',glyph:'%',color:'#ffdc72',gens:MATHS,ghost:{name:'Maya’s ghost',rating:'1,219'}},
 {id:'gram',name:'Grammar',blurb:'Small word choices that change meaning.',glyph:'Aa',color:'#d9d3ff',gens:GR,ghost:{name:'Riya’s ghost',rating:'1,241'}},
 {id:'pat',name:'Pattern puzzles',blurb:'Find the rule hiding in a sequence.',glyph:'▲●',color:'#ffc2d6',gens:PAT,ghost:{name:'Arjun’s ghost',rating:'1,251'}}
];

CM.TIPS={
'Power rule':'Say it aloud: “bring the power down, then take one off it”. Multiply the coefficient by the power first, then lower the power.',
'Evaluating a derivative':'Differentiate completely before substituting. Plugging the number into the original function is the common slip.',
'Standard derivatives':'Learn the five pairs as flashcards: sin→cos, cos→−sin, eˣ→eˣ, ln→1/x, tan→sec². The minus sign on cos is the one most often dropped.',
'Chain rule':'Write two steps: outside derivative, then × derivative of the inside. If your answer has no extra factor from the inside, a step is missing.',
'Product rule':'Write u, v, u′, v′ on paper, then use u′v + uv′. The two parts are added, never multiplied.',
'Percentages':'Find the percentage amount first (10% is one digit shift), then add or subtract it. Check that a discount makes the price smaller.',
'Speed, distance, time':'Use the triangle: distance = speed × time. Cover the one you want and read off the other two.',
'Unit rates':'Always reduce to “cost of one” first. Every other answer is one multiplication from there.',
'Ratios and scaling':'Find the amount per person before scaling. Adding the difference in people is the common trap.',
'Percentage change':'Divide the change by the original value, not the new one. Ask “percent of what?” before dividing.',
'Ordering and ranking':'Chain the statements into one line of names (A > B > C) on paper, then read the ends.',
'Letter codes':'Write the alphabet once and mark each shift. Check the direction (forward or back) before you start.',
'Deduction':'Draw circles for each group. “All X are Y” puts X inside Y. Only claim what the drawing forces.',
'Growing differences':'Write the gaps between terms. If the gaps themselves change, take the gaps of the gaps.',
'Arithmetic sequences':'Subtract neighbouring terms. If the gap is constant, add it again.',
'Geometric sequences':'Divide neighbouring terms. A constant ratio means multiply, not add.',
'Square patterns':'If the gaps grow by a steady amount (3, 5, 7…), look for squares plus or minus a constant.',
'Recurrence patterns':'If the gaps are not steady, test whether each term is the sum of the previous two.',
'Interleaved patterns':'Read every second term separately. Two simple sequences are often woven together.',
'Repeating cycles':'Find the length of the cycle, then divide the position by it. The remainder gives the place in the cycle.',
'Cause and effect':'Before accepting “A caused B”, name one other thing that could cause B, and one that could cause both.',
'Sample quality':'Ask who was counted, how they were picked and how many there were. A big biased sample is still biased.',
'Source reliability':'Ask who made the claim and what they gain. Then look for an independent source that agrees.',
'False dilemma':'When you see “either/or”, ask what third option has been left out.',
'Authority claims':'Check whether the person is an expert in this exact topic, and whether they show evidence.',
'Evidence strength':'Look for three things: enough people, a comparison group, and other causes ruled out.',
'Subject–verb agreement':'Find the real subject (ignore the words between), then match it. “Each” and “neither” are singular.',
'Conditionals':'Match the pairs: “Had I known… would have…” (past), “If I know… will…” (real future).',
'Homophones':'Expand the contraction: “they’re” becomes “they are”. If it doesn’t fit, use their or there.',
'Apostrophes':'Test with “it is”. If it fits, use “it’s”. Otherwise write “its”.',
'Countable nouns':'If you can count it, use “fewer”. If you can only measure it, use “less”.',
'Pronoun case':'Replace with “he/him”: if “him” fits, use “whom”.',
'Commonly confused words':'Make a note of your own pairs and write one example sentence for each.',
'Parallel structure':'Read the list items side by side. Each should start with the same word form.',
'Comparisons':'“Than” compares, “then” is about time. Say the sentence with “compared to” to check.',
'Tense markers':'“Since” + a point in time, “for” + a length of time.',
'Run-on sentences':'Two full sentences need a full stop, a semicolon, or a comma with a joining word.'
};

// next(topic, seenInThisSprint, recentlySeen) -> a question not yet seen this sprint (prefers ones not seen recently), or null
CM.next=(t,seen,recent)=>{
  for(let i=0;i<300;i++){const q=pick(t.gens)();if(!seen.has(q.p)&&!recent.has(q.p))return q}
  for(let i=0;i<300;i++){const q=pick(t.gens)();if(!seen.has(q.p))return q}
  return null;
};
export default CM;
