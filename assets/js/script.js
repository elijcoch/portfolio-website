document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('contact-toggle');
  const contact = document.getElementById('contact-list');

  if (!toggle || !contact) return;

  function setOpen(isOpen) {
    if (isOpen) {
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

  const mq = window.matchMedia('(max-width: 700px)');

  function handleMq(e) {
    // On small screens start closed, on larger keep visible
    setOpen(!e.matches);
  }

  if (mq.addEventListener) {
    mq.addEventListener('change', handleMq);
  } else {
    mq.addListener(handleMq);
  }

  handleMq(mq);

  toggle.addEventListener('click', function () {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!isOpen);
  });
});
