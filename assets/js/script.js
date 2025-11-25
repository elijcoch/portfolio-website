document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('contact-toggle');
  const contact = document.getElementById('contact-list');

  if (!toggle || !contact) return;

  function updateState(open) {
    if (open) {
      contact.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      contact.setAttribute('aria-hidden', 'false');
      toggle.textContent = 'Hide Contact Info';
    } else {
      contact.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      contact.setAttribute('aria-hidden', 'true');
      toggle.textContent = 'Show Contact Info';
    }
  }

  // Start closed on small screens
  const mq = window.matchMedia('(max-width: 700px)');
  function handleMq(e) {
    if (e.matches) {
      updateState(false);
    } else {
      // On larger screens keep it visible
      updateState(true);
    }
  }
  mq.addEventListener ? mq.addEventListener('change', handleMq) : mq.addListener(handleMq);
  handleMq(mq);

  toggle.addEventListener('click', function () {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    updateState(!isOpen);
  });
});
