# Baseline oficial — Meu Concierge Financeiro v1.72

Fonte: pacote `Meu_Concierge_Financeiro_v1.72_VALIDACAO_COMPLETO(1).zip` enviado para homologação.

## Arquivo principal aprovado
- Caminho no pacote: `Meu_Concierge_Financeiro_v1.72/index.html`
- Tamanho: 4.200.436 bytes
- SHA-256: `167152a2463c2d21d721697a14c1533bc7bb0f6a44e8532879478b7e28ff77a6`
- Git blob SHA-1 equivalente: `0f01c9441cca8f0a52a6881491ecee33b0d24564`
- `Abrir_Concierge.html` é byte a byte idêntico ao `index.html`.

## Referências visuais congeladas dos PDFs
- Diagnóstico: 94.665 bytes — SHA-256 `45203109df97848f66bbc5a83197dd1072406e29a657be82a346fe73a6bc2a1e`
- Direcionamento: 236.818 bytes — SHA-256 `d003f410bafc21f586e8cef1306bb3f1ebbf39545a47ae30bec15f292c4fe7a3`
- Evolução: 306.040 bytes — SHA-256 `452cff3f4b75cbf40220d532d2e8985251de69a9a71bf65f0d3561398ddbd4dd`

## Divergência detectada no GitHub
O arquivo `concierge-beta/index.html` atualmente presente na branch `concierge-seguro-dev` tem:
- tamanho informado pelo GitHub: 4.123.323 bytes;
- blob SHA GitHub: `5dc2acb2a83f1c20d4e14760cbdeb703142765ef`.

Portanto, ele NÃO corresponde à baseline oficial v1.72 e não pode ser usado como fonte de migração.

## Regra de não regressão
Toda migração para backend deve preservar integralmente comportamento, cálculos, textos, persistência, fluxos, visual, geração de PDFs e referências homologadas da v1.72. A beta pública não deve ser alterada durante a migração.
