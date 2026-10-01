/* Vanilla JS enhancement: content and navigation remain useful without it. */
"use strict";

const dialog = document.querySelector("#detail-dialog");
const content = document.querySelector("#dialog-content");
const dialogAction = dialog.querySelector("#dialog-action");
let opener = null;
let gallery = null;
let backdropPointer = false;

// One dialog lifecycle for projects and employment details. Native showModal()
// supplies focus trapping, an inert background, and Escape-to-close behavior.
function openDetails(button) {
  const template = document.getElementById(button.dataset.dialog);
  if (!(template instanceof HTMLTemplateElement)) return;

  opener = button;
  content.replaceChildren(template.content.cloneNode(true));
  const titleEl = content.querySelector("[data-dialog-title]");
  if (titleEl) titleEl.id = "dialog-title";
  gallery = createGallery(content.querySelector("[data-gallery]"));
  content.classList.toggle("project-details", Boolean(gallery));
  // Keep the project link in the sticky toolbar; employment needs only Close.
  const repository = content.querySelector("[data-repository]");
  dialogAction.replaceChildren(...(repository ? [repository] : []));
  dialog.showModal();
  document.body.classList.add("dialog-open");
  dialog.scrollTop = 0;
}

function closeDetails() {
  dialog.close();
}

function resetDialog() {
  document.body.classList.remove("dialog-open");
  content.classList.remove("project-details");
  content.replaceChildren();
  dialogAction.replaceChildren();
  gallery = null;
  opener?.focus({ preventScroll: true });
}

// One gallery template and a single index: arrows, slider, and keyboard stay in sync.
function createGallery(element) {
  if (!element) return null;
  const images = element.dataset.gallery
    .split(",")
    .map((path) => path.trim())
    .filter(Boolean);
  if (!images.length) return null;
  element.append(
    document.querySelector("#gallery-template").content.cloneNode(true),
  );
  const image = element.querySelector("img");
  const slider = element.querySelector("input");
  const counter = element.querySelector(".gallery-counter");
  const stage = element.querySelector(".gallery-stage");
  const title = content.querySelector("[data-dialog-title]")?.textContent || "Project";
  let index = 0;

  function show(value) {
    index = (value + images.length) % images.length;
    image.hidden = false;
    stage.querySelector(".gallery-error")?.remove();
    image.src = images[index];
    image.alt = `${title} - Screenshot ${index + 1} of ${images.length}`;
    slider.value = index + 1;
    slider.setAttribute(
      "aria-valuetext",
      `Screenshot ${index + 1} of ${images.length}`,
    );
    counter.textContent = `${index + 1} / ${images.length}`;
  }

  image.addEventListener("error", () => {
    image.hidden = true;
    if (stage.querySelector(".gallery-error")) return;
    const notice = document.createElement("p");
    notice.className = "gallery-error";
    notice.setAttribute("role", "status");
    notice.textContent =
      "This image could not load. Try another screenshot or view the repository.";
    stage.append(notice);
  });
  slider.max = images.length;
  slider.disabled = images.length < 2;
  slider.addEventListener("input", () => show(Number(slider.value) - 1));
  element.querySelectorAll("[data-gallery-step]").forEach((button) => {
    button.disabled = images.length < 2;
    button.addEventListener("click", () =>
      show(index + Number(button.dataset.galleryStep)),
    );
  });
  show(0);
  return { step: (offset) => show(index + offset) };
}

// Delegated controls also cover content cloned from templates.
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-dialog]");
  if (trigger) openDetails(trigger);
});
dialog.addEventListener("click", (event) => {
  if (event.target.closest("[data-close]")) closeDetails();
});

// Close only if a pointer gesture both starts and ends outside the panel.
function isBackdrop(event) {
  if (event.target !== dialog) return false;
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}
dialog.addEventListener("pointerdown", (event) => {
  backdropPointer = isBackdrop(event);
});
dialog.addEventListener("pointerup", (event) => {
  if (backdropPointer && isBackdrop(event)) closeDetails();
  backdropPointer = false;
});
dialog.addEventListener("pointercancel", () => {
  backdropPointer = false;
});
dialog.addEventListener("close", resetDialog);
dialog.addEventListener("keydown", (event) => {
  // The range input owns its native arrow-key behavior.
  if (event.target.matches("input") || !gallery) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    gallery.step(event.key === "ArrowLeft" ? -1 : 1);
  }
});

// Native anchors retain browser history and keyboard behavior. Their scroll margins
// center the actual content, excluding decorative space between sections.
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sections = navLinks.map(link => document.querySelector(link.hash));
const header = document.querySelector(".site-header");
const page = document.documentElement;

