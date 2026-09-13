# Meu Concierge Financeiro — MVP funcional v0.3

Incremento da Etapa 7.

## Já funciona
- login local de homologação (não é autenticação de produção);
- cadastro mestre da empresa;
- Jornada 1 completa em 7 passos;
- caminhos de qualidade do dado: confirmado / estimado / desconhecido;
- persistência local no navegador;
- motor financeiro determinístico reutilizado do starter v0.1;
- diagnóstico calculado com ticket, custos variáveis, margem de contribuição, estrutura, ponto de equilíbrio, resultado, margem de segurança e faturamento-meta;
- interpretação por severidade;
- confiança do diagnóstico;
- exportação dos dados de teste;
- identidade visual v2.1 e Inter para todos os números financeiros.

## Como testar
Abra `index.html` em um servidor HTTP local. Exemplo:
`python3 -m http.server 8000`
e acesse `http://localhost:8000`.

## Importante
O login desta versão é propositalmente local para homologação funcional. Antes de produção, substituir por autenticação real e persistência PostgreSQL/Supabase usando o schema em `sql/001_schema.sql`. Nenhuma credencial deve ser colocada no HTML ou no repositório público.

## Ajuste v0.3
- Chamada de entrada reposicionada para descoberta e decisão, não para tarefa administrativa de 'cuidar dos números'.
