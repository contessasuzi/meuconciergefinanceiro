const assert=require('assert');
const {analyzePricing}=require('../lib/finance/pricing');

function close(a,b,tol=1e-9){assert.ok(Math.abs(a-b)<=tol,`esperado ${b}, obtido ${a}`)}

let r=analyzePricing({
  itemName:'Brigadeiro',
  price:1.90,
  directCost:0.70,
  companyDefaults:{taxPct:4,feePct:3.2,commissionPct:20.5},
  companyContext:{fixedExpenses:1016,contributionMarginPct:6.7}
});
assert.ok(r.ok);
assert.strictEqual(r.sources.taxPct,'COMPANY');
assert.strictEqual(r.sources.feePct,'COMPANY');
assert.strictEqual(r.sources.commissionPct,'COMPANY');
close(r.item.totalVariablePct,27.7);
close(r.item.variableValue,1.90*0.277);
close(r.item.contribution,1.90-0.70-(1.90*0.277));
assert.strictEqual(r.interpretation.comparison,'ABOVE_BUSINESS_AVERAGE');

r=analyzePricing({
  itemName:'Produto sem comissão',
  price:30,
  directCost:12,
  taxPct:4,
  feePct:3.2,
  commissionPct:0,
  companyDefaults:{commissionPct:20.5}
});
assert.ok(r.ok);
assert.strictEqual(r.item.commissionPct,0);
assert.strictEqual(r.sources.commissionPct,'ITEM');

r=analyzePricing({
  itemName:'Produto',
  price:30,
  directCost:12,
  taxPct:101,
  feePct:3.2,
  commissionPct:0
});
assert.strictEqual(r.ok,false);
assert.strictEqual(r.field,'taxPct');
assert.strictEqual(r.error,'OUT_OF_RANGE');

r=analyzePricing({
  itemName:'Produto',
  price:30,
  directCost:12,
  taxPct:40,
  feePct:30,
  commissionPct:40
});
assert.strictEqual(r.ok,false);
assert.strictEqual(r.field,'variablePercentages');
assert.strictEqual(r.error,'SUM_OVER_100');

console.log('pricing-context.test.js: OK');
