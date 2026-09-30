# Meu Concierge Financeiro — contrato de pagamento e liberação

## Princípio
Pagamento não abre tela diretamente. Pagamento aprovado cria um direito de acesso (`entitlement`) no servidor.

A mesma camada de autorização atende três origens:
- `PAYMENT` — compra aprovada;
- `BONUS_CASE` — código individual de validação/cortesia;
- `GESTAO` — acesso interno de homologação.

## Jornada comercial
1. Cliente cria/login na conta.
2. Fase 1 permanece bloqueada até pagamento aprovado ou bônus válido.
3. Ao concluir a Fase 1, a Fase 2 pode ser ofertada; ela só abre após novo pagamento aprovado ou direito equivalente.
4. A Fase 3 segue a mesma lógica.
5. Estorno/cancelamento pode revogar o entitlement correspondente conforme a política comercial definida.

## Webhook do provedor
O provedor escolhido deve enviar evento assinado para o backend. O backend deve:
1. validar assinatura;
2. garantir idempotência por `event_id`;
3. localizar usuário/empresa e fase comprada;
4. registrar/atualizar `payments`;
5. em status aprovado, conceder entitlement via `grantPaidPhase`;
6. gravar auditoria;
7. nunca confiar em valor de fase enviado pelo navegador sem conferência no servidor.

## Dados mínimos esperados do checkout
- `user_id` interno;
- `company_id` quando aplicável;
- `phase` 1, 2 ou 3;
- identificador do produto/preço no provedor;
- identificador externo do pagamento;
- valor e moeda.

## Segurança
- chaves secretas somente no ambiente do servidor;
- nenhum segredo no HTML/JavaScript do navegador;
- webhook com assinatura obrigatória;
- proteção contra reprocessamento;
- acesso calculado no servidor a cada operação protegida;
- logs de concessão, revogação e resgate de bônus.

## Estado atual
A arquitetura de banco, autenticação, gestão, bônus e entitlement está sendo construída na branch `concierge-seguro-dev`. O provedor de pagamento será conectado a este contrato sem alterar as regras centrais do produto.
