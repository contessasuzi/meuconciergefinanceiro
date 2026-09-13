import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('Jornada 1 possui sete passos',()=>assert.equal((html.match(/class="step(?: active)? card"/g)||[]).length,7));
test('números financeiros usam Inter',()=>assert.match(html,/\.kpi \.value,\.metric strong\{font-family:Inter/));
test('persistência local está presente',()=>assert.match(html,/localStorage\.setItem\('mcf_mvp_v02'/));
test('motor determinístico é importado',()=>assert.match(html,/calculateDiagnosis,targetRevenue/));
