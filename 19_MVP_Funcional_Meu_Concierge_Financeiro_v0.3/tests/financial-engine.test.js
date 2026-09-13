import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateDiagnosis, hourlyCost, recommendedPrice, targetRevenue} from '../js/financial-engine.js';

test('caso-base do protótipo', () => {
 const r=calculateDiagnosis({grossRevenue:40000,transactions:100,variableExpenses:[{amount:12000},{amount:1200},{amount:800},{amount:2400},{amount:600}],fixedExpenses:[{amount:12000}],currentOwnerCompensation:5000});
 assert.equal(r.ticketAverage,400);
 assert.equal(r.variableCosts,17000);
 assert.equal(r.contribution,23000);
 assert.ok(Math.abs(r.contributionPct-.575)<1e-12);
 assert.ok(Math.abs(r.breakEven-29565.217391304348)<1e-8);
 assert.equal(r.managerialResult,6000);
});

test('meta e custo-hora',()=>{
 assert.equal(targetRevenue({fixedExpenses:12000,desiredOwnerCompensation:5000,desiredProfit:6000,contributionPct:.575}),40000);
 assert.ok(Math.abs(hourlyCost({fixedExpenses:12000,ownerCompensation:5000,provisions:1000,billableHours:110})-163.63636363636)<1e-8);
});

test('precificação bloqueia divisor inválido',()=>{
 assert.equal(recommendedPrice({directCost:100,salesRates:.6,targetContributionMargin:.4}),null);
 assert.equal(recommendedPrice({directCost:100,salesRates:.1,targetContributionMargin:.4}),200);
});
