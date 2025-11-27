document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('contact-toggle');
  const contact = document.getElementById('contact-list');
  const sidebar = document.querySelector('.sidebar');
  const footer = document.querySelector('.sidebar-footer');

  if (toggle && contact && sidebar && footer) {
    const setOpen = (isOpen) => {
      contact.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
      contact.setAttribute('aria-hidden', !isOpen);
      toggle.textContent = isOpen ? 'Hide Contact Info' : 'Show Contact Info';
      if (sidebar.classList.contains('sidebar-compact')) {
        sidebar.classList.toggle('sidebar-scroll', isOpen);
        if (!isOpen) sidebar.scrollTop = 0;
      } else {
        sidebar.classList.remove('sidebar-scroll');
      }
    };

    const mq = window.matchMedia('(max-width: 700px)');

    const isOverlappingFooter = () => {
      if (!contact.classList.contains('open')) return false;
      const contactRect = contact.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      return contactRect.bottom > footerRect.top;
    };

    const isOverflowing = () => {
      const wasOpen = contact.classList.contains('open');
      contact.classList.add('open');
      contact.setAttribute('aria-hidden', 'false');
      const overflowing = sidebar.scrollHeight > window.innerHeight || isOverlappingFooter();
      if (!wasOpen) { contact.classList.remove('open'); contact.setAttribute('aria-hidden', 'true'); }
      return overflowing;
    };

    const evaluateCompact = () => {
      if (!sidebar) return;
      sidebar.classList.remove('sidebar-compact', 'sidebar-scroll');
      const isMobile = mq.matches;
      if (isMobile) { setOpen(false); return; }
      if (isOverflowing()) {
        sidebar.classList.add('sidebar-compact');
        setOpen(false);
      } else {
        setOpen(true);
      }
    };

    const handleMq = () => evaluateCompact();
    mq.addEventListener ? mq.addEventListener('change', handleMq) : mq.addListener(handleMq);
    window.addEventListener('resize', evaluateCompact);
    requestAnimationFrame(evaluateCompact);

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
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
    const linkToClick = Array.from(navLinks).find(link => link.getAttribute('data-page') === hash);
    if (linkToClick) linkToClick.click();
  }

  const modals = {
    cert: document.getElementById('cert-modal'),
    project: document.getElementById('project-modal')
  };

  class ImageModal {
    constructor(modalElement, imageViewerId) {
      this.modal = modalElement;
      this.imageViewer = document.getElementById(imageViewerId);
      this.zoomLevel = 1;
      this.translateX = 0;
      this.translateY = 0;
      this.isDragging = false;
      this.startX = 0;
      this.startY = 0;
      this.ZOOM_STEP = 0.1;
      this.MIN_ZOOM = 0.5;
      this.MAX_ZOOM = 3;
      this.INITIAL_FULLSCREEN_ZOOM = 0.75;
      this.initControls();
      this.initDragEvents();
    }

    initControls() {
      const fullscreenBtn = this.modal.querySelector('.fullscreen-btn');
      const zoomIn = this.modal.querySelector('.zoom-in');
      const zoomOut = this.modal.querySelector('.zoom-out');
      const zoomReset = this.modal.querySelector('.zoom-reset');
      // cache elements for grouping - try both locations for backwards compatibility
      this.controlsContainer = this.modal.querySelector('.cert-image-controls') || this.modal.querySelector('.project-gallery-controls') || this.modal.querySelector('.modal-header .modal-controls');
      this.closeBtn = this.modal.querySelector('.modal-header .modal-close');
      this.headerEl = this.modal.querySelector('.modal-header');

      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
          const isFullscreen = this.modal.classList.toggle('fullscreen');
          this.updateFullscreenIcon(isFullscreen);
          this.toggleZoomButtons(isFullscreen);
          this.updateControlGrouping(isFullscreen);
          if (isFullscreen) {
            // Start at 75% zoom when entering fullscreen
            this.zoomLevel = this.INITIAL_FULLSCREEN_ZOOM;
            this.translateX = 0;
            this.translateY = 0;
            this.updateTransform();
            // Update header height for controls positioning
            this.updateHeaderHeight();
            // Listen for resize to update header height dynamically
            window.addEventListener('resize', this.boundUpdateHeaderHeight = () => this.updateHeaderHeight());
          } else {
            this.reset();
            // Remove resize listener when exiting fullscreen
            if (this.boundUpdateHeaderHeight) {
              window.removeEventListener('resize', this.boundUpdateHeaderHeight);
              this.boundUpdateHeaderHeight = null;
            }
          }
        });
      }

      if (zoomIn) zoomIn.addEventListener('click', () => this.zoom(this.zoomLevel + this.ZOOM_STEP));
      if (zoomOut) zoomOut.addEventListener('click', () => this.zoom(this.zoomLevel - this.ZOOM_STEP));
      if (zoomReset) zoomReset.addEventListener('click', () => this.reset());

      // handle responsive regrouping on resize when fullscreen
      window.addEventListener('resize', () => {
        if (this.modal.classList.contains('fullscreen')) {
          this.updateControlGrouping(true);
        }
      });
    }

    updateControlGrouping(isFullscreen) {
      if (!this.controlsContainer || !this.closeBtn) return;
      const isDesktop = window.matchMedia('(min-width: 701px)').matches;
      // Only apply grouping logic if controls are in the header (for project modal)
      const isHeaderControls = this.controlsContainer.classList.contains('modal-controls');
      
      if (isFullscreen && isDesktop && isHeaderControls) {
        if (this.closeBtn.parentElement !== this.controlsContainer) {
          this.controlsContainer.appendChild(this.closeBtn);
        }
        this.controlsContainer.classList.add('grouped');
        // force top-right positioning overriding fullscreen CSS that moves to left
        Object.assign(this.controlsContainer.style, {
          left: 'auto',
          right: '8px',
          top: '8px',
          justifyContent: 'flex-end'
        });
        Object.assign(this.closeBtn.style, {
          position: 'static',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border-color)',
          width: '40px',
          height: '40px',
          fontSize: '1.75rem',
          color: 'var(--text-secondary)'
        });
      } else if (isHeaderControls) {
        // restore close button outside and default styles
        if (this.closeBtn.parentElement === this.controlsContainer) {
          this.headerEl.appendChild(this.closeBtn);
        }
        this.controlsContainer.classList.remove('grouped');
        // clear inline overrides so CSS rules apply normally
        Object.assign(this.controlsContainer.style, {
          left: '',
          right: '',
          top: '',
          justifyContent: ''
        });
        Object.assign(this.closeBtn.style, {
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'transparent',
          border: 'none',
          width: '36px',
          height: '36px',
          fontSize: '2rem'
        });
      }
      // For image-overlay controls (cert-image-controls, project-gallery-controls), 
      // no special grouping is needed - they stay in place
    }

    initDragEvents() {
      this.imageViewer.addEventListener('mousedown', (e) => {
        if (!this.modal.classList.contains('fullscreen')) return;
        this.isDragging = true;
        this.startX = e.clientX - this.translateX;
        this.startY = e.clientY - this.translateY;
        this.imageViewer.style.cursor = 'grabbing';
        e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => {
        if (!this.isDragging || !this.modal.classList.contains('fullscreen')) return;
        this.translateX = e.clientX - this.startX;
        this.translateY = e.clientY - this.startY;
        this.updateTransform();
      });

      document.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          if (this.modal.classList.contains('fullscreen')) {
            this.imageViewer.style.cursor = 'grab';
          }
        }
      });
    }

    zoom(newZoom) { this.zoomLevel = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, newZoom)); this.updateTransform(); }
    updateTransform() { this.imageViewer.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`; }
    reset() { this.zoomLevel = 1; this.translateX = 0; this.translateY = 0; this.imageViewer.style.transform = 'scale(1)'; this.imageViewer.style.cursor = 'grab'; }
    updateHeaderHeight() {
      if (this.modal.classList.contains('fullscreen') && this.headerEl) {
        const headerHeight = this.headerEl.offsetHeight;
        this.modal.style.setProperty('--header-height', `${headerHeight}px`);
      }
    }
    updateFullscreenIcon(isFullscreen) { const fullscreenBtn = this.modal.querySelector('.fullscreen-btn'); const enterIcon = fullscreenBtn.querySelector('.fullscreen-icon'); const exitIcon = fullscreenBtn.querySelector('.exit-fullscreen-icon'); enterIcon.style.display = isFullscreen ? 'none' : 'block'; exitIcon.style.display = isFullscreen ? 'block' : 'none'; }
    toggleZoomButtons(show) { const buttons = this.modal.querySelectorAll('.zoom-in, .zoom-out, .zoom-reset'); buttons.forEach(btn => btn.style.display = show ? 'flex' : 'none'); }
    close() { this.modal.classList.remove('active', 'fullscreen'); this.modal.setAttribute('aria-hidden', 'true'); this.imageViewer.setAttribute('src', ''); document.body.style.overflow = ''; this.reset(); this.updateFullscreenIcon(false); this.toggleZoomButtons(false); }
  }

  const certModal = new ImageModal(modals.cert, 'cert-image-viewer');
  const projectImageModal = modals.project ? new ImageModal(modals.project, 'project-gallery-image') : null;

  const openModal = (certName, imagePath, iconPath, isCertification, issuer, date) => {
    const modalTitle = document.getElementById('modal-title');
    const modalIssuer = document.getElementById('modal-issuer');
    const modalDate = document.getElementById('modal-date');
    const certIcon = modals.cert.querySelector('#cert-icon');
    modalTitle.textContent = certName;
    modalIssuer.textContent = issuer || '';
    modalDate.textContent = date || '';
    certModal.imageViewer.setAttribute('src', imagePath);
    certModal.imageViewer.setAttribute('alt', `${certName} Certification`);
    if (certIcon) {
      certIcon.classList.remove('recommender-photo');
      if (iconPath) {
        certIcon.setAttribute('src', iconPath);
        certIcon.setAttribute('alt', `${certName} icon`);
        certIcon.style.display = 'block';
        certIcon.classList.toggle('cert-type', isCertification);
        let providerUrl = '';
        if (isCertification) {
          const certItem = Array.from(document.querySelectorAll('.certification-item')).find(ci => ci.querySelector('.cert-icon img')?.getAttribute('src') === iconPath);
          providerUrl = certItem?.getAttribute('data-cert-url') || '';
        } else {
          const parentItem = document.querySelector(`.education-item[data-credential-image][data-school-url] .school-logo img[src="${iconPath}"]`)?.closest('.education-item');
          providerUrl = parentItem?.getAttribute('data-school-url') || '';
        }
        certIcon.style.cursor = providerUrl ? 'pointer' : '';
        certIcon.onclick = providerUrl ? () => window.open(providerUrl, '_blank', 'noopener') : null;
      } else {
        certIcon.style.display = 'none';
        certIcon.classList.remove('cert-type');
        certIcon.onclick = null;
        certIcon.style.cursor = '';
      }
    }
    modals.cert.classList.add('active');
    modals.cert.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const certificationItems = document.querySelectorAll('.certification-item[data-image]');
  certificationItems.forEach(item => {
    const openCert = () => {
      const imagePath = item.getAttribute('data-image');
      const certName = item.querySelector('.cert-name').textContent;
      const certIssuer = item.querySelector('.cert-issuer')?.textContent || '';
      const certDate = item.querySelector('.cert-date')?.textContent || '';
      const iconPath = item.querySelector('.cert-icon img')?.getAttribute('src');
      openModal(certName, imagePath, iconPath, true, certIssuer, certDate);
    };
    item.addEventListener('click', openCert);
    item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCert(); } });

    const certIconEl = item.querySelector('.cert-icon');
    const certUrl = item.getAttribute('data-cert-url');
    if (certIconEl) {
      certIconEl.style.cursor = 'pointer';
      certIconEl.addEventListener('click', (e) => { e.stopPropagation(); if (certUrl) window.open(certUrl, '_blank', 'noopener'); });
      certIconEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); if (certUrl) window.open(certUrl, '_blank', 'noopener'); } });
    }
  });

  const modalClose = modals.cert.querySelector('.modal-close');
  const modalOverlay = modals.cert.querySelector('.modal-overlay');
  if (modalClose) modalClose.addEventListener('click', () => certModal.close());
  if (modalOverlay) modalOverlay.addEventListener('click', () => certModal.close());

  const recommendationItems = document.querySelectorAll('.recommendation-item[data-letter-image]');
  recommendationItems.forEach(item => {
    const openLetter = () => {
      const imagePath = item.getAttribute('data-letter-image');
      const photoPath = item.getAttribute('data-recommender-photo');
      const recommenderName = item.getAttribute('data-recommender-name') || item.querySelector('.recommender-name')?.textContent || '';
      const relationship = item.getAttribute('data-recommender-relationship') || item.querySelector('.recommender-relationship')?.textContent || '';
      const date = item.getAttribute('data-recommendation-date') || item.querySelector('.recommendation-date')?.textContent || '';
      const recommenderUrl = item.getAttribute('data-recommender-url') || '';
      const modalTitle = document.getElementById('modal-title');
      const modalIssuer = document.getElementById('modal-issuer');
      const modalDate = document.getElementById('modal-date');
      const certIcon = modals.cert.querySelector('#cert-icon');
      modalTitle.textContent = `Recommendation from ${recommenderName}`;
      modalIssuer.textContent = relationship || '';
      modalDate.textContent = date || '';
      certModal.imageViewer.setAttribute('src', imagePath);
      certModal.imageViewer.setAttribute('alt', `${recommenderName} Recommendation Letter`);
      if (certIcon) {
        if (photoPath) {
          certIcon.setAttribute('src', photoPath);
          certIcon.setAttribute('alt', `Photo of ${recommenderName}`);
          certIcon.style.display = 'block';
          certIcon.classList.remove('cert-type');
          certIcon.classList.add('recommender-photo');
          certIcon.style.cursor = recommenderUrl ? 'pointer' : '';
          certIcon.onclick = recommenderUrl ? () => window.open(recommenderUrl, '_blank', 'noopener') : null;
        } else {
          certIcon.style.display = 'none';
          certIcon.classList.remove('cert-type', 'recommender-photo');
          certIcon.onclick = null;
          certIcon.style.cursor = '';
        }
      }
      modals.cert.classList.add('active');
      modals.cert.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    item.addEventListener('click', openLetter);
    item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLetter(); } });

    const recommenderPhotoEl = item.querySelector('.recommender-photo');
    const recommenderUrl = item.getAttribute('data-recommender-url');
    if (recommenderPhotoEl && recommenderUrl) {
      recommenderPhotoEl.style.cursor = 'pointer';
      recommenderPhotoEl.addEventListener('click', (e) => { e.stopPropagation(); window.open(recommenderUrl, '_blank', 'noopener'); });
      recommenderPhotoEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); window.open(recommenderUrl, '_blank', 'noopener'); } });
    }
  });

  const educationCredentialItems = document.querySelectorAll('.education-item[data-credential-image]');
  educationCredentialItems.forEach(item => {
    const degreeEl = item.querySelector('.degree');
    const title = degreeEl ? degreeEl.textContent : 'Credential';
    const institution = item.querySelector('.institution')?.textContent || '';
    const educationDate = item.querySelector('.education-date')?.textContent || '';
    const openCredential = () => {
      const imagePath = item.getAttribute('data-credential-image');
      if (imagePath) { 
        const iconPath = item.querySelector('.school-logo img')?.getAttribute('src'); 
        openModal(title, imagePath, iconPath, false, institution, educationDate); 
      }
    };

    const schoolUrl = item.getAttribute('data-school-url');
    const schoolLogo = item.querySelector('.school-logo');
    if (schoolLogo) {
      schoolLogo.style.cursor = 'pointer';
      schoolLogo.addEventListener('click', (e) => {
        e.stopPropagation();
        if (schoolUrl) window.open(schoolUrl, '_blank', 'noopener');
      });
      schoolLogo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          if (schoolUrl) window.open(schoolUrl, '_blank', 'noopener');
        }
      });
    }

    item.setAttribute('role', item.getAttribute('role') || 'button');
    item.setAttribute('tabindex', item.getAttribute('tabindex') || '0');
    item.addEventListener('click', openCredential);
    item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCredential(); } });
  });

  const initCarousel = (section) => {
    const grid = section.querySelector('.projects-carousel .projects-grid');
    const prevBtn = section.querySelector('.carousel-btn.prev');
    const nextBtn = section.querySelector('.carousel-btn.next');
    const dotsContainer = section.querySelector('.carousel-nav .carousel-dots');
    if (!grid || !prevBtn || !nextBtn) return;
    let index = 0;
    const getVisibleCards = () => Array.from(grid.querySelectorAll('.project-card')).filter(c => c.style.display !== 'none');
    const buildDots = (visibleCards) => {
      if (!dotsContainer) return; dotsContainer.innerHTML = '';
      visibleCards.forEach((_, i) => { const btn = document.createElement('button'); btn.type = 'button'; btn.className = `carousel-dot${i === index ? ' active' : ''}`; btn.setAttribute('aria-label', `Go to slide ${i + 1}`); btn.addEventListener('click', () => { index = i; update(); }); dotsContainer.appendChild(btn); });
    };
    const update = () => {
      const visibleCards = getVisibleCards(); const total = visibleCards.length; const carousel = section.querySelector('.projects-carousel'); const isMobile = window.matchMedia('(max-width: 700px)').matches;
      if (total === 0 || !isMobile) { prevBtn.classList.add('hidden'); nextBtn.classList.add('hidden'); if (dotsContainer) { dotsContainer.classList.add('hidden'); dotsContainer.innerHTML = ''; } if (carousel) carousel.style.paddingBottom = total === 0 || !isMobile ? '0px' : ''; if (!isMobile) { index = 0; grid.style.transform = ''; } return; }
      if (total === 1) { prevBtn.classList.add('hidden'); nextBtn.classList.add('hidden'); if (dotsContainer) dotsContainer.classList.add('hidden'); if (carousel) carousel.style.paddingBottom = '0px'; }
      else { prevBtn.classList.remove('hidden'); nextBtn.classList.remove('hidden'); if (dotsContainer) dotsContainer.classList.remove('hidden'); if (carousel) carousel.style.paddingBottom = ''; }
      index = ((index % total) + total) % total; const targetCard = visibleCards[index]; grid.scrollTo({ left: targetCard.offsetLeft, behavior: 'smooth' });
      if (total > 1) buildDots(visibleCards); if (dotsContainer) { dotsContainer.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === index)); }
    };
    prevBtn.addEventListener('click', () => { if (window.matchMedia('(max-width: 700px)').matches) { index--; update(); } });
    nextBtn.addEventListener('click', () => { if (window.matchMedia('(max-width: 700px)').matches) { index++; update(); } });
    let startX=0,isDown=false,delta=0; grid.addEventListener('touchstart', e => { startX = e.touches[0].clientX; isDown = true; delta = 0; }, { passive: true }); grid.addEventListener('touchmove', e => { if (isDown) delta = e.touches[0].clientX - startX; }, { passive: true }); grid.addEventListener('touchend', () => { if (isDown) { isDown=false; if (Math.abs(delta) > 50) { index += delta < 0 ? 1 : -1; update(); } } });
    window.addEventListener('resize', update); update(); return update;
  };

  const carouselUpdaters = new Map();
  document.querySelectorAll('.project-section').forEach(section => { const updater = initCarousel(section); if (updater) carouselUpdaters.set(section, updater); });

  document.querySelectorAll('.project-section').forEach(section => {
    const buttons = section.querySelectorAll('.portfolio-filter');
    const cards = section.querySelectorAll('.project-card');
    const emptyMsg = section.querySelector('.no-projects-message');
    const applySectionFilter = (category) => {
      let visibleCount = 0; cards.forEach(card => { const show = category === 'all' || card.getAttribute('data-category') === category; card.style.display = show ? 'flex' : 'none'; card.setAttribute('aria-hidden', !show); if (show) visibleCount++; });
      if (emptyMsg) emptyMsg.hidden = visibleCount !== 0; const updater = carouselUpdaters.get(section); if (updater) updater();
    };

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
  let navbarTop = 0; let spacer = null;
  const updateNavbarTop = () => { if (navbar) navbarTop = window.pageYOffset + navbar.getBoundingClientRect().top; };
  const handleStickyNavbar = () => {
    if (!navbar) return; const isMobile = window.matchMedia('(max-width: 700px)').matches;
    if (!isMobile) { navbar.classList.remove('sticky'); if (spacer) { spacer.remove(); spacer = null; } return; }
    if (window.pageYOffset > navbarTop) { if (!navbar.classList.contains('sticky')) { navbar.classList.add('sticky'); if (!spacer) { spacer = document.createElement('div'); spacer.className = 'navbar-spacer'; navbar.parentNode.insertBefore(spacer, navbar.nextSibling); } spacer.style.height = `${navbar.offsetHeight}px`; } }
    else { navbar.classList.remove('sticky'); if (spacer) { spacer.remove(); spacer = null; } }
  };
  updateNavbarTop(); handleStickyNavbar(); window.addEventListener('scroll', handleStickyNavbar, { passive: true }); window.addEventListener('resize', () => { updateNavbarTop(); handleStickyNavbar(); });

  const projectModal = modals.project; const projectModalTitle = document.getElementById('project-modal-title'); const projectGalleryImage = document.getElementById('project-gallery-image'); const projectModalClose = projectModal?.querySelector('.modal-close'); const projectModalOverlay = projectModal?.querySelector('.modal-overlay'); const projectPrevBtn = projectModal?.querySelector('.gallery-btn.prev'); const projectNextBtn = projectModal?.querySelector('.gallery-btn.next'); const projectModalGithub = projectModal?.querySelector('.project-modal-github');
  let galleryImages = []; let galleryIndex = 0;
  const openProjectModal = (card) => {
    if (!projectModal) return;
    if (projectImageModal) { projectImageModal.reset(); projectImageModal.updateFullscreenIcon(false); projectImageModal.toggleZoomButtons(false); }
    const title = card.getAttribute('data-title') || card.querySelector('.project-title')?.textContent || 'Project';
    const dates = card.getAttribute('data-dates') || '';
    // Prefer the visible card description; fall back to data attribute
    const description = card.querySelector('.project-description')?.textContent?.trim() || card.getAttribute('data-description') || '';
    const gallery = (card.getAttribute('data-gallery') || '').split(',').map(s => s.trim()).filter(Boolean);
    const typeBadge = card.querySelector('.project-type-badge')?.textContent || '';
    const skillsContainer = projectModal.querySelector('.project-skills'); skillsContainer.innerHTML = '';
    card.querySelectorAll('.project-tags li').forEach(tag => { const skillName = tag.getAttribute('data-skill') || tag.textContent.trim(); const detail = tag.getAttribute('data-skill-detail') || ''; const detailsEl = document.createElement('details'); detailsEl.className = 'project-skill'; const summaryEl = document.createElement('summary'); summaryEl.textContent = skillName; detailsEl.appendChild(summaryEl); if (detail) { const p = document.createElement('p'); p.textContent = detail; detailsEl.appendChild(p); } skillsContainer.appendChild(detailsEl); });
    if (projectModalGithub) { const cardRepoEl = card.querySelector('.project-github'); const repoHref = cardRepoEl?.getAttribute('href') || ''; if (repoHref) { projectModalGithub.href = repoHref; projectModalGithub.removeAttribute('hidden'); projectModalGithub.style.display = ''; } else { projectModalGithub.setAttribute('hidden', ''); projectModalGithub.removeAttribute('href'); } }
    projectModalTitle.textContent = title; projectModal.querySelector('.project-dates').textContent = dates; const typeBadgeModal = projectModal.querySelector('.project-type-badge'); if (typeBadgeModal) { if (typeBadge) { typeBadgeModal.textContent = typeBadge; typeBadgeModal.style.display = ''; } else { typeBadgeModal.style.display = 'none'; } }
    projectModal.querySelector('.project-description-text').textContent = description;
    galleryImages = gallery.length ? gallery : [card.querySelector('.project-media img')?.getAttribute('src')].filter(Boolean); galleryIndex = 0; updateProjectGallery();
    projectModal.classList.add('active'); projectModal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  };
  const closeProjectModal = () => { if (!projectModal) return; if (projectImageModal) projectImageModal.close(); projectModal.classList.remove('active'); projectModal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; projectGalleryImage.setAttribute('src', ''); galleryImages = []; galleryIndex = 0; };
  const updateProjectGallery = () => { if (!projectGalleryImage || !galleryImages.length) return; projectGalleryImage.setAttribute('src', galleryImages[galleryIndex]); projectGalleryImage.setAttribute('alt', `${projectModalTitle.textContent} image ${galleryIndex + 1}`); };
  const nextImage = () => { if (galleryImages.length) { galleryIndex = (galleryIndex + 1) % galleryImages.length; updateProjectGallery(); } };
  const prevImage = () => { if (galleryImages.length) { galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length; updateProjectGallery(); } };
  document.querySelectorAll('.project-card').forEach(card => { card.addEventListener('click', () => openProjectModal(card)); card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProjectModal(card); } }); });
  if (projectModalClose) projectModalClose.addEventListener('click', closeProjectModal);
  if (projectModalOverlay) projectModalOverlay.addEventListener('click', closeProjectModal);
  if (projectNextBtn) projectNextBtn.addEventListener('click', nextImage);
  if (projectPrevBtn) projectPrevBtn.addEventListener('click', prevImage);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (modals.cert.classList.contains('active')) certModal.close(); else if (projectModal?.classList.contains('active')) closeProjectModal(); } });
});
