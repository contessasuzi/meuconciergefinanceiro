const { jsonBody, method, noStore } = require('../../lib/http');
const { requireSession } = require('../../lib/auth');
const { canAccessPhase } = require('../../lib/access');
const { calculateDiagnosis } = require('../../lib/finance/diagnosis');

module.exports = async function handler(req,res){
  noStore(res);
  if(!method(req,res,['POST'])) return;
  const session=await requireSession(req,res);
  if(!session) return;
  try{
    if(!(await canAccessPhase(session,1))) return res.status(403).json({error:'PHASE_NOT_ALLOWED'});
    const body=jsonBody(req);
    if(!body || !body.input || typeof body.input!=='object') return res.status(400).json({error:'INVALID_INPUT'});
    return res.status(200).json({result:calculateDiagnosis(body.input)});
  }catch(err){
    console.error(err);
    return res.status(500).json({error:'DIAGNOSIS_CALCULATION_FAILED'});
  }
};
