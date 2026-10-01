# Mapa de migração — baseline v1.72

## Fonte oficial
A fonte de referência é o pacote v1.72 homologado, identificado em `BASELINE_V1.72.md`.

## Estrutura observada na v1.72
- aplicação monolítica em `index.html`;
- estado central serializado em JSON;
- chave de persistência ativa: `mcf_v172`;
- gravação atual via `localStorage`;
- centenas de funções de regra, cálculo, narrativa, simulação, evolução e geração de PDF executadas no navegador;
- geração dos três PDFs executada no cliente com PDFLib/fontkit e fontes embutidas;
- cálculo do Diagnóstico, Direcionamento, Simulação e Evolução ainda exposto ao navegador.

## Limite de segurança
Enquanto a inteligência permanecer no monólito, o arquivo integral não deve ser servido a clientes comerciais. Na branch segura, o acesso ao monólito está restrito à GESTAO durante a migração.

## Ordem de migração sem regressão

### Camada 1 — identidade e autorização
Status: em implementação.
- login e sessão HttpOnly;
- perfis CLIENTE e GESTAO;
- direito de acesso por fase;
- bônus/cases;
- contrato para pagamento.

### Camada 2 — persistência no servidor
Status: iniciada.
- tabela `concierge_state`;
- API autenticada `GET/PUT /api/state/current`;
- revisão otimista para evitar sobrescrita silenciosa;
- vínculo opcional com empresa/CNPJ;
- auditoria de salvamento.

Próxima ação nesta camada: substituir o uso direto de `localStorage` por um adaptador de persistência compatível com a estrutura de estado v1.72, mantendo cache local somente como contingência e nunca como fonte oficial em produção.

### Camada 3 — regras financeiras
A migrar em blocos, sempre com testes de equivalência:
1. Diagnóstico;
2. objetivo e Direcionamento;
3. Simulação;
4. precificação;
5. Evolução;
6. textos/narrativas derivados.

As funções do navegador passam a chamar endpoints do servidor; a UI recebe apenas entradas e resultados necessários para renderização.

### Camada 4 — PDFs
Migrar geração para servidor ou endpoint protegido, mantendo como golden masters os três PDFs homologados do pacote v1.72. Nenhuma mudança tipográfica, de margem, hierarquia, alinhamento ou conteúdo é permitida sem nova homologação.

### Camada 5 — pagamento
Conectar o provedor ao contrato já definido:
- webhook assinado;
- idempotência;
- pagamento aprovado -> entitlement da fase;
- estorno/cancelamento -> política de revogação;
- nenhuma confiança em fase/preço vindos somente do navegador.

## Critério de equivalência
Antes de liberar cada bloco para clientes:
- mesmas entradas produzem os mesmos resultados da v1.72;
- nenhuma perda de estado ao navegar/recarregar;
- Gestão continua com acesso integral;
- Cliente só acessa fases concedidas;
- BONUS_CASE reproduz a jornada comercial sem cobrança;
- PDFs permanecem visual e numericamente equivalentes aos padrões homologados;
- a beta pública permanece intacta.
