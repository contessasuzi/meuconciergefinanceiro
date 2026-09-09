/*
 * Concierge de Preço — funções de cálculo
 * FFP GFX · Inteligência Financeira
 *
 * Fórmulas determinísticas, separadas da interface.
 * Cada função recebe números (nunca strings formatadas) e devolve
 * um objeto { ok: true, ... } ou { ok: false, error: 'mensagem' }.
 * Nenhum arredondamento é feito aqui: a precisão integral é preservada
 * e o arredondamento acontece apenas na apresentação.
 *
 * Este arquivo funciona no navegador (window.CDPCalc) e no Node (module.exports),
 * o que permite os testes automatizados em tests/concierge-de-preco-calc.test.js.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.CDPCalc = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MSG = {
    invalid: 'Informe um número válido.',
    negative: 'Este valor não pode ser negativo.',
    zeroRevenue: 'O faturamento precisa ser maior que zero.',
    zeroCustomers: 'O número de clientes precisa ser maior que zero.',
    zeroHours: 'O total de horas precisa ser maior que zero.',
    zeroCost: 'O custo unitário precisa ser maior que zero.',
    markupSum: 'Com os percentuais informados, não é possível calcular um markup válido por esta metodologia. Revise os percentuais antes de continuar.',
    cmNonPositive: 'A margem de contribuição precisa ser maior que zero para calcular o ponto de equilíbrio.'
  };

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function fail(msg) { return { ok: false, error: msg }; }

  /* 1 — Markup: 100 / [100 - (GF + GV + L)] */
  function calculateMarkup(fixedPct, variablePct, profitPct) {
    if (!isNum(fixedPct) || !isNum(variablePct) || !isNum(profitPct)) return fail(MSG.invalid);
    if (fixedPct < 0 || variablePct < 0 || profitPct < 0) return fail(MSG.negative);
    var sum = fixedPct + variablePct + profitPct;
    if (sum >= 100) return fail(MSG.markupSum);
    var remainder = 100 - sum;
    return { ok: true, sum: sum, remainder: remainder, markup: 100 / remainder };
  }

  /* Preço de venda = custo unitário × markup */
  function calculateSalePrice(unitCost, markup) {
    if (!isNum(unitCost) || !isNum(markup)) return fail(MSG.invalid);
    if (unitCost < 0) return fail(MSG.negative);
    if (unitCost === 0) return fail(MSG.zeroCost);
    return { ok: true, price: unitCost * markup };
  }

  /* Percentual a partir de valores monetários: valor / faturamento × 100 */
  function calculateExpensePercent(amount, revenue) {
    if (!isNum(amount) || !isNum(revenue)) return fail(MSG.invalid);
    if (amount < 0 || revenue < 0) return fail(MSG.negative);
    if (revenue === 0) return fail(MSG.zeroRevenue);
    return { ok: true, percent: amount / revenue * 100 };
  }

  /* Custo da hora = (folha + encargos) / total de horas */
  function calculateLaborHourCost(payroll, charges, totalHours) {
    if (!isNum(payroll) || !isNum(charges) || !isNum(totalHours)) return fail(MSG.invalid);
    if (payroll < 0 || charges < 0 || totalHours < 0) return fail(MSG.negative);
    if (totalHours === 0) return fail(MSG.zeroHours);
    return { ok: true, total: payroll + charges, hourCost: (payroll + charges) / totalHours };
  }

  /* 2 — Lucro = receita - gastos totais */
  function calculateProfit(revenue, totalExpenses) {
    if (!isNum(revenue) || !isNum(totalExpenses)) return fail(MSG.invalid);
    if (revenue < 0 || totalExpenses < 0) return fail(MSG.negative);
    return { ok: true, profit: revenue - totalExpenses };
  }

  /* Margem de lucro = lucro / receita × 100 (pode ser negativa) */
  function calculateProfitMargin(revenue, totalExpenses) {
    if (!isNum(revenue) || !isNum(totalExpenses)) return fail(MSG.invalid);
    if (revenue < 0 || totalExpenses < 0) return fail(MSG.negative);
    if (revenue === 0) return fail(MSG.zeroRevenue);
    var profit = revenue - totalExpenses;
    return { ok: true, profit: profit, margin: profit / revenue * 100, isLoss: profit < 0 };
  }

  /* 3 — Margem de contribuição = receita - gastos variáveis */
  function calculateContributionMargin(revenue, variableExpenses) {
    if (!isNum(revenue) || !isNum(variableExpenses)) return fail(MSG.invalid);
    if (revenue < 0 || variableExpenses < 0) return fail(MSG.negative);
    return { ok: true, contributionMargin: revenue - variableExpenses };
  }

  /* MC% = margem de contribuição / receita × 100 */
  function calculateContributionMarginRate(revenue, variableExpenses) {
    if (!isNum(revenue) || !isNum(variableExpenses)) return fail(MSG.invalid);
    if (revenue < 0 || variableExpenses < 0) return fail(MSG.negative);
    if (revenue === 0) return fail(MSG.zeroRevenue);
    var cm = revenue - variableExpenses;
    return { ok: true, contributionMargin: cm, rate: cm / revenue * 100 };
  }

  /* 4 — Ponto de equilíbrio = gastos fixos / (MC% / 100) */
  function calculateBreakEven(fixedExpenses, contributionMarginRate) {
    if (!isNum(fixedExpenses) || !isNum(contributionMarginRate)) return fail(MSG.invalid);
    if (fixedExpenses < 0) return fail(MSG.negative);
    if (contributionMarginRate <= 0) return fail(MSG.cmNonPositive);
    var index = contributionMarginRate / 100;
    return { ok: true, index: index, breakEven: fixedExpenses / index };
  }

  /* 5 — Ticket médio = faturamento / número de clientes */
  function calculateAverageTicket(revenue, customers) {
    if (!isNum(revenue) || !isNum(customers)) return fail(MSG.invalid);
    if (revenue < 0 || customers < 0) return fail(MSG.negative);
    if (customers === 0) return fail(MSG.zeroCustomers);
    return { ok: true, ticket: revenue / customers };
  }

  /* 6 — Diagnóstico completo: combina os indicadores acima */
  function calculateDiagnosis(d) {
    if (!d || !isNum(d.revenue) || !isNum(d.customers) || !isNum(d.fixedExpenses) || !isNum(d.variableExpenses) || !isNum(d.totalExpenses)) return fail(MSG.invalid);
    if (d.revenue < 0 || d.customers < 0 || d.fixedExpenses < 0 || d.variableExpenses < 0 || d.totalExpenses < 0) return fail(MSG.negative);
    if (d.revenue === 0) return fail(MSG.zeroRevenue);
    if (d.customers === 0) return fail(MSG.zeroCustomers);

    var ticket = calculateAverageTicket(d.revenue, d.customers);
    var cm = calculateContributionMarginRate(d.revenue, d.variableExpenses);
    var pm = calculateProfitMargin(d.revenue, d.totalExpenses);
    var be = calculateBreakEven(d.fixedExpenses, cm.rate);

    var warnings = [];
    if (d.totalExpenses < d.fixedExpenses + d.variableExpenses) {
      warnings.push('Os gastos totais informados são menores que a soma de gastos fixos e variáveis. Confira se algum valor ficou de fora ou foi contado duas vezes.');
    }
    if (cm.rate <= 0) {
      warnings.push('Os gastos variáveis consomem todo o faturamento. Nessa condição não há margem para cobrir gastos fixos, e o ponto de equilíbrio não pode ser calculado.');
    }
    if (pm.isLoss) {
      warnings.push('O período fechou com prejuízo: os gastos totais superaram o faturamento.');
    }
    if (be.ok && d.revenue < be.breakEven) {
      warnings.push('O faturamento ficou abaixo do ponto de equilíbrio. A operação não cobriu os gastos considerados no cálculo.');
    }
    if (d.variableExpenses > d.revenue * 0.7) {
      warnings.push('Os gastos variáveis representam mais de 70% do faturamento — um percentual elevado que merece revisão.');
    }

    return {
      ok: true,
      ticket: ticket.ticket,
      contributionMargin: cm.contributionMargin,
      contributionMarginRate: cm.rate,
      profit: pm.profit,
      profitMargin: pm.margin,
      isLoss: pm.isLoss,
      breakEven: be.ok ? be.breakEven : null,
      breakEvenError: be.ok ? null : be.error,
      revenueVsBreakEven: be.ok ? d.revenue - be.breakEven : null,
      warnings: warnings
    };
  }

  return {
    MSG: MSG,
    calculateMarkup: calculateMarkup,
    calculateSalePrice: calculateSalePrice,
    calculateExpensePercent: calculateExpensePercent,
    calculateLaborHourCost: calculateLaborHourCost,
    calculateProfit: calculateProfit,
    calculateProfitMargin: calculateProfitMargin,
    calculateContributionMargin: calculateContributionMargin,
    calculateContributionMarginRate: calculateContributionMarginRate,
    calculateBreakEven: calculateBreakEven,
    calculateAverageTicket: calculateAverageTicket,
    calculateDiagnosis: calculateDiagnosis
  };
}));
