import CM from './questions.js';
/* Turns a finished sprint's answer log into a specific review. */
const review=({log,score,ghost})=>{
  const n=log.length,ok=log.filter(x=>x.ok).length,acc=n?Math.round(100*ok/n):0,avg=n?log.reduce((a,x)=>a+x.t,0)/n:0,sec=avg.toFixed(1);
  const by={};
  log.forEach(x=>{const o=by[x.q.tag]=by[x.q.tag]||{n:0,m:0};o.n++;if(!x.ok)o.m++});
  const focus=Object.entries(by).filter(([,o])=>o.m)
    .sort((a,b)=>b[1].m-a[1].m||b[1].m/b[1].n-a[1].m/a[1].n).slice(0,3)
    .map(([tag,o])=>({tag,count:`${o.m} of ${o.n} wrong`,tip:CM.TIPS[tag]||'Slow down on this type and write out one step before choosing.'}));
  const solid=Object.entries(by).filter(([,o])=>!o.m).map(e=>e[0]);
  const headline=!n?'Time ran out before you answered':score>ghost?'You beat the ghost':score===ghost?'A dead heat with the ghost':'The ghost took this one';
  let pace;
  if(!n)pace='Take a quick first guess next time. Every answer, right or wrong, gives you an explanation to learn from.';
  else if(acc>=85&&avg>6)pace=`Accurate (${acc}%), but you averaged ${sec}s per question. Aim for under 6s: trust answers you already know instead of re-checking them.`;
  else if(acc>=85)pace=`Sharp and quick: ${acc}% correct at ${sec}s per question. Try Quickdraw or a different topic to stretch yourself.`;
  else if(avg<4&&acc<70)pace=`You averaged ${sec}s but got ${acc}% right, so you are answering faster than you are checking. Spend two extra seconds reading each question.`;
  else if(acc<70)pace=`${acc}% correct. Accuracy matters more than speed right now: work through the tips below before trying to go faster.`;
  else pace=`${acc}% correct at ${sec}s per question. You are close: fixing the areas below is the quickest way to a higher score.`;
  return {by,headline,n,ok,acc,sec,focus,solid,pace,misses:log.filter(x=>!x.ok)};
};
export default review;
