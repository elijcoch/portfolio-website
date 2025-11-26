document.addEventListener('DOMContentLoaded', function () {
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

  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');

  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetPage = this.getAttribute('data-page');
      
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      this.classList.add('active');
      
      pages.forEach(page => page.classList.remove('active'));
      document.getElementById(targetPage).classList.add('active');
      
      window.location.hash = targetPage;
    });
  });

  const hash = window.location.hash.substring(1);
  if (hash && document.getElementById(hash)) {
    navLinks.forEach(link => {
      if (link.getAttribute('data-page') === hash) {
        link.click();
      }
    });
  }

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
    imageViewer.style.cursor = 'grab';
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

  const certFullscreenBtn = modal.querySelector('.fullscreen-btn');
  if (certFullscreenBtn) {
    certFullscreenBtn.addEventListener('click', function() {
      const isFullscreen = modal.classList.toggle('fullscreen');
      updateFullscreenIcon(modal, isFullscreen);
      toggleZoomButtons(modal, isFullscreen);
      
      if (!isFullscreen) {
        certZoomLevel = 1;
        certTranslateX = 0;
        certTranslateY = 0;
        imageViewer.style.transform = 'scale(1)';
        imageViewer.style.cursor = 'grab';
      }
    });
  }

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

  certificationItems.forEach(item => {
    item.addEventListener('click', function() {
      const imagePath = this.getAttribute('data-image');
      const certName = this.querySelector('.cert-name').textContent;
      openModal(certName, imagePath);
    });

    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const imagePath = this.getAttribute('data-image');
        const certName = this.querySelector('.cert-name').textContent;
        openModal(certName, imagePath);
      }
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

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
    letterImageViewer.style.cursor = 'grab';
    updateFullscreenIcon(letterModal, false);
    toggleZoomButtons(letterModal, false);
  }

  function updateLetterZoom(newZoom) {
    letterZoomLevel = Math.max(letterMinZoom, Math.min(letterMaxZoom, newZoom));
    letterImageViewer.style.transform = `translate(${letterTranslateX}px, ${letterTranslateY}px) scale(${letterZoomLevel})`;
  }

  const letterFullscreenBtn = letterModal.querySelector('.fullscreen-btn');
  if (letterFullscreenBtn) {
    letterFullscreenBtn.addEventListener('click', function() {
      const isFullscreen = letterModal.classList.toggle('fullscreen');
      updateFullscreenIcon(letterModal, isFullscreen);
      toggleZoomButtons(letterModal, isFullscreen);
      
      if (!isFullscreen) {
        letterZoomLevel = 1;
        letterTranslateX = 0;
        letterTranslateY = 0;
        letterImageViewer.style.transform = 'scale(1)';
        letterImageViewer.style.cursor = 'grab';
      }
    });
  }

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

  recommendationItems.forEach(item => {
    item.addEventListener('click', function() {
      const imagePath = this.getAttribute('data-letter-image');
      const recommenderName = this.querySelector('.recommender-name').textContent;
      openLetterModal(recommenderName, imagePath);
    });

    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const imagePath = this.getAttribute('data-letter-image');
        const recommenderName = this.querySelector('.recommender-name').textContent;
        openLetterModal(recommenderName, imagePath);
      }
    });
  });

  if (letterModalClose) {
    letterModalClose.addEventListener('click', closeLetterModal);
  }

  if (letterModalOverlay) {
    letterModalOverlay.addEventListener('click', closeLetterModal);
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (modal.classList.contains('active')) {
        closeModal();
      } else if (letterModal.classList.contains('active')) {
        closeLetterModal();
      } else if (projectModal && projectModal.classList.contains('active')) {
        closeProjectModal();
      }
    }
  });

  function initCarousel(section) {
    const grid = section.querySelector('.projects-carousel .projects-grid');
    const prevBtn = section.querySelector('.carousel-btn.prev');
    const nextBtn = section.querySelector('.carousel-btn.next');
    const dotsContainer = section.querySelector('.carousel-nav .carousel-dots');
    if (!grid || !prevBtn || !nextBtn) return;

    let index = 0;
    function cards() { return Array.from(grid.querySelectorAll('.project-card')).filter(c => c.style.display !== 'none'); }

    function buildDots(visibleCards) {
      if (!dotsContainer) return; 
      dotsContainer.innerHTML='';
      visibleCards.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.type='button';
        btn.className='carousel-dot' + (i===index?' active':'');
        btn.setAttribute('aria-label','Go to slide ' + (i+1));
        btn.addEventListener('click',()=>{ index=i; update(); });
        dotsContainer.appendChild(btn);
      });
    }

    function update() {
      const visibleCards = cards();
      const total = visibleCards.length;
      if (total === 0) return;

      const isMobile = window.matchMedia('(max-width: 700px)').matches;
      const carousel = section.querySelector('.projects-carousel');

      if (!isMobile) {
        index = 0;
        grid.style.transform = '';
        if (carousel) carousel.style.paddingBottom = '';
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        if (dotsContainer) {
          dotsContainer.classList.add('hidden');
          dotsContainer.innerHTML = '';
        }
        return;
      }

      if (total === 1) {
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        if (dotsContainer) dotsContainer.classList.add('hidden');
        if (carousel) carousel.style.paddingBottom = '0px';
      } else {
        prevBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        if (dotsContainer) dotsContainer.classList.remove('hidden');
        if (carousel) carousel.style.paddingBottom = '';
      }

      if (index < 0) index = total - 1;
      if (index >= total) index = 0;

      const targetCard = visibleCards[index];
      const targetLeft = targetCard.offsetLeft;
      grid.scrollTo({ left: targetLeft, behavior: 'smooth' });

      if (total > 1) buildDots(visibleCards);
      if (dotsContainer) {
        const allDots = dotsContainer.querySelectorAll('.carousel-dot');
        allDots.forEach((d,i)=> d.classList.toggle('active', i===index));
      }
    }

    prevBtn.addEventListener('click', () => { if (window.matchMedia('(max-width: 700px)').matches) { index--; update(); } });
    nextBtn.addEventListener('click', () => { if (window.matchMedia('(max-width: 700px)').matches) { index++; update(); } });

    let startX = 0; let isDown = false; let delta = 0;
    grid.addEventListener('touchstart', e => { startX = e.touches[0].clientX; isDown = true; delta = 0; }, {passive:true});
    grid.addEventListener('touchmove', e => { if(!isDown) return; delta = e.touches[0].clientX - startX; }, {passive:true});
    grid.addEventListener('touchend', () => {
      if (!isDown) return; isDown = false;
      if (Math.abs(delta) > 50) { index += delta < 0 ? 1 : -1; update(); }
    });

    window.addEventListener('resize', update);
    update();
    return update;
  }

  const carouselUpdaters = new Map();
  document.querySelectorAll('.project-section').forEach(section => {
    const updater = initCarousel(section);
    if (updater) carouselUpdaters.set(section, updater);
  });

  document.querySelectorAll('.project-section').forEach(section => {
    const buttons = section.querySelectorAll('.portfolio-filter');
    const cards = section.querySelectorAll('.project-card');
    const emptyMsg = section.querySelector('.no-projects-message');
    function applySectionFilter(category) {
      let visibleCount = 0;
      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        const show = category === 'all' || cat === category;
        card.style.display = show ? 'flex' : 'none';
        card.setAttribute('aria-hidden', show ? 'false' : 'true');
        if (show) visibleCount++;
      });
      if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
      const updater = carouselUpdaters.get(section);
      if (updater) updater();
    }
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected','true');
        applySectionFilter(btn.getAttribute('data-filter'));
      });
    });
    applySectionFilter('all');
  });
  
  const navbar = document.querySelector('.navbar');
  let navbarTop = 0;
  let spacer = null;

  function updateNavbarTop() {
    if (!navbar) return;
    const rect = navbar.getBoundingClientRect();
    navbarTop = window.pageYOffset + rect.top;
  }

  function handleStickyNavbar() {
    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    if (!navbar) return;

    if (!isMobile) {
      navbar.classList.remove('sticky');
      if (spacer) { spacer.remove(); spacer = null; }
      return;
    }

    if (window.pageYOffset > navbarTop) {
      if (!navbar.classList.contains('sticky')) {
        navbar.classList.add('sticky');
        if (!spacer) {
          spacer = document.createElement('div');
          spacer.className = 'navbar-spacer';
          spacer.style.height = navbar.offsetHeight + 'px';
          navbar.parentNode.insertBefore(spacer, navbar.nextSibling);
        } else {
          spacer.style.height = navbar.offsetHeight + 'px';
        }
      }
    } else {
      navbar.classList.remove('sticky');
      if (spacer) { spacer.remove(); spacer = null; }
    }
  }

  updateNavbarTop();
  handleStickyNavbar();
  window.addEventListener('scroll', handleStickyNavbar, { passive: true });
  window.addEventListener('resize', () => { updateNavbarTop(); handleStickyNavbar(); });

  const projectModal = document.getElementById('project-modal');
  const projectModalTitle = document.getElementById('project-modal-title');
  const projectGalleryImage = document.getElementById('project-gallery-image');
  const projectModalClose = projectModal ? projectModal.querySelector('.modal-close') : null;
  const projectModalOverlay = projectModal ? projectModal.querySelector('.modal-overlay') : null;
  const projectPrevBtn = projectModal ? projectModal.querySelector('.gallery-btn.prev') : null;
  const projectNextBtn = projectModal ? projectModal.querySelector('.gallery-btn.next') : null;

  let galleryImages = [];
  let galleryIndex = 0;

  function openProjectModal(card) {
    if (!projectModal) return;
    const title = card.getAttribute('data-title') || card.querySelector('.project-title')?.textContent || 'Project';
    const dates = card.getAttribute('data-dates') || '';
    const description = card.getAttribute('data-description') || card.querySelector('.project-description')?.textContent || '';
    const gallery = (card.getAttribute('data-gallery') || '').split(',').map(s => s.trim()).filter(Boolean);

    const skillsContainer = projectModal.querySelector('.project-skills');
    skillsContainer.innerHTML = '';
    const tags = card.querySelectorAll('.project-tags li');
    tags.forEach(tag => {
      const skillName = tag.getAttribute('data-skill') || tag.textContent.trim();
      const detail = tag.getAttribute('data-skill-detail') || '';
      const detailsEl = document.createElement('details');
      detailsEl.className = 'project-skill';
      const summaryEl = document.createElement('summary');
      summaryEl.textContent = skillName;
      detailsEl.appendChild(summaryEl);
      if (detail) {
        const p = document.createElement('p');
        p.textContent = detail;
        detailsEl.appendChild(p);
      }
      skillsContainer.appendChild(detailsEl);
    });

    projectModalTitle.textContent = title;
    projectModal.querySelector('.project-dates').textContent = dates;
    projectModal.querySelector('.project-description-text').textContent = description;

    galleryImages = gallery.length ? gallery : [card.querySelector('.project-media img')?.getAttribute('src')].filter(Boolean);
    galleryIndex = 0;
    updateProjectGallery();

    projectModal.classList.add('active');
    projectModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal() {
    if (!projectModal) return;
    projectModal.classList.remove('active');
    projectModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    projectGalleryImage.setAttribute('src', '');
    galleryImages = [];
    galleryIndex = 0;
  }

  function updateProjectGallery() {
    if (!projectGalleryImage || !galleryImages.length) return;
    const src = galleryImages[galleryIndex];
    projectGalleryImage.setAttribute('src', src);
    projectGalleryImage.setAttribute('alt', projectModalTitle.textContent + ' image ' + (galleryIndex + 1));
  }

  function nextImage() {
    if (!galleryImages.length) return;
    galleryIndex = (galleryIndex + 1) % galleryImages.length;
    updateProjectGallery();
  }
  
  function prevImage() {
    if (!galleryImages.length) return;
    galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
    updateProjectGallery();
  }

  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => openProjectModal(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProjectModal(card); }
    });
  });

  if (projectModalClose) projectModalClose.addEventListener('click', closeProjectModal);
  if (projectModalOverlay) projectModalOverlay.addEventListener('click', closeProjectModal);
  if (projectNextBtn) projectNextBtn.addEventListener('click', nextImage);
  if (projectPrevBtn) projectPrevBtn.addEventListener('click', prevImage);
});
