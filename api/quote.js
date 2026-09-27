export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid inquiry' });
  }
  const limits = { name: 150, email: 254, product: 150, product_model: 200, product_image: 500, source_url: 500, company: 200, country: 100, quantity: 100, quantity_unit: 50, fabric_use: 200, fabric_print: 200, whatsapp: 100, customization: 1000, message: 5000 };
  const data = {};
  for (const [key, limit] of Object.entries(limits)) {
    if (body[key] != null && (typeof body[key] !== 'string' || body[key].length > limit)) {
      return res.status(400).json({ error: 'Please check your inquiry fields' });
    }
    data[key] = (body[key] || '').trim();
  }
  if (!data.name || !data.product || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || /[\r\n]/.test(data.product)) {
    return res.status(400).json({ error: 'Name, valid email and product are required' });
  }
  if (data.product_model && /[<>\r\n]/.test(data.product_model)) return res.status(400).json({ error: 'Invalid product reference' });
  if (data.product_image && !/^\/assets\/products\/[a-z0-9][a-z0-9-]*\.(?:webp|png|jpe?g)$/i.test(data.product_image)) return res.status(400).json({ error: 'Invalid product image' });
  if (data.source_url && !/^\/[a-z0-9/_-]*\/?$/i.test(data.source_url)) return res.status(400).json({ error: 'Invalid source page' });
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QUOTE_TO_EMAIL;
  if (!apiKey || !to) return res.status(503).json({ error: 'Email service unavailable' });
  const escape = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const labels = { name: 'Name', email: 'Business email', company: 'Company / brand', country: 'Country', product: 'Product line', product_model: 'Selected style / model', product_image: 'Reference image', source_url: 'Source page', quantity: 'Estimated quantity', quantity_unit: 'Quantity unit', fabric_use: 'Fabric intended use', fabric_print: 'Print / color preference', whatsapp: 'WhatsApp', customization: 'Customization', message: 'Project details' };
  const html = '<h2>New ReuseCare RFQ</h2>' + Object.entries(data).filter(([, value]) => value).map(([key, value]) => `<p><b>${labels[key] || key}:</b> ${escape(value).replace(/\n/g, '<br>')}</p>`).join('');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.QUOTE_FROM_EMAIL || 'ReuseCare Website <onboarding@resend.dev>', to: [to], reply_to: data.email, subject: `ReuseCare RFQ — ${(data.product_model || data.product).slice(0, 160)}`, html })
    });
    if (!response.ok) return res.status(502).json({ error: 'Email delivery failed' });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(error.name === 'AbortError' ? 504 : 502).json({ error: 'Email delivery could not be confirmed' });
  } finally {
    clearTimeout(timeout);
  }
}
