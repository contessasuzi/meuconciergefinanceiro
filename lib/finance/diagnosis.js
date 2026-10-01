function value(x){
  if(x && typeof x==='object'){
    if(x.quality==='unknown') return null;
    x=x.amount;
  }
  return x===null||x===undefined||x===''||!Number.isFinite(Number(x))||Number(x)<0?null:Number(x);
}

function quality(x){ return value(x)===null?'unknown':x?.quality==='estimated'?'estimated':'confirmed'; }
function aggregateQuality(xs){ return xs.some(x=>quality(x)==='unknown')?'unknown':xs.some(x=>quality(x)==='estimated')?'estimated':'confirmed'; }
function sum(xs){ return !Array.isArray(xs)||xs.some(x=>value(x)===null)?null:xs.reduce((s,x)=>s+value(x),0); }
function knownSum(xs){ return (xs||[]).reduce((s,x)=>s+(value(x)??0),0); }

function calculateDiagnosis(i){
  const r=value(i.grossRevenue), t=value(i.transactions), vars=i.variableExpenses||[], fixed=i.fixedExpenses||[], v=sum(vars), f=sum(fixed), o=value(i.currentOwnerCompensation);
  const knownV=knownSum(vars),knownF=knownSum(fixed),knownOwner=o??0,knownStructure=knownF+knownOwner,knownRemainder=r!==null?r-knownV-knownStructure:null;
  const variableMissing=vars.filter(x=>value(x)===null).length,fixedMissing=fixed.filter(x=>value(x)===null).length,ownerMissing=o===null;
  const c=r!==null&&v!==null?r-v:null, cp=r>0&&c!==null?c/r:null,s=f!==null&&o!==null?f+o:null;
  const be=cp>0&&s!==null?s/cp:null, result=c!==null&&s!==null?c-s:null,safety=be!==null&&r!==null?r-be:null;
  const partialContribution=r!==null?r-knownV:null,partialContributionPct=r>0&&partialContribution!==null?partialContribution/r:null;
  const partialBreakEven=partialContributionPct>0?knownStructure/partialContributionPct:null,partialResult=knownRemainder,partialResultMargin=r>0&&partialResult!==null?partialResult/r:null;
  const partialSafety=partialBreakEven!==null&&r!==null?r-partialBreakEven:null,partialSafetyPct=r>0&&partialSafety!==null?partialSafety/r:null;
  const base=[i.grossRevenue,...vars,...fixed,i.currentOwnerCompensation];
  const cq=aggregateQuality([i.grossRevenue,...vars]),sq=aggregateQuality([...fixed,i.currentOwnerCompensation]);
  const combine=(...q)=>q.includes('unknown')?'unknown':q.includes('estimated')?'estimated':'confirmed';
  return {ticketAverage:r!==null&&t>0?r/t:null,variableCosts:v,fixedExpenses:f,contribution:c,contributionPct:cp,structure:s,breakEven:be,managerialResult:result,resultMargin:r>0&&result!==null?result/r:null,safetyMargin:safety,safetyMarginPct:r>0&&safety!==null?safety/r:null,confidence:aggregateQuality(base),qualities:{ticketAverage:aggregateQuality([i.grossRevenue,i.transactions]),variableCosts:aggregateQuality(vars),contribution:cq,contributionPct:cq,structure:sq,breakEven:combine(cq,sq),managerialResult:combine(cq,sq),resultMargin:combine(cq,sq),safetyMargin:combine(cq,sq),safetyMarginPct:combine(cq,sq)},partial:{knownVariableCosts:knownV,knownFixedExpenses:knownF,knownOwnerCompensation:knownOwner,knownStructure,knownRemainder,variableMissing,fixedMissing,ownerMissing,hasUnknown:variableMissing>0||fixedMissing>0||ownerMissing,knownVariablePct:r>0?knownV/r:null,knownStructurePct:r>0?knownStructure/r:null,knownRemainderPct:r>0&&knownRemainder!==null?knownRemainder/r:null,partialContribution,partialContributionPct,partialBreakEven,partialResult,partialResultMargin,partialSafety,partialSafetyPct}};
}

module.exports={value,quality,aggregateQuality,sum,knownSum,calculateDiagnosis};
