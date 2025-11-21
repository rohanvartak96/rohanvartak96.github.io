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
const sections = document.querySelectorAll("section");
const navLi = document.querySelectorAll("nav .right a");

window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - sectionHeight / 3) {
            current = section.getAttribute("id");
        }
    });

    navLi.forEach((li) => {
        li.classList.remove("active");
        if (li.getAttribute("href").includes(current)) {
            li.classList.add("active");
        }
    });
});

// Typewriter Effect
const words = ["Machine Learning Models", "Scalable Data Pipelines", "Product Insights", "AI Solutions"];
let i = 0;
let timer;

function typeWriter() {
    const heading = document.querySelector(".typewriter");
    if (!heading) return;

    const word = words[i];
    const speed = 100;
    const deleteSpeed = 50;
    const pause = 3000;

    let text = heading.textContent;

    if (!heading.classList.contains("deleting")) {
        // Typing
        heading.textContent = word.substring(0, text.length + 1);
        if (heading.textContent === word) {
            heading.classList.add("deleting");
            timer = setTimeout(typeWriter, pause);
        } else {
            timer = setTimeout(typeWriter, speed);
        }
    } else {
        // Deleting
        heading.textContent = word.substring(0, text.length - 1);
        if (heading.textContent === "") {
            heading.classList.remove("deleting");
            i = (i + 1) % words.length;
            timer = setTimeout(typeWriter, speed);
        } else {
            timer = setTimeout(typeWriter, deleteSpeed);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    typeWriter();
});


// PDF Viewer Logic
const pdfUrl = 'Rohan Vartak Resume.pdf';
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 3.0;
const canvas = document.getElementById('pdf-render');
const ctx = canvas.getContext('2d');
const zoomLevel = document.getElementById('zoom-level');

/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPage(num) {
    pageRendering = true;
    // Fetch page
    pdfDoc.getPage(num).then(function (page) {
        const viewport = page.getViewport({
            scale: scale
        });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        // Wait for render to finish
        renderTask.promise.then(function () {
            pageRendering = false;
            if (pageNumPending !== null) {
                // New page rendering is pending
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    // Update zoom level display
    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
}

/**
 * If another page rendering in progress, waits until the rendering is
 * finised. Otherwise, executes rendering immediately.
 */
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Zoom In
document.getElementById('pdf-zoom-in').addEventListener('click', () => {
    scale += 0.25;
    renderPage(pageNum);
});

// Zoom Out
document.getElementById('pdf-zoom-out').addEventListener('click', () => {
    if (scale <= 0.5) return;
    scale -= 0.25;
    renderPage(pageNum);
});

// Modal Logic
const modal = document.getElementById('pdf-modal');
const viewResumeBtn = document.getElementById('view-resume-btn');
const closeBtn = document.getElementById('pdf-close');

viewResumeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Load PDF if not already loaded
    if (!pdfDoc) {
        pdfjsLib.getDocument(pdfUrl).promise.then(function (pdfDoc_) {
            pdfDoc = pdfDoc_;
            renderPage(pageNum);
        }).catch(function (error) {
            console.error('Error loading PDF:', error);
            // Fallback: open in new tab if PDF.js fails
            window.open(pdfUrl, '_blank');
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
});

// Close modal when clicking outside content
modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('pdf-container')) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
});
