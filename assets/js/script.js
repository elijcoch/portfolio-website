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

  // Certification modal functionality
  const modal = document.getElementById('cert-modal');
  const modalTitle = document.getElementById('modal-title');
  const imageViewer = document.getElementById('cert-image-viewer');
  const modalClose = modal.querySelector('.modal-close');
  const modalOverlay = modal.querySelector('.modal-overlay');
  const certificationItems = document.querySelectorAll('.certification-item[data-image]');

  let certZoomLevel = 1;
  const certZoomStep = 0.1;
  const certMinZoom = 0.5;
  const certMaxZoom = 3;

  let certIsDragging = false;
  let certStartX = 0;
  let certStartY = 0;
  let certTranslateX = 0;
  let certTranslateY = 0;

  function openModal(certName, imagePath) {
    modalTitle.textContent = certName;
    imageViewer.setAttribute('src', imagePath);
    imageViewer.setAttribute('alt', certName + ' Certification');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    certZoomLevel = 1;
    certTranslateX = 0;
    certTranslateY = 0;
    imageViewer.style.transform = 'scale(1)';
  }

  function closeModal() {
    modal.classList.remove('active', 'fullscreen');
    modal.setAttribute('aria-hidden', 'true');
    imageViewer.setAttribute('src', '');
    document.body.style.overflow = '';
    certZoomLevel = 1;
    certTranslateX = 0;
    certTranslateY = 0;
    imageViewer.style.transform = 'scale(1)';
    imageViewer.style.cursor = 'default';
    updateFullscreenIcon(modal, false);
    toggleZoomButtons(modal, false);
  }

  function updateCertZoom(newZoom) {
    certZoomLevel = Math.max(certMinZoom, Math.min(certMaxZoom, newZoom));
    imageViewer.style.transform = `translate(${certTranslateX}px, ${certTranslateY}px) scale(${certZoomLevel})`;
  }

  function updateFullscreenIcon(modalElement, isFullscreen) {
    const fullscreenBtn = modalElement.querySelector('.fullscreen-btn');
    const enterIcon = fullscreenBtn.querySelector('.fullscreen-icon');
    const exitIcon = fullscreenBtn.querySelector('.exit-fullscreen-icon');
    
    if (isFullscreen) {
      enterIcon.style.display = 'none';
      exitIcon.style.display = 'block';
    } else {
      enterIcon.style.display = 'block';
      exitIcon.style.display = 'none';
    }
  }

  function toggleZoomButtons(modalElement, show) {
    const zoomIn = modalElement.querySelector('.zoom-in');
    const zoomOut = modalElement.querySelector('.zoom-out');
    const zoomReset = modalElement.querySelector('.zoom-reset');
    
    const display = show ? 'flex' : 'none';
    if (zoomIn) zoomIn.style.display = display;
    if (zoomOut) zoomOut.style.display = display;
    if (zoomReset) zoomReset.style.display = display;
  }

  // Fullscreen toggle for certification modal
  const certFullscreenBtn = modal.querySelector('.fullscreen-btn');
  if (certFullscreenBtn) {
    certFullscreenBtn.addEventListener('click', function() {
      const isFullscreen = modal.classList.toggle('fullscreen');
      updateFullscreenIcon(modal, isFullscreen);
      toggleZoomButtons(modal, isFullscreen);
      
      // Reset zoom and position when exiting fullscreen
      if (!isFullscreen) {
        certZoomLevel = 1;
        certTranslateX = 0;
        certTranslateY = 0;
        imageViewer.style.transform = 'scale(1)';
        imageViewer.style.cursor = 'default';
      } else {
        imageViewer.style.cursor = 'grab';
      }
    });
  }

  // Zoom controls for certification modal
  const certZoomIn = modal.querySelector('.zoom-in');
  const certZoomOut = modal.querySelector('.zoom-out');
  const certZoomReset = modal.querySelector('.zoom-reset');

  if (certZoomIn) {
    certZoomIn.addEventListener('click', function() {
      updateCertZoom(certZoomLevel + certZoomStep);
    });
  }

  if (certZoomOut) {
    certZoomOut.addEventListener('click', function() {
      updateCertZoom(certZoomLevel - certZoomStep);
    });
  }

  if (certZoomReset) {
    certZoomReset.addEventListener('click', function() {
      certZoomLevel = 1;
      certTranslateX = 0;
      certTranslateY = 0;
      imageViewer.style.transform = 'scale(1)';
    });
  }

  // Click and drag functionality for certification modal (fullscreen only)
  imageViewer.addEventListener('mousedown', function(e) {
    if (!modal.classList.contains('fullscreen')) return;
    
    certIsDragging = true;
    certStartX = e.clientX - certTranslateX;
    certStartY = e.clientY - certTranslateY;
    imageViewer.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (!certIsDragging || !modal.classList.contains('fullscreen')) return;
    
    certTranslateX = e.clientX - certStartX;
    certTranslateY = e.clientY - certStartY;
    imageViewer.style.transform = `translate(${certTranslateX}px, ${certTranslateY}px) scale(${certZoomLevel})`;
  });

  document.addEventListener('mouseup', function() {
    if (certIsDragging) {
      certIsDragging = false;
      if (modal.classList.contains('fullscreen')) {
        imageViewer.style.cursor = 'grab';
      }
    }
  });

  // Add click handlers to certification items
  certificationItems.forEach(item => {
    item.addEventListener('click', function() {
      const imagePath = this.getAttribute('data-image');
      const certName = this.querySelector('.cert-name').textContent;
      openModal(certName, imagePath);
    });

    // Add keyboard support
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const imagePath = this.getAttribute('data-image');
        const certName = this.querySelector('.cert-name').textContent;
        openModal(certName, imagePath);
      }
    });
  });

  // Close modal handlers
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
  }

  // Close modal on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Recommendation letter modal functionality
  const letterModal = document.getElementById('letter-modal');
  const letterModalTitle = document.getElementById('letter-modal-title');
  const letterImageViewer = document.getElementById('letter-image-viewer');
  const letterModalClose = letterModal.querySelector('.modal-close');
  const letterModalOverlay = letterModal.querySelector('.modal-overlay');
  const recommendationItems = document.querySelectorAll('.recommendation-item[data-letter-image]');

  let letterZoomLevel = 1;
  const letterZoomStep = 0.1;
  const letterMinZoom = 0.5;
  const letterMaxZoom = 3;

  let letterIsDragging = false;
  let letterStartX = 0;
  let letterStartY = 0;
  let letterTranslateX = 0;
  let letterTranslateY = 0;

  function openLetterModal(recommenderName, imagePath) {
    letterModalTitle.textContent = 'Recommendation from ' + recommenderName;
    letterImageViewer.setAttribute('src', imagePath);
    letterImageViewer.setAttribute('alt', recommenderName + ' Recommendation Letter');
    letterModal.classList.add('active');
    letterModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    letterZoomLevel = 1;
    letterTranslateX = 0;
    letterTranslateY = 0;
    letterImageViewer.style.transform = 'scale(1)';
  }

  function closeLetterModal() {
    letterModal.classList.remove('active', 'fullscreen');
    letterModal.setAttribute('aria-hidden', 'true');
    letterImageViewer.setAttribute('src', '');
    document.body.style.overflow = '';
    letterZoomLevel = 1;
    letterTranslateX = 0;
    letterTranslateY = 0;
    letterImageViewer.style.transform = 'scale(1)';
    letterImageViewer.style.cursor = 'default';
    updateFullscreenIcon(letterModal, false);
    toggleZoomButtons(letterModal, false);
  }

  function updateLetterZoom(newZoom) {
    letterZoomLevel = Math.max(letterMinZoom, Math.min(letterMaxZoom, newZoom));
    letterImageViewer.style.transform = `translate(${letterTranslateX}px, ${letterTranslateY}px) scale(${letterZoomLevel})`;
  }

  // Fullscreen toggle for letter modal
  const letterFullscreenBtn = letterModal.querySelector('.fullscreen-btn');
  if (letterFullscreenBtn) {
    letterFullscreenBtn.addEventListener('click', function() {
      const isFullscreen = letterModal.classList.toggle('fullscreen');
      updateFullscreenIcon(letterModal, isFullscreen);
      toggleZoomButtons(letterModal, isFullscreen);
      
      // Reset zoom and position when exiting fullscreen
      if (!isFullscreen) {
        letterZoomLevel = 1;
        letterTranslateX = 0;
        letterTranslateY = 0;
        letterImageViewer.style.transform = 'scale(1)';
        letterImageViewer.style.cursor = 'default';
      } else {
        letterImageViewer.style.cursor = 'grab';
      }
    });
  }

  // Zoom controls for letter modal
  const letterZoomIn = letterModal.querySelector('.zoom-in');
  const letterZoomOut = letterModal.querySelector('.zoom-out');
  const letterZoomReset = letterModal.querySelector('.zoom-reset');

  if (letterZoomIn) {
    letterZoomIn.addEventListener('click', function() {
      updateLetterZoom(letterZoomLevel + letterZoomStep);
    });
  }

  if (letterZoomOut) {
    letterZoomOut.addEventListener('click', function() {
      updateLetterZoom(letterZoomLevel - letterZoomStep);
    });
  }

  if (letterZoomReset) {
    letterZoomReset.addEventListener('click', function() {
      letterZoomLevel = 1;
      letterTranslateX = 0;
      letterTranslateY = 0;
      letterImageViewer.style.transform = 'scale(1)';
    });
  }

  // Click and drag functionality for letter modal (fullscreen only)
  letterImageViewer.addEventListener('mousedown', function(e) {
    if (!letterModal.classList.contains('fullscreen')) return;
    
    letterIsDragging = true;
    letterStartX = e.clientX - letterTranslateX;
    letterStartY = e.clientY - letterTranslateY;
    letterImageViewer.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (!letterIsDragging || !letterModal.classList.contains('fullscreen')) return;
    
    letterTranslateX = e.clientX - letterStartX;
    letterTranslateY = e.clientY - letterStartY;
    letterImageViewer.style.transform = `translate(${letterTranslateX}px, ${letterTranslateY}px) scale(${letterZoomLevel})`;
  });

  document.addEventListener('mouseup', function() {
    if (letterIsDragging) {
      letterIsDragging = false;
      if (letterModal.classList.contains('fullscreen')) {
        letterImageViewer.style.cursor = 'grab';
      }
    }
  });

  // Add click handlers to recommendation items
  recommendationItems.forEach(item => {
    item.addEventListener('click', function() {
      const imagePath = this.getAttribute('data-letter-image');
      const recommenderName = this.querySelector('.recommender-name').textContent;
      openLetterModal(recommenderName, imagePath);
    });

    // Add keyboard support
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const imagePath = this.getAttribute('data-letter-image');
        const recommenderName = this.querySelector('.recommender-name').textContent;
        openLetterModal(recommenderName, imagePath);
      }
    });
  });

  // Close letter modal handlers
  if (letterModalClose) {
    letterModalClose.addEventListener('click', closeLetterModal);
  }

  if (letterModalOverlay) {
    letterModalOverlay.addEventListener('click', closeLetterModal);
  }

  // Close letter modal on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && letterModal.classList.contains('active')) {
      closeLetterModal();
    }
  });
});
