CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'CLIENTE' CHECK (role IN ('CLIENTE','GESTAO')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','BLOCKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  legal_name TEXT,
  trade_name TEXT,
  cnpj TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_companies (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'OWNER' CHECK (relationship IN ('OWNER','MEMBER','GESTAO')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, company_id)
);

CREATE TABLE IF NOT EXISTS bonus_codes (
  id BIGSERIAL PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  code_prefix TEXT,
  label TEXT,
  campaign TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REDEEMED','EXPIRED','CANCELLED')),
  grants_phase_1 BOOLEAN NOT NULL DEFAULT TRUE,
  grants_phase_2 BOOLEAN NOT NULL DEFAULT TRUE,
  grants_phase_3 BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_cnpj TEXT,
  expires_at TIMESTAMPTZ,
  redeemed_by BIGINT REFERENCES users(id),
  redeemed_company_id BIGINT REFERENCES companies(id),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entitlements (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  phase SMALLINT NOT NULL CHECK (phase IN (1,2,3)),
  status TEXT NOT NULL DEFAULT 'GRANTED' CHECK (status IN ('GRANTED','REVOKED')),
  source TEXT NOT NULL CHECK (source IN ('PAYMENT','BONUS_CASE','GESTAO')),
  source_ref TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(user_id, phase, source)
);

CREATE TABLE IF NOT EXISTS phase_progress (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  phase SMALLINT NOT NULL CHECK (phase IN (1,2,3)),
  state TEXT NOT NULL DEFAULT 'LIBERADA' CHECK (state IN ('BLOQUEADA','PAGAMENTO_PENDENTE','LIBERADA','CONCLUIDA')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, phase)
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
  phase SMALLINT NOT NULL CHECK (phase IN (1,2,3)),
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  amount_cents BIGINT,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','FAILED','REFUNDED','CANCELLED')),
  raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_payment_id)
);

CREATE TABLE IF NOT EXISTS payment_events (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, event_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_company ON entitlements(company_id);
CREATE INDEX IF NOT EXISTS idx_bonus_status ON bonus_codes(status);
CREATE INDEX IF NOT EXISTS idx_bonus_campaign ON bonus_codes(campaign);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
