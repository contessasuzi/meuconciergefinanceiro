const { db } = require('../../lib/db');
const { jsonBody, method, noStore } = require('../../lib/http');
const { requireSession } = require('../../lib/auth');
const { primaryCompanyForUser } = require('../../lib/company');

const VERSION='v1.72';

module.exports = async function handler(req,res){
  noStore(res);
  if(!method(req,res,['GET','PUT'])) return;
  const session=await requireSession(req,res);
  if(!session) return;

  try{
    const sql=db();
    const company=await primaryCompanyForUser(session.id);

    if(req.method==='GET'){
      const rows=await sql`
        SELECT state,revision,updated_at
        FROM concierge_state
        WHERE user_id=${session.id} AND version=${VERSION}
        LIMIT 1
      `;
      if(!rows.length) return res.status(200).json({version:VERSION,state:null,revision:0});
      return res.status(200).json({version:VERSION,state:rows[0].state,revision:Number(rows[0].revision),updated_at:rows[0].updated_at});
    }

    const body=jsonBody(req);
    const nextState=body && body.state;
    const expectedRevision=Number(body && body.expectedRevision || 0);
    if(!nextState || typeof nextState!=='object' || Array.isArray(nextState)){
      return res.status(400).json({error:'INVALID_STATE'});
    }

    const existing=await sql`
      SELECT revision FROM concierge_state
      WHERE user_id=${session.id} AND version=${VERSION}
      LIMIT 1
    `;

    if(existing.length && expectedRevision && Number(existing[0].revision)!==expectedRevision){
      return res.status(409).json({error:'STATE_CONFLICT',revision:Number(existing[0].revision)});
    }

    const rows=await sql`
      INSERT INTO concierge_state(user_id,company_id,version,state,revision)
      VALUES(${session.id},${company ? company.id : null},${VERSION},${JSON.stringify(nextState)}::jsonb,1)
      ON CONFLICT (user_id,version)
      DO UPDATE SET
        company_id=COALESCE(EXCLUDED.company_id,concierge_state.company_id),
        state=EXCLUDED.state,
        revision=concierge_state.revision+1,
        updated_at=now()
      RETURNING revision,updated_at
    `;

    await sql`
      INSERT INTO audit_log(user_id,action,metadata)
      VALUES(${session.id},'CONCIERGE_STATE_SAVED',${JSON.stringify({version:VERSION,revision:Number(rows[0].revision)})}::jsonb)
    `;

    return res.status(200).json({ok:true,version:VERSION,revision:Number(rows[0].revision),updated_at:rows[0].updated_at});
  }catch(err){
    console.error(err);
    return res.status(500).json({error:'STATE_FAILED'});
  }
};
