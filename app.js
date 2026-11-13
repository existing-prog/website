'use strict';
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { navigation.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); }
menuButton.addEventListener('click', () => { const open = navigation.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(open)); });
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menuButton.focus(); } });
document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => { document.querySelector('#service').value = link.dataset.service; }));
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  document.documentElement.classList.add('js-reveal');
}
document.querySelector('#year').textContent = new Date().getFullYear();
let projectBrief = '';
const form = document.querySelector('#brief-form');
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = String(data.get('name')).trim();
  const email = String(data.get('email')).trim();
  const service = String(data.get('service'));
  const message = String(data.get('message')).trim();
  if (!name || message.length < 15) {
    const field = !name ? form.elements.name : form.elements.message;
    field.setCustomValidity(!name ? 'Please enter your name.' : 'Please share at least 15 characters about your project.');
    field.reportValidity();
    field.addEventListener('input', () => field.setCustomValidity(''), { once: true });
    return;
  }
  projectBrief = `Hi Lucas,\n\nI'm interested in: ${service}\n\n${message}\n\nName: ${name}\nEmail: ${email}`;
  document.querySelector('#form-result').hidden = false;
  document.querySelector('#copy-status').textContent = '';
  document.querySelector('#brief-fallback').hidden = true;
  const subject = `Website enquiry — ${service}`;
  window.location.href = `mailto:lucasberdy@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(projectBrief)}`;
});
document.querySelector('#copy-brief').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(projectBrief);
    status.textContent = 'Copied. Send your brief to lucasberdy@gmail.com.';
  } catch {
    const fallback = document.querySelector('#brief-fallback');
    fallback.value = projectBrief;
    fallback.hidden = false;
    fallback.focus();
    fallback.select();
    status.textContent = 'Select and copy your brief below, then email it to lucasberdy@gmail.com.';
  }
});
