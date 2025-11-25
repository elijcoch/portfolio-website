document.addEventListener('DOMContentLoaded', function () {
  // Contact toggle functionality
  const toggle = document.getElementById('contact-toggle');
  const contact = document.getElementById('contact-list');

  if (toggle && contact) {
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
  }

  // Page navigation functionality
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');

  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetPage = this.getAttribute('data-page');
      
      // Update active nav link
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      this.classList.add('active');
      
      // Update active page
      pages.forEach(page => page.classList.remove('active'));
      document.getElementById(targetPage).classList.add('active');
      
      // Update URL hash
      window.location.hash = targetPage;
    });
  });

  // Handle direct navigation via URL hash on page load
  const hash = window.location.hash.substring(1);
  if (hash && document.getElementById(hash)) {
    navLinks.forEach(link => {
      if (link.getAttribute('data-page') === hash) {
        link.click();
      }
    });
  }
});
