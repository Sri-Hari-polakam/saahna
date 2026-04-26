document.addEventListener('DOMContentLoaded', () => {
    // Hero Animations
    const heroTl = gsap.timeline();
    
    heroTl.from('.logo', {
        y: -20,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    })
    .from('.nav-links li', {
        y: -20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
    }, '-=0.5')
    .from('.hero-content h1', {
        x: -50,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out'
    }, '-=0.5')
    .from('.hero-content p', {
        x: -30,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    }, '-=0.8')
    .from('.hero-btns', {
        y: 20,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    }, '-=0.6')
    .from('.hero-image', {
        scale: 1.1,
        opacity: 0,
        duration: 1.5,
        ease: 'power2.out'
    }, '-=1.2');

    // Scroll Animations removed for performance

    // Hover Zoom Effect
    const cards = document.querySelectorAll('.category-card');
    cards.forEach(card => {
        const img = card.querySelector('.hover-zoom');
        card.addEventListener('mouseenter', () => {
            gsap.to(img, { scale: 1.1, duration: 0.6, ease: 'power2.out' });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(img, { scale: 1, duration: 0.6, ease: 'power2.out' });
        });
    });

    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (window.scrollY > 50) {
            nav.style.padding = '1rem 0';
            nav.style.boxShadow = '0 5px 20px rgba(0,0,0,0.05)';
        } else {
            nav.style.padding = '1.5rem 0';
            nav.style.boxShadow = 'none';
        }
    });
});
