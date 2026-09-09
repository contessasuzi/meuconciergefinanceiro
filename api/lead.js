// Recebe os dados do formulário do Concierge de Preço e cria o registro
// no CRM da Suzi no Notion (Clientes + Funil de Vendas), além de enviar
// um e-mail de notificação para ela.
// As credenciais ficam em variáveis de ambiente configuradas no Vercel,
// nunca no código do repositório.

const nodemailer = require('nodemailer');

const NOTION_VERSION = '2022-06-28';
const CLIENTES_DATA_SOURCE_ID = '0ada1d18-89da-4649-9785-c8b9815bd9a1';
const FUNIL_DATA_SOURCE_ID = 'ba32d964-a2f2-4cea-8a0f-f29e7f1eec88';
const NOTIFICATION_EMAIL = 'contessasuzi@gmail.com';

async function notion(path, body) {
  const res = await fetch('https://api.notion.com/v1/' + path, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.NOTION_TOKEN,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error('Notion API error (' + res.status + '): ' + JSON.stringify(data));
  }
  return data;
}

function onlyDigits(s) { return (s || '').replace(/\D/g, ''); }

async function enviarNotificacaoPorEmail({ nome, email, fone, segLabel }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('GMAIL_USER ou GMAIL_APP_PASSWORD não configurados');
    return;
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: NOTIFICATION_EMAIL,
    subject: 'Novo lead — Concierge de Preço (site)',
    text:
      'Um novo cliente usou a ferramenta Concierge de Preço no site.\n\n' +
      'Nome: ' + (nome || '(não informado)') + '\n' +
      'E-mail: ' + email + '\n' +
      'WhatsApp: +55' + fone + '\n' +
      'Segmento: ' + segLabel + '\n\n' +
      'O cadastro e a oportunidade já foram criados no Notion.'
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!process.env.NOTION_TOKEN) {
    res.status(500).json({ error: 'NOTION_TOKEN not configured' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const nome = (body.nome || '').toString().trim();
    const email = (body.email || '').toString().trim();
    const fone = onlyDigits(body.fone);
    const segmento = (body.segmento || '').toString().trim();
    const segmentoOutro = (body.segmentoOutro || '').toString().trim();

    if (!email || !fone || !segmento) {
      res.status(400).json({ error: 'Dados incompletos' });
      return;
    }

    const segLabel = (segmento === 'Outro' && segmentoOutro) ? segmentoOutro : segmento;
    const origem = 'Site — Concierge de Preço';

    // 1) Cria (ou usa) o cadastro do cliente
    const clientePage = await notion('pages', {
      parent: { data_source_id: CLIENTES_DATA_SOURCE_ID },
      properties: {
        'Nome': { title: [{ text: { content: nome || email } }] },
        'E-mail': { email: email },
        'Telefone / WhatsApp': { phone_number: '+55' + fone },
        'Profissão / Segmento': { rich_text: [{ text: { content: segLabel } }] },
        'Status': { select: { name: 'Lead' } },
        'Origem': { select: { name: origem } },
        'Observações': { rich_text: [{ text: { content: 'Cadastro criado automaticamente pela ferramenta Concierge de Preço no site.' } }] }
      }
    });

    // 2) Cria a oportunidade no funil de vendas, ligada ao cliente
    await notion('pages', {
      parent: { data_source_id: FUNIL_DATA_SOURCE_ID },
      properties: {
        'Oportunidade': { title: [{ text: { content: 'Concierge de Preço — ' + (nome || email) } }] },
        'Etapa': { select: { name: 'Novo contato' } },
        'Cliente': { relation: [{ id: clientePage.id }] },
        'Próxima ação': { rich_text: [{ text: { content: 'Entrar em contato com o lead da ferramenta Concierge de Preço' } }] },
        'Observações': { rich_text: [{ text: { content: 'Origem: ferramenta Concierge de Preço no site (' + origem + '). Segmento informado: ' + segLabel + '.' } }] }
      }
    });

    // 3) Envia a notificação por e-mail (não deve derrubar a resposta se falhar)
    try {
      await enviarNotificacaoPorEmail({ nome, email, fone, segLabel });
    } catch (emailErr) {
      console.error('Falha ao enviar e-mail de notificação:', emailErr);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Falha ao registrar lead' });
  }
};
