export function calculateDiagnosis(input) {
  const n = (v) => Number(v || 0);
  const revenue = n(input.grossRevenue);
  const transactions = n(input.transactions);
  const variableCosts = (input.variableExpenses || []).reduce((s, x) => s + n(x.amount), 0);
  const fixedExpenses = (input.fixedExpenses || []).reduce((s, x) => s + n(x.amount), 0);
  const ownerComp = n(input.currentOwnerCompensation);
  const contribution = revenue - variableCosts;
  const contributionPct = revenue > 0 ? contribution / revenue : null;
  const structure = fixedExpenses + ownerComp;
  const breakEven = contributionPct > 0 ? structure / contributionPct : null;
  const result = contribution - structure;
  const safety = breakEven !== null ? revenue - breakEven : null;
  return {
    ticketAverage: transactions > 0 ? revenue / transactions : null,
    variableCosts, contribution, contributionPct, structure,
    breakEven, managerialResult: result,
    resultMargin: revenue > 0 ? result / revenue : null,
    safetyMargin: safety,
    safetyMarginPct: revenue > 0 && safety !== null ? safety / revenue : null
  };
}

export function targetRevenue({fixedExpenses=0, desiredOwnerCompensation=0, desiredProfit=0, desiredReserve=0, contributionPct}) {
  if (!(contributionPct > 0)) return null;
  return (Number(fixedExpenses)+Number(desiredOwnerCompensation)+Number(desiredProfit)+Number(desiredReserve))/Number(contributionPct);
}

export function hourlyCost({fixedExpenses=0, ownerCompensation=0, provisions=0, billableHours=0}) {
  if (!(Number(billableHours) > 0)) return null;
  return (Number(fixedExpenses)+Number(ownerCompensation)+Number(provisions))/Number(billableHours);
}

export function recommendedPrice({directCost=0, salesRates=0, targetContributionMargin=0}) {
  const divisor = 1 - Number(salesRates) - Number(targetContributionMargin);
  if (!(divisor > 0)) return null;
  return Number(directCost) / divisor;
}
