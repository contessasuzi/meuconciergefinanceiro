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

### CLIENTE CASE / BÔNUS
É um CLIENTE comum em termos de jornada, permissões e experiência. Não recebe privilégios de GESTAO.

Objetivo:
- permitir validação real de mercado com usuários selecionados;
- eliminar cobrança financeira sem alterar a experiência funcional do produto;
- registrar claramente que o acesso foi concedido como cortesia/case, e não por pagamento.

Regras:
- cada participante recebe um código de bônus individual;
- o código deve ser criado e validado no servidor;
- cada código pode ser de uso único e vinculado à conta que o resgatar;
- o resgate concede os mesmos direitos que um pagamento aprovado para as fases definidas;
- para o grupo inicial de validação, o código pode liberar Fase 1, Fase 2 e Fase 3 sem cobrança;
- o usuário continua passando pela jornada normal, incluindo login, preenchimento de dados, geração de relatórios e progressão entre fases;
- o sistema registra a origem do acesso como BONUS_CASE, separada de PAGAMENTO;
- usar código não transforma a conta em GESTAO;
- códigos podem ter validade, status ativo/inativo e identificação da campanha;
- códigos resgatados não podem ser reutilizados por outra conta;
- a quantidade inicial planejada é de 10 códigos para 10 usuários/cases.

Estados mínimos do código:
- criado;
- ativo;
- resgatado;
- expirado;
- cancelado.

## Entitlements / direitos de acesso

A liberação de uma fase deve depender de um direito de acesso registrado no servidor, e não diretamente da existência de um pagamento.

Origens possíveis do direito:
- PAGAMENTO: compra aprovada;
- BONUS_CASE: código de validação/cortesia;
- GESTAO: permissão administrativa interna.

Assim, pagamento e bônus usam a mesma camada de autorização, preservando a experiência do cliente e evitando regras paralelas frágeis.

## Regras de segurança
- O perfil GESTAO é definido no servidor, nunca por parâmetro de URL ou código visível no navegador.
- Cliente não pode promover a própria conta para GESTAO.
- A autorização deve ser validada no servidor em cada operação protegida.
- Pagamentos ou códigos de bônus liberam fases do CLIENTE; não alteram o perfil da conta.
- Códigos de bônus não devem conter a lógica de liberação no frontend.
- O acesso de GESTAO não deve modificar automaticamente dados ou permissões de clientes.
- Logs devem distinguir ações de GESTAO, CLIENTE pago e CLIENTE BONUS_CASE.
- A beta atual permanece preservada; esta arquitetura será construída apenas na branch concierge-seguro-dev.

## Princípio
Cliente obedece às travas comerciais. Gestão possui acesso integral de homologação. Cliente BONUS_CASE vive a jornada real do produto, mas recebe o direito de acesso por cortesia em vez de pagamento.
