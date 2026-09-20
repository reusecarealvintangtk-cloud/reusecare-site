export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  const apiKey=process.env.RESEND_API_KEY; const to=process.env.QUOTE_TO_EMAIL;
  if(!apiKey||!to) return res.status(503).json({error:"Email service not configured"});
  const b=req.body||{};
  const safe=(v)=>String(v||"").replace(/[<>]/g,"");
  const html=`<h2>New ReuseCare RFQ</h2><p><b>Name:</b> ${safe(b.name)}</p><p><b>Email:</b> ${safe(b.email)}</p><p><b>Company:</b> ${safe(b.company)}</p><p><b>Country:</b> ${safe(b.country)}</p><p><b>Product:</b> ${safe(b.product)}</p><p><b>Quantity:</b> ${safe(b.quantity)}</p><p><b>WhatsApp:</b> ${safe(b.whatsapp)}</p><p><b>Customization:</b> ${safe(b.customization)}</p><p><b>Message:</b><br>${safe(b.message).replace(/\n/g,"<br>")}</p>`;
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.QUOTE_FROM_EMAIL||'ReuseCare Website <onboarding@resend.dev>',to:[to],reply_to:b.email,subject:`ReuseCare RFQ – ${safe(b.product)||'Website inquiry'}`,html})});
  if(!r.ok) return res.status(502).json({error:'Email provider error'});
  return res.status(200).json({ok:true});
}