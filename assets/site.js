
const menuBtn=document.querySelector('.menu-btn');
const navLinks=document.querySelector('.nav-links');
if(menuBtn&&navLinks){menuBtn.addEventListener('click',()=>navLinks.classList.toggle('open'));}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

const quoteForm=document.querySelector('#quote-form');
if(quoteForm){
  quoteForm.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const btn=quoteForm.querySelector('button[type="submit"]');
    const status=document.querySelector('#form-status');
    const data=Object.fromEntries(new FormData(quoteForm).entries());
    btn.disabled=true; btn.textContent='Sending…'; status.textContent='';
    try{
      const r=await fetch('/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      if(!r.ok) throw new Error('not configured');
      quoteForm.reset(); status.textContent='Thank you. Your project details were sent successfully.'; status.style.color='#164f43';
    }catch(err){
      status.textContent='Email delivery is not configured yet. Opening your email app as a fallback…'; status.style.color='#8a5b1d';
      const subject=encodeURIComponent(`ReuseCare RFQ – ${data.product||'Reusable Hygiene Products'}`);
      const body=encodeURIComponent(`Name: ${data.name||''}\nCompany: ${data.company||''}\nCountry: ${data.country||''}\nProduct: ${data.product||''}\nQuantity: ${data.quantity||''}\nWhatsApp: ${data.whatsapp||''}\n\nMessage:\n${data.message||''}`);
      setTimeout(()=>window.location.href=`mailto:sales@reusecare.com?subject=${subject}&body=${body}`,500);
    }finally{btn.disabled=false;btn.textContent='Get My Quote';}
  });
}