function contentBounds(section) {
  // Contact is a single card; its padding belongs to the visible component.
  if (section.id === "contact") return section.getBoundingClientRect();
  const blocks = [...section.children];
  // The recommendation follows Education in the markup but belongs to its view.
  if (section.id === "education" &&
      section.nextElementSibling?.matches(".credentials-row")) {
    blocks.push(section.nextElementSibling);
  }
  const boxes = blocks.map(child => child.getBoundingClientRect());
  const top = Math.min(...boxes.map(box => box.top));
  const bottom = Math.max(...boxes.map(box => box.bottom));
  return { top, bottom, height: bottom - top };
}

function updateLandings() {
  const headerBottom = parseFloat(getComputedStyle(header).top) + header.offsetHeight;
  const available = window.innerHeight - headerBottom;
  const targetTop = height => headerBottom + Math.max(16, (available - height) / 2);

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    const documentTop = rect.top + window.scrollY;
    if (section.id === "about") {
      // Native anchor scrolling lands at the document's top edge.
      section.style.scrollMarginTop = documentTop + "px";
    } else if (section.id === "contact") {
      // Land at the bottom edge without adding empty space below the footer.
      const bottom = Math.max(0, page.scrollHeight - window.innerHeight);
      section.style.scrollMarginTop = documentTop - bottom + "px";
    } else {
      const bounds = contentBounds(section);
      const paddingOffset = bounds.top - rect.top;
      section.style.scrollMarginTop = targetTop(bounds.height) - paddingOffset + "px";
    }
  });
}

let isScrolling = false;
let scrollTimeout;
function markSection(id) {
  navLinks.forEach(link => {
    if (link.hash === "#" + id) {
      link.setAttribute("aria-current", "location");
      
      // Center the active link in horizontally scrolling navs (e.g., mobile)
      const nav = link.closest(".site-nav");
      if (nav && nav.scrollWidth > nav.clientWidth) {
        const scrollLeft = link.offsetLeft - (nav.clientWidth / 2) + (link.clientWidth / 2);
        nav.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    } else {
      link.removeAttribute("aria-current");
    }
  });
}
navLinks.forEach(link =>
  link.addEventListener("click", () => {
    isScrolling = true;
    clearTimeout(scrollTimeout);
    markSection(link.hash.slice(1));
    
    // Use scrollend for precision, with a fallback timeout for older browsers
    const handleScrollEnd = () => {
      isScrolling = false;
      window.removeEventListener("scrollend", handleScrollEnd);
      clearTimeout(scrollTimeout);
    };
    window.addEventListener("scrollend", handleScrollEnd);
    scrollTimeout = setTimeout(handleScrollEnd, 1000);
  }),
);
if ("IntersectionObserver" in window) {
  const intersectingSections = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          intersectingSections.add(entry.target.id);
        } else {
          intersectingSections.delete(entry.target.id);
        }
      }
      if (!isScrolling) {
        // Find the deepest section in DOM order that is currently intersecting
        const activeSection = sections.slice().reverse().find(s => intersectingSections.has(s.id));
        if (activeSection) {
          markSection(activeSection.id);
        }
      }
    },
    { rootMargin: "-15% 0px -45% 0px" },
  );
  sections.forEach((section) => observer.observe(section));
}
function updateScrollY() {
  const target = document.body || document.documentElement;
  if (target) {
    target.style.setProperty('--scroll-y', `${window.scrollY}px`);
  }
}
updateScrollY();
document.addEventListener("DOMContentLoaded", updateScrollY, { passive: true });
window.addEventListener("scroll", () => {
  updateScrollY();
  if (isScrolling) return;
  if (window.scrollY <= 2) markSection("about");
  else if (window.scrollY + window.innerHeight >= page.scrollHeight - 2)
    markSection("contact");
}, { passive: true });
window.addEventListener("hashchange", () => {
  markSection(location.hash.slice(1));
  updateScrollY();
});
let landingFrame;
function scheduleLandings() {
  cancelAnimationFrame(landingFrame);
  landingFrame = requestAnimationFrame(() => {
    updateScrollY();
    updateLandings();
  });
}
window.addEventListener("resize", scheduleLandings, { passive: true });
if ("ResizeObserver" in window) {
  const observer = new ResizeObserver(scheduleLandings);
  [header, ...sections, document.querySelector(".credentials-row")]
    .filter(Boolean).forEach(element => observer.observe(element));
}
updateLandings();
window.addEventListener("load", () => {
  updateLandings();
  updateScrollY();
  const target = sections.find(section => "#" + section.id === location.hash);
  if (target) {
    target.scrollIntoView({ behavior: "instant", block: "start" });
    markSection(target.id);
    updateScrollY();
  }
});
document.querySelector("#current-year").textContent = new Date().getFullYear();
