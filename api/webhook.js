/**
 * Vercel Serverless Function — JobNimbus Webhook
 * Endpoint: POST /api/webhook
 * 
 * Environment variable needed in Vercel dashboard:
 *   JOBNIMBUS_API_KEY
 */

const JN_BASE = 'https://app.jobnimbus.com/api1';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS).end();
  }

  // Set CORS on all responses
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const API_KEY = process.env.JOBNIMBUS_API_KEY;
  if (!API_KEY) {
    console.error('❌ JOBNIMBUS_API_KEY not set');
    return res.status(500).json({ ok: false, error: 'Server misconfiguration' });
  }

  try {
    const body = req.body;
    console.log('📥 Incoming submission:', JSON.stringify(body));

    // ── NEWSLETTER SIGNUP ──
    if (body.type === 'newsletter') {
      const contact = await jnPost(API_KEY, '/contacts', {
        first_name: '',
        last_name: '',
        email: body.email,
        record_type_name: 'Customer',
        status_name: 'New',
        tags: ['newsletter', 'landing-page'],
        description: `Newsletter signup from landing page\n${body.submittedAt || ''}`
      });
      console.log(`✅ Newsletter contact: ${contact.jnid}`);
      return res.status(200).json({ ok: true, type: 'newsletter', id: contact.jnid });
    }

    // ── LEAD FORM ──
    const {
      firstName = '', lastName = '', fullName = '',
      phone = '', email = '',
      service = '', board = 'Retail',
      roofType = '', renovationTypes = [],
      message = '', source = '', page = '', submittedAt = ''
    } = body;

    let description = `Lead from: ${source}\nService: ${service}\n`;
    if (roofType) description += `Roof Type: ${roofType}\n`;
    if (renovationTypes.length) description += `Renovation: ${renovationTypes.join(', ')}\n`;
    if (message) description += `Message: ${message}\n`;
    description += `Page: ${page}\nSubmitted: ${submittedAt}`;

    // 1. Create Contact
    const contact = await jnPost(API_KEY, '/contacts', {
      first_name: firstName,
      last_name: lastName,
      display_name: fullName || `${firstName} ${lastName}`.trim(),
      email,
      home_phone: phone,
      record_type_name: 'Customer',
      status_name: 'New',
      tags: ['landing-page', `service-${service}`],
      description
    });
    console.log(`✅ Contact: ${contact.display_name} (${contact.jnid})`);

    // 2. Create Job
    const job = await jnPost(API_KEY, '/jobs', {
      name: `${fullName || firstName} — ${service} lead`,
      record_type_name: board,
      status_name: 'Lead',
      description,
      primary: { id: contact.jnid, type: 'contact' },
      tags: ['landing-page']
    });
    console.log(`✅ Job: ${job.name} → ${board} (${job.jnid})`);

    return res.status(200).json({
      ok: true,
      contact_id: contact.jnid,
      job_id: job.jnid,
      board
    });

  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

async function jnPost(apiKey, endpoint, data) {
  const resp = await fetch(`${JN_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`JN ${endpoint} → ${resp.status}: ${text}`);
  }
  return resp.json();
}
