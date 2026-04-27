document.addEventListener('DOMContentLoaded', () => {
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const openNewTab = (url) => {
    if (url) window.open(url, '_blank', 'noopener');
  };
  const setText = (element, value = '') => {
    if (element) element.textContent = value;
  };

  const modals = {
    cert: qs('#cert-modal'),
    project: qs('#project-modal'),
    experience: qs('#experience-modal')
  };

  const ACTIVATION_KEYS = ['Enter', ' '];
  const addActivationHandlers = (element, onActivate) => {
    if (!element || typeof onActivate !== 'function') return;
    element.addEventListener('click', onActivate);
    element.addEventListener('keydown', (event) => {
      if (ACTIVATION_KEYS.includes(event.key)) {
        event.preventDefault();
        onActivate();
      }
    });
  };

  const setModalHeaderIconLink = (iconEl, url) => {
    if (!iconEl) return;
    if (url) {
      iconEl.style.cursor = 'pointer';
      iconEl.setAttribute('role', 'button');
      iconEl.setAttribute('tabindex', '0');
      iconEl.onclick = () => openNewTab(url);
      iconEl.onkeydown = (event) => {
        if (ACTIVATION_KEYS.includes(event.key)) {
          event.preventDefault();
          openNewTab(url);
        }
      };
      return;
    }

    iconEl.style.cursor = '';
    iconEl.removeAttribute('role');
    iconEl.removeAttribute('tabindex');
    iconEl.onclick = null;
    iconEl.onkeydown = null;
  };

  class ImageModal {
    constructor(modalElement, imageViewerId) {
      this.modal = modalElement;
      this.imageViewer = document.getElementById(imageViewerId);
      this.modalBody = this.modal?.querySelector('.modal-body') || null;
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

      this.controlsContainer = this.modal.querySelector('.cert-image-controls')
        || this.modal.querySelector('.project-gallery-controls')
        || this.modal.querySelector('.modal-header .modal-controls');
      this.closeBtn = this.modal.querySelector('.modal-header .modal-close');
      this.headerEl = this.modal.querySelector('.modal-header');

      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
          const isFullscreen = this.modal.classList.toggle('fullscreen');
          this.updateFullscreenIcon(isFullscreen);
          this.toggleZoomButtons(isFullscreen);
          this.updateControlGrouping(isFullscreen);
          this.updateModalScrollBehavior();

          if (isFullscreen) {
            this.zoomLevel = this.INITIAL_FULLSCREEN_ZOOM;
            this.translateX = 0;
            this.translateY = 0;
            this.updateTransform();
            this.updateHeaderHeight();
            window.addEventListener('resize', this.boundUpdateHeaderHeight = () => this.updateHeaderHeight());
            return;
          }

          this.reset();
          if (this.boundUpdateHeaderHeight) {
            window.removeEventListener('resize', this.boundUpdateHeaderHeight);
            this.boundUpdateHeaderHeight = null;
          }
        });
      }

      if (zoomIn) zoomIn.addEventListener('click', () => this.zoom(this.zoomLevel + this.ZOOM_STEP));
      if (zoomOut) zoomOut.addEventListener('click', () => this.zoom(this.zoomLevel - this.ZOOM_STEP));
      if (zoomReset) zoomReset.addEventListener('click', () => this.reset());

      window.addEventListener('resize', () => {
        if (this.modal.classList.contains('fullscreen')) {
          this.updateControlGrouping(true);
        }
      });
    }

    updateControlGrouping(isFullscreen) {
      if (!this.controlsContainer || !this.closeBtn) return;

      const isDesktop = window.matchMedia('(min-width: 701px)').matches;
      const isHeaderControls = this.controlsContainer.classList.contains('modal-controls');

      if (isFullscreen && isDesktop && isHeaderControls) {
        if (this.closeBtn.parentElement !== this.controlsContainer) {
          this.controlsContainer.appendChild(this.closeBtn);
        }
        this.controlsContainer.classList.add('grouped');
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
        return;
      }

      if (isHeaderControls) {
        if (this.closeBtn.parentElement === this.controlsContainer) {
          this.headerEl.appendChild(this.closeBtn);
        }
        this.controlsContainer.classList.remove('grouped');
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
    }

    initDragEvents() {
      if (!this.imageViewer) return;

      this.imageViewer.addEventListener('mousedown', (event) => {
        if (!this.modal.classList.contains('fullscreen')) return;
        this.isDragging = true;
        this.startX = event.clientX - this.translateX;
        this.startY = event.clientY - this.translateY;
        this.imageViewer.style.cursor = 'grabbing';
        event.preventDefault();
      });

      document.addEventListener('mousemove', (event) => {
        if (!this.isDragging || !this.modal.classList.contains('fullscreen')) return;
        this.translateX = event.clientX - this.startX;
        this.translateY = event.clientY - this.startY;
        this.updateTransform();
      });

      document.addEventListener('mouseup', () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        if (this.modal.classList.contains('fullscreen')) {
          this.imageViewer.style.cursor = 'grab';
        }
      });
    }

    zoom(newZoom) {
      this.zoomLevel = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, newZoom));
      this.updateTransform();
      this.updateModalScrollBehavior();
    }

    updateTransform() {
      if (this.imageViewer) {
        this.imageViewer.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;
      }
    }

    reset() {
      this.zoomLevel = 1;
      this.translateX = 0;
      this.translateY = 0;
      if (this.imageViewer) {
        this.imageViewer.style.transform = 'scale(1)';
        this.imageViewer.style.cursor = 'grab';
      }
      this.updateModalScrollBehavior();
    }

    updateModalScrollBehavior() {
      if (!this.modalBody) return;
      const isFullscreen = this.modal.classList.contains('fullscreen');
      this.modalBody.style.overflow = (isFullscreen && this.zoomLevel > 1) ? 'auto' : 'hidden';
    }

    updateHeaderHeight() {
      if (this.modal.classList.contains('fullscreen') && this.headerEl) {
        const headerHeight = this.headerEl.offsetHeight;
        this.modal.style.setProperty('--header-height', `${headerHeight}px`);
      }
    }

    updateFullscreenIcon(isFullscreen) {
      const fullscreenBtn = this.modal.querySelector('.fullscreen-btn');
      if (!fullscreenBtn) return;
      const enterIcon = fullscreenBtn.querySelector('.fullscreen-icon');
      const exitIcon = fullscreenBtn.querySelector('.exit-fullscreen-icon');
      if (enterIcon) enterIcon.style.display = isFullscreen ? 'none' : 'block';
      if (exitIcon) exitIcon.style.display = isFullscreen ? 'block' : 'none';
    }

    toggleZoomButtons(show) {
      this.modal.querySelectorAll('.zoom-in, .zoom-out, .zoom-reset').forEach((btn) => {
        btn.style.display = show ? 'flex' : 'none';
      });
    }

    close() {
      this.modal.classList.remove('active', 'fullscreen');
      this.modal.setAttribute('aria-hidden', 'true');
      if (this.imageViewer) {
        this.imageViewer.setAttribute('src', '');
      }
      document.body.style.overflow = '';
      this.reset();
      if (this.modalBody) {
        this.modalBody.style.overflow = '';
      }
      this.updateFullscreenIcon(false);
      this.toggleZoomButtons(false);
    }
  }

  const certModal = modals.cert ? new ImageModal(modals.cert, 'cert-image-viewer') : null;
  const projectImageModal = modals.project ? new ImageModal(modals.project, 'project-gallery-image') : null;

  const initSidebarToggle = () => {
    const toggle = qs('#contact-toggle');
    const contact = qs('#contact-list');
    const sidebar = qs('.sidebar');
    const footer = qs('.sidebar-footer');

    if (!toggle || !contact || !sidebar || !footer) return;

    const setOpen = (isOpen) => {
      contact.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
      contact.setAttribute('aria-hidden', !isOpen);
      toggle.textContent = isOpen ? 'Hide Contact Info' : 'Show Contact Info';

      if (sidebar.classList.contains('sidebar-compact')) {
        sidebar.classList.toggle('sidebar-scroll', isOpen);
        if (!isOpen) sidebar.scrollTop = 0;
        return;
      }

      sidebar.classList.remove('sidebar-scroll');
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

      if (!wasOpen) {
        contact.classList.remove('open');
        contact.setAttribute('aria-hidden', 'true');
      }
      return overflowing;
    };

    const evaluateCompact = () => {
      sidebar.classList.remove('sidebar-compact', 'sidebar-scroll');
      const isMobile = mq.matches;

      if (isMobile) {
        setOpen(false);
        return;
      }
      if (isOverflowing()) {
        sidebar.classList.add('sidebar-compact');
        setOpen(false);
        return;
      }

      setOpen(true);
    };

    const handleMq = () => evaluateCompact();

    if (mq.addEventListener) {
      mq.addEventListener('change', handleMq);
    } else {
      mq.addListener(handleMq);
    }
    window.addEventListener('resize', evaluateCompact);
    requestAnimationFrame(evaluateCompact);

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  };

  const initNavigation = () => {
    const navLinks = qsa('.nav-link');
    const pages = qsa('.page');
    if (!navLinks.length) return;

    navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const targetPage = link.getAttribute('data-page');

        navLinks.forEach((navLink) => navLink.classList.remove('active'));
        link.classList.add('active');

        pages.forEach((page) => page.classList.remove('active'));
        const targetSection = document.getElementById(targetPage);
        if (targetSection) targetSection.classList.add('active');

        window.location.hash = targetPage;
      });
    });

    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
      const linkToClick = navLinks.find((link) => link.getAttribute('data-page') === hash);
      if (linkToClick) linkToClick.click();
    }
  };

  const openImageModal = ({
    title,
    issuer = '',
    date = '',
    imagePath = '',
    imageAlt = '',
    iconPath = '',
    iconAlt = '',
    iconClass = '',
    providerUrl = '',
    isCertification = false
  }) => {
    if (!modals.cert || !certModal) return;

    const modalTitle = qs('#modal-title');
    const modalIssuer = qs('#modal-issuer');
    const modalDate = qs('#modal-date');
    const certIcon = modals.cert.querySelector('#cert-icon');

    setText(modalTitle, title);
    setText(modalIssuer, issuer);
    setText(modalDate, date);

    if (certModal.imageViewer) {
      certModal.imageViewer.setAttribute('src', imagePath);
      certModal.imageViewer.setAttribute('alt', imageAlt || title);
    }

    if (certIcon) {
      certIcon.classList.remove('recommender-photo', 'cert-type');
      if (iconPath) {
        certIcon.setAttribute('src', iconPath);
        certIcon.setAttribute('alt', iconAlt || title);
        certIcon.style.display = 'block';
        if (iconClass) certIcon.classList.add(iconClass);
        if (isCertification) certIcon.classList.add('cert-type');
        setModalHeaderIconLink(certIcon, providerUrl);
      } else {
        certIcon.style.display = 'none';
        setModalHeaderIconLink(certIcon, '');
      }
    }

    modals.cert.classList.add('active');
    modals.cert.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const initCertifications = () => {
    qsa('.certification-item[data-image]').forEach((item) => {
      const openCert = () => {
        const imagePath = item.getAttribute('data-image');
        const certName = item.querySelector('.cert-name')?.textContent || 'Certification';
        const certIssuer = item.querySelector('.cert-issuer')?.textContent || '';
        const certDate = item.querySelector('.cert-date')?.textContent || '';
        const iconPath = item.querySelector('.cert-icon img')?.getAttribute('src') || '';
        const certUrl = item.querySelector('.cert-icon')?.getAttribute('href') || '';

        openImageModal({
          title: certName,
          issuer: certIssuer,
          date: certDate,
          imagePath,
          imageAlt: `${certName} Certification`,
          iconPath,
          iconAlt: `${certName} icon`,
          providerUrl: certUrl,
          isCertification: true
        });
      };

      addActivationHandlers(item, openCert);

      const certIconEl = item.querySelector('.cert-icon');
      const certUrl = item.getAttribute('data-cert-url');
      if (certIconEl) {
        certIconEl.style.cursor = 'pointer';
        certIconEl.addEventListener('click', (event) => {
          event.stopPropagation();
          openNewTab(certUrl);
        });
        certIconEl.addEventListener('keydown', (event) => {
          if (!ACTIVATION_KEYS.includes(event.key)) return;
          event.preventDefault();
          event.stopPropagation();
          openNewTab(certUrl);
        });
      }
    });

    if (!modals.cert || !certModal) return;
    const modalClose = modals.cert.querySelector('.modal-close');
    const modalOverlay = modals.cert.querySelector('.modal-overlay');
    if (modalClose) modalClose.addEventListener('click', () => certModal.close());
    if (modalOverlay) modalOverlay.addEventListener('click', () => certModal.close());
  };

  const initRecommendations = () => {
    qsa('.recommendation-item[data-letter-image]').forEach((item) => {
      const openLetter = () => {
        const imagePath = item.getAttribute('data-letter-image');
        const photoPath = item.getAttribute('data-recommender-photo');
        const recommenderName = item.getAttribute('data-recommender-name') || item.querySelector('.recommender-name')?.textContent || '';
        const relationship = item.getAttribute('data-recommender-relationship') || item.querySelector('.recommender-relationship')?.textContent || '';
        const date = item.getAttribute('data-recommendation-date') || item.querySelector('.recommendation-date')?.textContent || '';

        openImageModal({
          title: `Recommendation from ${recommenderName}`,
          issuer: relationship,
          date,
          imagePath,
          imageAlt: `${recommenderName} Recommendation Letter`,
          iconPath: photoPath,
          iconAlt: `Photo of ${recommenderName}`,
          iconClass: 'recommender-photo'
        });
      };

      addActivationHandlers(item, openLetter);

      const recommenderPhotoEl = item.querySelector('.recommender-photo');
      if (recommenderPhotoEl) {
        recommenderPhotoEl.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
        });
      }
    });
  };

  const initEducationCredentials = () => {
    qsa('.education-item[data-credential-image]').forEach((item) => {
      const degreeEl = item.querySelector('.degree');
      const title = degreeEl ? degreeEl.textContent : 'Credential';
      const institution = item.querySelector('.institution')?.textContent || '';
      const educationDate = item.querySelector('.education-date')?.textContent || '';

      const openCredential = () => {
        const imagePath = item.getAttribute('data-credential-image');
        if (!imagePath) return;
        const iconPath = item.querySelector('.school-logo img')?.getAttribute('src') || '';
        const schoolUrl = item.querySelector('.school-logo')?.getAttribute('href') || '';

        openImageModal({
          title,
          issuer: institution,
          date: educationDate,
          imagePath,
          imageAlt: title,
          iconPath,
          iconAlt: `${institution} logo`,
          providerUrl: schoolUrl
        });
      };

      const schoolUrl = item.getAttribute('data-school-url');
      const schoolLogo = item.querySelector('.school-logo');
      if (schoolLogo) {
        schoolLogo.style.cursor = 'pointer';
        schoolLogo.addEventListener('click', (event) => {
          event.stopPropagation();
          openNewTab(schoolUrl);
        });
        schoolLogo.addEventListener('keydown', (event) => {
          if (!ACTIVATION_KEYS.includes(event.key)) return;
          event.preventDefault();
          event.stopPropagation();
          openNewTab(schoolUrl);
        });
      }

      item.setAttribute('role', item.getAttribute('role') || 'button');
      item.setAttribute('tabindex', item.getAttribute('tabindex') || '0');
      addActivationHandlers(item, openCredential);
    });
  };

  const initCarousel = (section) => {
    const grid = section.querySelector('.projects-carousel .projects-grid');
    const prevBtn = section.querySelector('.carousel-btn.prev');
    const nextBtn = section.querySelector('.carousel-btn.next');
    const dotsContainer = section.querySelector('.carousel-nav .carousel-dots');

    if (!grid || !prevBtn || !nextBtn) return null;

    let index = 0;

    const getVisibleCards = () => Array.from(grid.querySelectorAll('.project-card'))
      .filter((card) => card.style.display !== 'none');

    const buildDots = (visibleCards) => {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      visibleCards.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `carousel-dot${i === index ? ' active' : ''}`;
        btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
        btn.addEventListener('click', () => {
          index = i;
          update();
        });
        dotsContainer.appendChild(btn);
      });
    };

    const update = () => {
      const visibleCards = getVisibleCards();
      const total = visibleCards.length;
      const carousel = section.querySelector('.projects-carousel');
      const isMobile = window.matchMedia('(max-width: 700px)').matches;

      if (total === 0 || !isMobile) {
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        if (dotsContainer) {
          dotsContainer.classList.add('hidden');
          dotsContainer.innerHTML = '';
        }
        if (carousel) carousel.style.paddingBottom = total === 0 || !isMobile ? '0px' : '';
        if (!isMobile) {
          index = 0;
          grid.style.transform = '';
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

      index = ((index % total) + total) % total;
      const targetCard = visibleCards[index];
      grid.scrollTo({ left: targetCard.offsetLeft, behavior: 'smooth' });

      if (total > 1) buildDots(visibleCards);
      if (dotsContainer) {
        dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
      }
    };

    prevBtn.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 700px)').matches) {
        index -= 1;
        update();
      }
    });

    nextBtn.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 700px)').matches) {
        index += 1;
        update();
      }
    });

    let startX = 0;
    let isDown = false;
    let delta = 0;

    grid.addEventListener('touchstart', (event) => {
      startX = event.touches[0].clientX;
      isDown = true;
      delta = 0;
    }, { passive: true });

    grid.addEventListener('touchmove', (event) => {
      if (isDown) delta = event.touches[0].clientX - startX;
    }, { passive: true });

    grid.addEventListener('touchend', () => {
      if (!isDown) return;
      isDown = false;
      if (Math.abs(delta) > 50) {
        index += delta < 0 ? 1 : -1;
        update();
      }
    });

    window.addEventListener('resize', update);
    update();
    return update;
  };

  const initCarousels = () => {
    const carouselUpdaters = new Map();
    qsa('.project-section').forEach((section) => {
      const updater = initCarousel(section);
      if (updater) carouselUpdaters.set(section, updater);
    });
    return carouselUpdaters;
  };

  const initPortfolioFilters = (carouselUpdaters) => {
    qsa('.project-section').forEach((section) => {
      const buttons = section.querySelectorAll('.portfolio-filter');
      const cards = section.querySelectorAll('.project-card');
      const emptyMsg = section.querySelector('.no-projects-message');

      const applySectionFilter = (category) => {
        let visibleCount = 0;
        cards.forEach((card) => {
          const show = category === 'all' || card.getAttribute('data-category') === category;
          card.style.display = show ? 'flex' : 'none';
          card.setAttribute('aria-hidden', !show);
          if (show) visibleCount += 1;
        });

        if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
        const updater = carouselUpdaters.get(section);
        if (updater) updater();
      };

      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          buttons.forEach((button) => {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          applySectionFilter(btn.getAttribute('data-filter'));
        });
      });

      applySectionFilter('all');
    });
  };

  const initStickyNavbar = () => {
    const navbar = qs('.navbar');
    let navbarTop = 0;
    let spacer = null;

    const updateNavbarTop = () => {
      if (navbar) navbarTop = window.pageYOffset + navbar.getBoundingClientRect().top;
    };

    const handleStickyNavbar = () => {
      if (!navbar) return;
      const isMobile = window.matchMedia('(max-width: 700px)').matches;

      if (!isMobile) {
        navbar.classList.remove('sticky');
        if (spacer) {
          spacer.remove();
          spacer = null;
        }
        return;
      }

      if (window.pageYOffset > navbarTop) {
        if (!navbar.classList.contains('sticky')) {
          navbar.classList.add('sticky');
          if (!spacer) {
            spacer = document.createElement('div');
            spacer.className = 'navbar-spacer';
            navbar.parentNode.insertBefore(spacer, navbar.nextSibling);
          }
          spacer.style.height = `${navbar.offsetHeight}px`;
        }
        return;
      }

      navbar.classList.remove('sticky');
      if (spacer) {
        spacer.remove();
        spacer = null;
      }
    };

    updateNavbarTop();
    handleStickyNavbar();
    window.addEventListener('scroll', handleStickyNavbar, { passive: true });
    window.addEventListener('resize', () => {
      updateNavbarTop();
      handleStickyNavbar();
    });
  };

  const initProjectModal = () => {
    const projectModal = modals.project;
    if (!projectModal) return null;
    const projectModalTitle = qs('#project-modal-title');
    const projectGalleryImage = qs('#project-gallery-image');
    const projectModalClose = projectModal.querySelector('.modal-close');
    const projectModalOverlay = projectModal.querySelector('.modal-overlay');
    const projectPrevBtn = projectModal.querySelector('.gallery-btn.prev');
    const projectNextBtn = projectModal.querySelector('.gallery-btn.next');
    const projectModalGithub = projectModal.querySelector('.project-modal-github');

    let galleryImages = [];
    let galleryIndex = 0;

    const updateProjectGallery = () => {
      if (!projectGalleryImage || !galleryImages.length) return;
      const title = projectModalTitle?.textContent || 'Project';
      projectGalleryImage.setAttribute('src', galleryImages[galleryIndex]);
      projectGalleryImage.setAttribute('alt', `${title} image ${galleryIndex + 1}`);
    };

    const nextImage = () => {
      if (!galleryImages.length) return;
      galleryIndex = (galleryIndex + 1) % galleryImages.length;
      updateProjectGallery();
    };

    const prevImage = () => {
      if (!galleryImages.length) return;
      galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
      updateProjectGallery();
    };

    const openProjectModal = (card) => {
      if (projectImageModal) {
        projectImageModal.reset();
        projectImageModal.updateFullscreenIcon(false);
        projectImageModal.toggleZoomButtons(false);
      }

      const title = card.querySelector('.project-title')?.textContent || 'Project';
      const dates = card.querySelector('.project-dates')?.textContent?.trim() || '';
      const description = card.querySelector('.project-description')?.textContent?.trim() || '';
      const gallery = (card.getAttribute('data-gallery') || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      const typeBadge = card.querySelector('.project-type-badge')?.textContent || '';
      const skillsContainer = projectModal.querySelector('.project-skills');

      if (skillsContainer) {
        skillsContainer.innerHTML = '';
        card.querySelectorAll('.project-tags li').forEach((tag) => {
          const skillName = tag.getAttribute('data-skill') || tag.textContent.trim();
          const detail = tag.getAttribute('data-skill-detail') || '';
          const detailsEl = document.createElement('details');
          detailsEl.className = 'project-skill';
          const summaryEl = document.createElement('summary');
          summaryEl.textContent = skillName;
          detailsEl.appendChild(summaryEl);

          if (detail) {
            const paragraph = document.createElement('p');
            paragraph.textContent = detail;
            detailsEl.appendChild(paragraph);
          }
          skillsContainer.appendChild(detailsEl);
        });
      }

      if (projectModalGithub) {
        const cardRepoEl = card.querySelector('.project-github');
        const repoHref = cardRepoEl?.getAttribute('href') || '';
        if (repoHref) {
          projectModalGithub.href = repoHref;
          projectModalGithub.removeAttribute('hidden');
          projectModalGithub.style.display = '';
        } else {
          projectModalGithub.setAttribute('hidden', '');
          projectModalGithub.removeAttribute('href');
        }
      }

      if (projectModalTitle) projectModalTitle.textContent = title;
      const projectDatesEl = projectModal.querySelector('.project-dates');
      if (projectDatesEl) projectDatesEl.textContent = dates;

      const typeBadgeModal = projectModal.querySelector('.project-type-badge');
      if (typeBadgeModal) {
        if (typeBadge) {
          typeBadgeModal.textContent = typeBadge;
          typeBadgeModal.style.display = '';
        } else {
          typeBadgeModal.style.display = 'none';
        }
      }

      const projectDescription = projectModal.querySelector('.project-description-text');
      if (projectDescription) projectDescription.textContent = description;

      galleryImages = gallery.length
        ? gallery
        : [card.querySelector('.project-media img')?.getAttribute('src')].filter(Boolean);
      galleryIndex = 0;
      updateProjectGallery();

      projectModal.classList.add('active');
      projectModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeProjectModal = () => {
      if (projectImageModal) projectImageModal.close();

      projectModal.classList.remove('active');
      projectModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (projectGalleryImage) projectGalleryImage.setAttribute('src', '');
      galleryImages = [];
      galleryIndex = 0;
    };

    qsa('.project-card').forEach((card) => {
      addActivationHandlers(card, () => openProjectModal(card));
    });

    if (projectModalClose) projectModalClose.addEventListener('click', closeProjectModal);
    if (projectModalOverlay) projectModalOverlay.addEventListener('click', closeProjectModal);
    if (projectNextBtn) projectNextBtn.addEventListener('click', nextImage);
    if (projectPrevBtn) projectPrevBtn.addEventListener('click', prevImage);

    return closeProjectModal;
  };

  const initExperienceModal = () => {
    const experienceModal = modals.experience;
    if (!experienceModal) return null;
    const experienceModalTitle = qs('#experience-modal-title');
    const experienceModalCompany = qs('#experience-modal-company');
    const experienceModalDate = qs('#experience-modal-date');
    const experienceCompanyLogo = qs('#experience-company-logo');
    const experienceRoleContext = qs('#experience-role-context');
    const experienceSupervisorName = qs('#experience-supervisor-name');
    const experienceSupervisorEmail = qs('#experience-supervisor-email');
    const experienceSupervisorPhone = qs('#experience-supervisor-phone');
    const experienceWorkLocation = qs('#experience-work-location');
    const experienceEmploymentType = qs('#experience-employment-type');
    const experienceReferenceNotes = qs('#experience-reference-notes');
    const experienceModalClose = experienceModal.querySelector('.modal-close');
    const experienceModalOverlay = experienceModal.querySelector('.modal-overlay');

    const isAvailableUponRequest = (value) => !value || value.trim().toLowerCase() === 'available upon request';

    const setExperienceContactValue = (element, value, prefix) => {
      if (!element) return;
      if (isAvailableUponRequest(value)) {
        element.textContent = 'Available upon request';
        element.removeAttribute('href');
        element.setAttribute('tabindex', '-1');
        element.classList.add('is-text-only');
        return;
      }

      element.textContent = value;
      element.setAttribute('href', `${prefix}${value}`);
      element.removeAttribute('tabindex');
      element.classList.remove('is-text-only');
    };

    const openExperienceModal = (item) => {
      const jobTitle = item.querySelector('.job-title')?.textContent || 'Role';
      const companyName = item.querySelector('.company-name')?.textContent || 'Employer';
      const experienceDate = item.querySelector('.experience-date')?.textContent || '';
      const companyLogoSrc = item.querySelector('.company-logo img')?.getAttribute('src') || '';
      const companyLogoAlt = item.querySelector('.company-logo img')?.getAttribute('alt') || `${companyName} logo`;
      const companyUrl = item.querySelector('.company-logo')?.getAttribute('href') || '';
      const supervisorName = item.getAttribute('data-supervisor-name') || 'Available upon request';
      const supervisorEmail = item.getAttribute('data-supervisor-email') || 'Available upon request';
      const supervisorPhone = item.getAttribute('data-supervisor-phone') || 'Available upon request';
      const workLocation = item.getAttribute('data-work-location') || 'Not provided';
      const employmentType = item.getAttribute('data-employment-type') || 'Not provided';
      const referenceNotes = item.getAttribute('data-reference-notes') || '';

      if (experienceModalTitle) experienceModalTitle.textContent = 'Employer Information';
      if (experienceModalCompany) experienceModalCompany.textContent = companyName;
      if (experienceModalDate) experienceModalDate.textContent = experienceDate;

      if (experienceCompanyLogo) {
        if (companyLogoSrc) {
          experienceCompanyLogo.setAttribute('src', companyLogoSrc);
          experienceCompanyLogo.setAttribute('alt', companyLogoAlt);
          experienceCompanyLogo.style.display = 'block';
          setModalHeaderIconLink(experienceCompanyLogo, companyUrl);
        } else {
          experienceCompanyLogo.setAttribute('src', '');
          experienceCompanyLogo.setAttribute('alt', '');
          experienceCompanyLogo.style.display = 'none';
          setModalHeaderIconLink(experienceCompanyLogo, '');
        }
      }

      if (experienceRoleContext) experienceRoleContext.textContent = jobTitle;
      if (experienceSupervisorName) experienceSupervisorName.textContent = supervisorName;
      setExperienceContactValue(experienceSupervisorEmail, supervisorEmail, 'mailto:');
      setExperienceContactValue(experienceSupervisorPhone, supervisorPhone, 'tel:');
      if (experienceWorkLocation) experienceWorkLocation.textContent = workLocation;
      if (experienceEmploymentType) experienceEmploymentType.textContent = employmentType;
      if (experienceReferenceNotes) experienceReferenceNotes.textContent = referenceNotes;

      experienceModal.classList.add('active');
      experienceModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeExperienceModal = () => {
      experienceModal.classList.remove('active');
      experienceModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    qsa('.experience-item').forEach((item) => {
      addActivationHandlers(item, () => openExperienceModal(item));

      const companyLogo = item.querySelector('.company-logo');
      if (companyLogo) {
        companyLogo.addEventListener('click', (event) => event.stopPropagation());
        companyLogo.addEventListener('keydown', (event) => {
          if (ACTIVATION_KEYS.includes(event.key)) {
            event.stopPropagation();
          }
        });
      }
    });

    if (experienceModalClose) experienceModalClose.addEventListener('click', closeExperienceModal);
    if (experienceModalOverlay) experienceModalOverlay.addEventListener('click', closeExperienceModal);

    return closeExperienceModal;
  };

  const initEscapeHandler = (closeProjectModal, closeExperienceModal) => {
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (modals.cert?.classList.contains('active')) {
        certModal?.close();
      } else if (modals.project?.classList.contains('active')) {
        if (closeProjectModal) closeProjectModal();
      } else if (modals.experience?.classList.contains('active')) {
        if (closeExperienceModal) closeExperienceModal();
      }
    });
  };

  initSidebarToggle();
  initNavigation();
  initCertifications();
  initRecommendations();
  initEducationCredentials();
  const carouselUpdaters = initCarousels();
  initPortfolioFilters(carouselUpdaters);
  initStickyNavbar();
  const closeProjectModal = initProjectModal();
  const closeExperienceModal = initExperienceModal();
  initEscapeHandler(closeProjectModal, closeExperienceModal);
});