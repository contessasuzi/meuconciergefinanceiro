/*
 * Testes das funções de cálculo do Concierge de Preço.
 * Executar com:  node tests/concierge-de-preco-calc.test.js
 * Não depende de nenhuma biblioteca.
 */
var assert = require('assert');
var C = require('../js/concierge-de-preco-calc.js');

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failed++; console.log('  ✗ ' + name + '\n      ' + e.message); }
}
function close(a, b, tol) { assert.ok(Math.abs(a - b) <= (tol || 1e-9), 'esperado ' + b + ', obtido ' + a); }

console.log('\nMarkup e preço de venda');
test('Custo 60, GF 25%, GV 6%, Lucro 30,6% → markup ≈ 2,604166…', function () {
  var m = C.calculateMarkup(25, 6, 30.6);
  assert.ok(m.ok);
  close(m.sum, 61.6);
  close(m.remainder, 38.4);
  close(m.markup, 100 / 38.4);
  close(m.markup, 2.604166666, 1e-6);
});
test('Preço com precisão integral ≈ R$ 156,25 (não R$ 156,00)', function () {
  var m = C.calculateMarkup(25, 6, 30.6);
  var p = C.calculateSalePrice(60, m.markup);
  assert.ok(p.ok);
  close(p.price, 156.25, 1e-9);
  assert.notStrictEqual(Math.round(p.price * 100) / 100, 156.00);
});
test('GF + GV + L = 100% → não calcula', function () {
  var m = C.calculateMarkup(50, 30, 20);
  assert.strictEqual(m.ok, false);
  assert.strictEqual(m.error, C.MSG.markupSum);
});
test('GF + GV + L > 100% → não calcula', function () {
  assert.strictEqual(C.calculateMarkup(60, 30, 20).ok, false);
});
test('Percentual negativo → erro', function () {
  assert.strictEqual(C.calculateMarkup(-5, 10, 10).ok, false);
});
test('Custo zero → erro', function () {
  assert.strictEqual(C.calculateSalePrice(0, 2).ok, false);
});
test('Entrada inválida (NaN / string) → erro', function () {
  assert.strictEqual(C.calculateMarkup(NaN, 1, 1).ok, false);
  assert.strictEqual(C.calculateMarkup('25', 6, 30.6).ok, false);
});

console.log('\nAuxílio para percentuais');
test('GF% = 6.000 / 24.000 × 100 = 25%', function () {
  var r = C.calculateExpensePercent(6000, 24000);
  assert.ok(r.ok); close(r.percent, 25);
});
test('Faturamento zero → erro', function () {
  assert.strictEqual(C.calculateExpensePercent(100, 0).ok, false);
});

console.log('\nCusto da hora');
test('(8.000 + 2.000) / 160 h = R$ 62,50', function () {
  var r = C.calculateLaborHourCost(8000, 2000, 160);
  assert.ok(r.ok); close(r.hourCost, 62.5);
});
test('Horas zero → erro', function () {
  assert.strictEqual(C.calculateLaborHourCost(8000, 2000, 0).ok, false);
});

console.log('\nMargem de lucro');
test('Receita 10.000, gastos 6.000 → lucro R$ 4.000, margem 40%', function () {
  var r = C.calculateProfitMargin(10000, 6000);
  assert.ok(r.ok); close(r.profit, 4000); close(r.margin, 40); assert.strictEqual(r.isLoss, false);
});
test('Prejuízo tratado corretamente (receita 8.000, gastos 10.000)', function () {
  var r = C.calculateProfitMargin(8000, 10000);
  assert.ok(r.ok); close(r.profit, -2000); close(r.margin, -25); assert.strictEqual(r.isLoss, true);
});
test('Receita zero → erro', function () {
  assert.strictEqual(C.calculateProfitMargin(0, 100).ok, false);
});
test('calculateProfit isolado', function () {
  close(C.calculateProfit(10000, 6000).profit, 4000);
});

console.log('\nMargem de contribuição');
test('Receita 30.000, GV 12.000 → MC R$ 18.000, MC% 60%', function () {
  var r = C.calculateContributionMarginRate(30000, 12000);
  assert.ok(r.ok); close(r.contributionMargin, 18000); close(r.rate, 60);
  close(C.calculateContributionMargin(30000, 12000).contributionMargin, 18000);
});

console.log('\nPonto de equilíbrio');
test('Gastos fixos 6.000, MC 60% → R$ 10.000', function () {
  var r = C.calculateBreakEven(6000, 60);
  assert.ok(r.ok); close(r.index, 0.6); close(r.breakEven, 10000);
});
test('MC% igual ou inferior a zero → erro', function () {
  assert.strictEqual(C.calculateBreakEven(6000, 0).ok, false);
  assert.strictEqual(C.calculateBreakEven(6000, -10).ok, false);
});

console.log('\nTicket médio');
test('Faturamento 150.000, 600 clientes → R$ 250', function () {
  var r = C.calculateAverageTicket(150000, 600);
  assert.ok(r.ok); close(r.ticket, 250);
});
test('Zero clientes → erro (sem divisão por zero)', function () {
  assert.strictEqual(C.calculateAverageTicket(150000, 0).ok, false);
});

console.log('\nDiagnóstico completo');
test('Cenário saudável', function () {
  var r = C.calculateDiagnosis({ revenue: 30000, customers: 120, fixedExpenses: 6000, variableExpenses: 12000, totalExpenses: 18000 });
  assert.ok(r.ok);
  close(r.ticket, 250); close(r.contributionMargin, 18000); close(r.contributionMarginRate, 60);
  close(r.profit, 12000); close(r.profitMargin, 40); close(r.breakEven, 10000);
  assert.strictEqual(r.isLoss, false);
  assert.strictEqual(r.warnings.length, 0);
});
test('Aponta inconsistência: gastos totais < fixos + variáveis', function () {
  var r = C.calculateDiagnosis({ revenue: 30000, customers: 120, fixedExpenses: 6000, variableExpenses: 12000, totalExpenses: 15000 });
  assert.ok(r.warnings.some(function (w) { return /menores que a soma/.test(w); }));
});
test('Aponta prejuízo e faturamento abaixo do ponto de equilíbrio', function () {
  var r = C.calculateDiagnosis({ revenue: 10000, customers: 40, fixedExpenses: 8000, variableExpenses: 4000, totalExpenses: 12000 });
  assert.strictEqual(r.isLoss, true);
  close(r.breakEven, 8000 / 0.6);
  assert.ok(r.warnings.some(function (w) { return /prejuízo/.test(w); }));
  assert.ok(r.warnings.some(function (w) { return /abaixo do ponto de equilíbrio/.test(w); }));
});
test('MC ≤ 0: ponto de equilíbrio nulo, sem quebrar', function () {
  var r = C.calculateDiagnosis({ revenue: 10000, customers: 10, fixedExpenses: 2000, variableExpenses: 11000, totalExpenses: 13000 });
  assert.ok(r.ok);
  assert.strictEqual(r.breakEven, null);
  assert.ok(r.breakEvenError);
});
test('Zero clientes → erro', function () {
  assert.strictEqual(C.calculateDiagnosis({ revenue: 10000, customers: 0, fixedExpenses: 1, variableExpenses: 1, totalExpenses: 2 }).ok, false);
});

console.log('\n' + passed + ' testes passaram, ' + failed + ' falharam.\n');
process.exit(failed ? 1 : 0);
