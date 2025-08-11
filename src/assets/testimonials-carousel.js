class TestimonialsCarousel extends HTMLElement {
  constructor() {
    super();
    this.currentSlide = 0;
    this.isTransitioning = false;
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  connectedCallback() {
    this.track = this.querySelector('[data-carousel-track]');
    this.slides = this.querySelectorAll('.testimonial-slide');
    this.prevButton = this.querySelector('[data-carousel-prev]');
    this.nextButton = this.querySelector('[data-carousel-next]');
    this.dots = this.querySelectorAll('[data-slide-to]');
    
    if (!this.track || this.slides.length <= 1) return;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateButtons();
    this.goToSlide(0);
  }

  setupEventListeners() {
    if (this.prevButton) {
      this.prevButton.addEventListener('click', () => this.previousSlide());
    }
    
    if (this.nextButton) {
      this.nextButton.addEventListener('click', () => this.nextSlide());
    }
    
    this.dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        const slideIndex = parseInt(e.currentTarget.dataset.slideTo);
        this.goToSlide(slideIndex);
      });
    });
    
    this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    this.track.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
    this.track.addEventListener('touchend', () => this.handleTouchEnd());
    
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    this.track.addEventListener('transitionend', () => {
      this.isTransitioning = false;
    });
  }

  handleKeydown(e) {
    if (!this.matches(':hover') && !this.matches(':focus-within')) return;
    
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.previousSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.nextSlide();
    }
  }

  handleTouchStart(e) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  handleTouchMove(e) {
    this.touchEndX = e.changedTouches[0].screenX;
  }

  handleTouchEnd() {
    if (!this.touchStartX || !this.touchEndX) return;
    
    const diff = this.touchStartX - this.touchEndX;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.previousSlide();
      }
    }
    
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  previousSlide() {
    if (this.currentSlide > 0) {
      this.goToSlide(this.currentSlide - 1);
    }
  }

  nextSlide() {
    if (this.currentSlide < this.slides.length - 1) {
      this.goToSlide(this.currentSlide + 1);
    }
  }

  goToSlide(slideIndex) {
    if (this.isTransitioning || slideIndex === this.currentSlide) return;
    
    this.isTransitioning = true;
    this.currentSlide = slideIndex;
    
    const translateX = -100 * slideIndex;
    this.track.style.transform = `translateX(${translateX}%)`;
    
    this.updateButtons();
    this.updateDots();
    this.updateAriaAttributes();
  }

  updateButtons() {
    if (this.prevButton) {
      this.prevButton.disabled = this.currentSlide === 0;
    }
    
    if (this.nextButton) {
      this.nextButton.disabled = this.currentSlide === this.slides.length - 1;
    }
  }

  updateDots() {
    this.dots.forEach((dot, index) => {
      if (index === this.currentSlide) {
        dot.classList.add('bg-[#0A3B60]');
        dot.classList.remove('bg-gray-300');
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.classList.remove('bg-[#0A3B60]');
        dot.classList.add('bg-gray-300');
        dot.removeAttribute('aria-current');
      }
    });
  }

  updateAriaAttributes() {
    this.slides.forEach((slide, index) => {
      if (index === this.currentSlide) {
        slide.setAttribute('aria-hidden', 'false');
        slide.removeAttribute('inert');
      } else {
        slide.setAttribute('aria-hidden', 'true');
        slide.setAttribute('inert', '');
      }
    });
  }
}

customElements.define('testimonials-carousel', TestimonialsCarousel);