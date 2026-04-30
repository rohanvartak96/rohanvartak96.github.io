// Navbar transparency on scroll
(function () {
    const nav = document.querySelector('.navbar-outer');
    if (!nav) return;
    function updateNav() {
        nav.classList.toggle('scrolled', window.scrollY > 20);
    }
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
})();

// Reveal sections on scroll
function reveal() {
    var reveals = document.querySelectorAll(".reveal");

    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        } else {
            reveals[i].classList.remove("active");
        }
    }
}

window.addEventListener("scroll", reveal);

// Trigger once on load
reveal();

// Active link highlighting
const navLinks = document.querySelectorAll("nav .right a[data-section]");

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            navLinks.forEach((link) => {
                link.classList.remove("active");
                if (link.getAttribute("data-section") === id) {
                    link.classList.add("active");
                }
            });
        }
    });
}, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });

document.querySelectorAll("section[id]").forEach((section) => {
    observer.observe(section);
});

// Dark mode toggle
(function () {
    const toggle = document.getElementById('dark-toggle');
    const icon = toggle ? toggle.querySelector('i') : null;
    const html = document.documentElement;

    function applyTheme(dark) {
        if (dark) {
            html.setAttribute('data-theme', 'dark');
            if (icon) { icon.classList.replace('fa-moon', 'fa-sun'); }
        } else {
            html.removeAttribute('data-theme');
            if (icon) { icon.classList.replace('fa-sun', 'fa-moon'); }
        }
    }

    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved ? saved === 'dark' : prefersDark);

    if (toggle) {
        toggle.addEventListener('click', () => {
            const isDark = html.getAttribute('data-theme') === 'dark';
            applyTheme(!isDark);
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
        });
    }
})();

// Back to top
(function () {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

// Flip Words Effect
document.addEventListener('DOMContentLoaded', () => {
    const flipWords = document.querySelectorAll('.flip-word');
    if (!flipWords.length) return;

    let current = 0;
    flipWords[current].classList.add('is-active');

    setInterval(() => {
        const prev = current;
        current = (current + 1) % flipWords.length;

        flipWords[prev].classList.remove('is-active');
        flipWords[prev].classList.add('is-exit');
        flipWords[current].classList.add('is-active');

        setTimeout(() => {
            flipWords[prev].classList.remove('is-exit');
        }, 600);
    }, 2500);
});


