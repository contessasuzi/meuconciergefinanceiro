function num(v){
  if(v===null||v===undefined||v==='') return null;
  const n=Number(v);
  return Number.isFinite(n)?n:null;
}

function validatePercent(name,v,{required=false}={}){
  if(v===null||v===undefined||v===''){
    if(required) return {ok:false,field:name,error:'NOT_INFORMED'};
    return {ok:true,value:null};
  }
  const n=Number(v);
  if(!Number.isFinite(n)) return {ok:false,field:name,error:'INVALID_NUMBER'};
  if(n<0||n>100) return {ok:false,field:name,error:'OUT_OF_RANGE'};
  return {ok:true,value:n};
}

function resolvePercent(itemValue, companyValue){
  const item=num(itemValue);
  if(item!==null) return {value:item,source:'ITEM'};
  const company=num(companyValue);
  if(company!==null) return {value:company,source:'COMPANY'};
  return {value:null,source:'NOT_INFORMED'};
}

function analyzePricing(input){
  const price=num(input.price);
  const directCost=num(input.directCost);
  if(price===null||price<0) return {ok:false,field:'price',error:'INVALID_PRICE'};
  if(directCost===null||directCost<0) return {ok:false,field:'directCost',error:'INVALID_DIRECT_COST'};

  const tax=resolvePercent(input.taxPct,input.companyDefaults&&input.companyDefaults.taxPct);
  const fee=resolvePercent(input.feePct,input.companyDefaults&&input.companyDefaults.feePct);
  const commission=resolvePercent(input.commissionPct,input.companyDefaults&&input.companyDefaults.commissionPct);

  const checks=[
    ['taxPct',tax.value],
    ['feePct',fee.value],
    ['commissionPct',commission.value]
  ].map(([name,value])=>validatePercent(name,value));

  const bad=checks.find(x=>!x.ok);
  if(bad) return bad;

  const taxPct=tax.value??0;
  const feePct=fee.value??0;
  const commissionPct=commission.value??0;
  const totalVariablePct=taxPct+feePct+commissionPct;
  if(totalVariablePct>100){
    return {ok:false,field:'variablePercentages',error:'SUM_OVER_100'};
  }

  const variableValue=price*(totalVariablePct/100);
  const contribution=price-directCost-variableValue;
  const contributionPct=price>0?(contribution/price)*100:null;

  const fixedExpenses=num(input.companyContext&&input.companyContext.fixedExpenses);
  const businessContributionPct=num(input.companyContext&&input.companyContext.contributionMarginPct);

  return {
    ok:true,
    item:{
      name:String(input.itemName||'').trim()||null,
      price,
      directCost,
      taxPct,
      feePct,
      commissionPct,
      totalVariablePct,
      variableValue,
      contribution,
      contributionPct
    },
    sources:{
      taxPct:tax.source,
      feePct:fee.source,
      commissionPct:commission.source,
      directCost:'ITEM'
    },
    companyReference:{
      fixedExpenses,
      businessContributionPct
    },
    interpretation:{
      comparison:
        businessContributionPct===null||contributionPct===null
          ? null
          : contributionPct>businessContributionPct
            ? 'ABOVE_BUSINESS_AVERAGE'
            : contributionPct<businessContributionPct
              ? 'BELOW_BUSINESS_AVERAGE'
              : 'IN_LINE_WITH_BUSINESS_AVERAGE'
    }
  };
}

module.exports={validatePercent,resolvePercent,analyzePricing};
