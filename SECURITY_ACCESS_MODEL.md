# Meu Concierge Financeiro — Modelo de acesso

## Perfis

### GESTAO
Acesso interno para proprietária/gestão do produto.

Permissões:
- acessar Fase 1, Fase 2 e Fase 3 sem exigência de pagamento;
- repetir qualquer etapa quantas vezes forem necessárias;
- gerar e validar todos os relatórios/PDFs;
- testar cenários e jornadas completas;
- visualizar estados bloqueado/liberado para fins de homologação;
- não ser afetado por regras comerciais de desbloqueio;
- manter trilha separada dos clientes comerciais.

### CLIENTE
Acesso comercial sujeito às regras de compra e liberação.

Estados mínimos por fase:
- bloqueada;
- pagamento pendente;
- liberada;
- concluída.

Fluxo:
1. Fase 1 — Diagnóstico: liberada após pagamento correspondente.
2. Fase 2 — Direcionamento: permanece bloqueada até pagamento correspondente.
3. Fase 3 — Evolução: permanece bloqueada até pagamento correspondente.

## Regras de segurança
- O perfil GESTAO é definido no servidor, nunca por parâmetro de URL ou código visível no navegador.
- Cliente não pode promover a própria conta para GESTAO.
- A autorização deve ser validada no servidor em cada operação protegida.
- Pagamentos liberam fases do CLIENTE; não alteram o perfil da conta.
- O acesso de GESTAO não deve modificar automaticamente dados ou permissões de clientes.
- Logs devem distinguir ações de GESTAO e CLIENTE.
- A beta atual permanece preservada; esta arquitetura será construída apenas na branch concierge-seguro-dev.

## Princípio
Cliente obedece às travas comerciais. Gestão possui acesso integral de homologação, sem bypass inseguro no frontend.
