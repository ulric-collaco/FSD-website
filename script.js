// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Carousel Logic
const productScroll = document.getElementById('product-carousel');
const leftBtn = document.getElementById('scroll-left');
const rightBtn = document.getElementById('scroll-right');

if (productScroll && leftBtn && rightBtn) {
    rightBtn.addEventListener('click', () => {
        productScroll.scrollBy({ left: 300, behavior: 'smooth' });
    });

    leftBtn.addEventListener('click', () => {
        productScroll.scrollBy({ left: -300, behavior: 'smooth' });
    });
}

// Scroll Reveal Animation
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.scroll-reveal').forEach(el => {
    observer.observe(el);
});

// Cart Interaction
const cartBtn = document.getElementById('cart-btn');
if (cartBtn) {
    cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Your cart is currently empty.');
    });
}
