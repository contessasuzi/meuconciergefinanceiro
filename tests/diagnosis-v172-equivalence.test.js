const assert=require('assert');
const {calculateDiagnosis}=require('../lib/finance/diagnosis');

function close(a,b,tol=1e-9){assert.ok(Math.abs(a-b)<=tol,`esperado ${b}, obtido ${a}`)}

const full=calculateDiagnosis({
  grossRevenue:{amount:5000,quality:'confirmed'},
  transactions:{amount:200,quality:'confirmed'},
  variableExpenses:[{amount:2500,quality:'confirmed'}],
  fixedExpenses:[{amount:240,quality:'confirmed'}],
  currentOwnerCompensation:{amount:0,quality:'confirmed'}
});
close(full.ticketAverage,25);
close(full.variableCosts,2500);
close(full.contribution,2500);
close(full.contributionPct,.5);
close(full.breakEven,480);
close(full.managerialResult,2260);
close(full.resultMargin,.452);
close(full.safetyMargin,4520);
close(full.safetyMarginPct,.904);
assert.strictEqual(full.confidence,'confirmed');

const partial=calculateDiagnosis({
  grossRevenue:{amount:5000,quality:'confirmed'},
  transactions:{amount:200,quality:'confirmed'},
  variableExpenses:[{amount:1000,quality:'confirmed'},{amount:null,quality:'unknown'}],
  fixedExpenses:[{amount:240,quality:'confirmed'}],
  currentOwnerCompensation:{amount:0,quality:'confirmed'}
});
assert.strictEqual(partial.variableCosts,null);
assert.strictEqual(partial.contribution,null);
assert.strictEqual(partial.managerialResult,null);
assert.strictEqual(partial.partial.hasUnknown,true);
close(partial.partial.knownVariableCosts,1000);
close(partial.partial.partialContribution,4000);

console.log('diagnosis-v172-equivalence.test.js: OK');
