const navbar = document.querySelector('nav');

let navOffset = navbar.offsetTop;

window.addEventListener('scroll', () => {
  if (window.scrollY > navOffset) {
    navbar.classList.add('sticky');
  } else {
    navbar.classList.remove('sticky');
  }
});