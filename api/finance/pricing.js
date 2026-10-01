const { jsonBody, method, noStore } = require('../../lib/http');
const { requireSession } = require('../../lib/auth');
const { canAccessPhase } = require('../../lib/access');
const { analyzePricing } = require('../../lib/finance/pricing');

module.exports = async function handler(req,res){
  noStore(res);
  if(!method(req,res,['POST'])) return;
  const session=await requireSession(req,res);
  if(!session) return;

  try{
    if(!(await canAccessPhase(session,2))) {
      return res.status(403).json({error:'PHASE_NOT_ALLOWED'});
    }
    const body=jsonBody(req);
    if(!body || typeof body!=='object') {
      return res.status(400).json({error:'INVALID_INPUT'});
    }
    const result=analyzePricing(body);
    if(!result.ok) return res.status(422).json(result);
    return res.status(200).json({result});
  }catch(err){
    console.error(err);
    return res.status(500).json({error:'PRICING_ANALYSIS_FAILED'});
  }
};
