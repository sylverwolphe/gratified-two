// ===== MODALS, FORMS, AND UI COMPONENTS =====

// Team Section Toggle
function toggleTeam() {
    const content = document.getElementById('teamContent');
    const arrow = document.getElementById('teamToggle');
    content.classList.toggle('expanded');
    arrow.classList.toggle('expanded');
}

// Mobile Navbar - Scroll to Section
function scrollToSection(sectionId) {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
        const navbarHeight = 80;
        const sectionTop = section.offsetTop - 20;
        window.scrollTo({
            top: sectionTop,
            behavior: 'smooth'
        });

        if (sectionId === 'team') {
            const teamContent = document.getElementById('teamContent');
            if (!teamContent.classList.contains('expanded')) {
                toggleTeam();
            }
        }
    }
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modals when clicking outside
['hostModal', 'foodModal', 'artModal', 'teamModal', 'unlimitedModal', 'investorModal'].forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(modalId);
            }
        });
    }
});

// Google Forms submission configuration
const googleFormsConfig = {
    'hostForm': {
        formId: 'YOUR_HOST_FORM_ID',
        fields: {
            'name': 'entry.XXXXXXXXX',
            'email': 'entry.XXXXXXXXX',
            'spaceType': 'entry.XXXXXXXXX',
            'location': 'entry.XXXXXXXXX',
            'details': 'entry.XXXXXXXXX'
        },
        successMessage: 'hosting inquiry'
    },
    'foodForm': {
        formId: 'YOUR_FOOD_FORM_ID',
        fields: {
            'name': 'entry.XXXXXXXXX',
            'email': 'entry.XXXXXXXXX',
            'business': 'entry.XXXXXXXXX',
            'foodType': 'entry.XXXXXXXXX',
            'details': 'entry.XXXXXXXXX'
        },
        successMessage: 'food partnership inquiry'
    },
    'artForm': {
        formId: 'YOUR_ART_FORM_ID',
        fields: {
            'name': 'entry.XXXXXXXXX',
            'email': 'entry.XXXXXXXXX',
            'artType': 'entry.XXXXXXXXX',
            'portfolio': 'entry.XXXXXXXXX',
            'details': 'entry.XXXXXXXXX'
        },
        successMessage: 'art collaboration inquiry'
    },
    'teamForm': {
        formId: 'YOUR_TEAM_FORM_ID',
        fields: {
            'name': 'entry.XXXXXXXXX',
            'email': 'entry.XXXXXXXXX',
            'role': 'entry.XXXXXXXXX',
            'portfolio': 'entry.XXXXXXXXX',
            'details': 'entry.XXXXXXXXX'
        },
        successMessage: 'application'
    },
    'unlimitedForm': {
        formId: 'YOUR_UNLIMITED_FORM_ID',
        fields: {
            'name': 'entry.XXXXXXXXX',
            'email': 'entry.XXXXXXXXX',
            'phone': 'entry.XXXXXXXXX',
            'source': 'entry.XXXXXXXXX'
        },
        successMessage: 'unlimited membership signup'
    },
    'investorForm': {
        formId: 'YOUR_INVESTOR_FORM_ID',
        fields: {
            'name': 'entry.XXXXXXXXX',
            'email': 'entry.XXXXXXXXX',
            'phone': 'entry.XXXXXXXXX',
            'details': 'entry.XXXXXXXXX',
            'linkedin': 'entry.XXXXXXXXX'
        },
        successMessage: 'investor inquiry'
    }
};

// Submit form data to Google Forms via hidden iframe
function submitToGoogleForm(formId, formData) {
    const config = googleFormsConfig[formId];
    if (!config || config.formId.includes('YOUR_')) {
        console.log('Google Form not configured for:', formId, formData);
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = 'hidden_iframe_' + Date.now();
        document.body.appendChild(iframe);

        const submitForm = document.createElement('form');
        submitForm.target = iframe.name;
        submitForm.method = 'POST';
        submitForm.action = `https://docs.google.com/forms/d/e/${config.formId}/formResponse`;

        Object.keys(config.fields).forEach(fieldName => {
            if (formData[fieldName] !== undefined) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = config.fields[fieldName];
                input.value = formData[fieldName] || '';
                submitForm.appendChild(input);
            }
        });

        document.body.appendChild(submitForm);
        submitForm.submit();

        setTimeout(() => {
            document.body.removeChild(iframe);
            document.body.removeChild(submitForm);
            resolve();
        }, 1000);
    });
}

// Form submission handlers for all modals
Object.keys(googleFormsConfig).forEach(formId => {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            const config = googleFormsConfig[formId];
            const modalId = formId.replace('Form', 'Modal');

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            try {
                await submitToGoogleForm(formId, data);
                alert(`Thanks ${data.name}! We've received your ${config.successMessage}. We'll get back to you within a few days.`);
                closeModal(modalId);
                this.reset();
            } catch (error) {
                console.error('Form submission error:', error);
                alert('There was an error submitting the form. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

// Load Substack Posts
async function loadSubstackPosts() {
    try {
        const res = await fetch('/latest-posts.json');
        if (!res.ok) throw new Error('Network response not ok');

        const posts = await res.json();
        const ul = document.getElementById('substack-posts');
        ul.innerHTML = '';

        posts.forEach(post => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = post.link;
            a.textContent = post.title;
            a.target = '_blank';
            li.appendChild(a);
            ul.appendChild(li);
        });
    } catch (err) {
        console.error('Failed to load Substack posts:', err);
        const el = document.getElementById('substack-posts');
        if (el) el.innerHTML = '<li>Could not load posts.</li>';
    }
}

loadSubstackPosts();

// Dollar Ticker Class
class DollarTicker {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.currentValue = 0;
        this.targetValue = options.targetValue || 10000;
        this.duration = options.duration || 3000;
        this.hasStarted = false;

        this.render();
        this.setupIntersectionObserver();
    }

    formatNumber(num) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    render() {
        const formatted = this.formatNumber(this.currentValue);
        const chars = formatted.split('');

        this.container.innerHTML = '';
        chars.forEach((char) => {
            const digitDiv = document.createElement('div');
            if (char === ',' || char === '.') {
                digitDiv.className = 'ticker-digit separator';
                digitDiv.textContent = char;
            } else {
                digitDiv.className = 'ticker-digit';
                const wrapper = document.createElement('div');
                wrapper.className = 'digit-wrapper';
                wrapper.textContent = char;
                digitDiv.appendChild(wrapper);
            }
            this.container.appendChild(digitDiv);
        });
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasStarted) {
                    this.hasStarted = true;
                    this.animate();
                }
            });
        }, { threshold: 0.5 });

        observer.observe(this.container);
    }

    animate() {
        const startTime = Date.now();
        const startValue = this.currentValue;

        const step = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            const easeOutQuad = progress * (2 - progress);

            this.currentValue = startValue + (this.targetValue - startValue) * easeOutQuad;
            this.render();

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                this.currentValue = this.targetValue;
                this.render();
            }
        };

        requestAnimationFrame(step);
    }
}

// Initialize ticker
const ticker = new DollarTicker('ticker', {
    targetValue: 455,
    duration: 3000
});

// Project Modal Functions
function openProjectModal(projectData) {
    document.getElementById('projectTitle').textContent = projectData.title;
    document.getElementById('projectContent').innerHTML = projectData.content;
    document.getElementById('projectModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    if (projectData.title === 'Parallel') {
        modalCurrentSlide = 0;
        setTimeout(startModalSlideshow, 100);
    }
}

function closeProjectModal() {
    clearInterval(modalSlideInterval);
    document.getElementById('projectModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close project modal when clicking outside
const projectModalEl = document.getElementById('projectModal');
if (projectModalEl) {
    projectModalEl.addEventListener('click', function(e) {
        if (e.target === this) closeProjectModal();
    });
}

// Project data
const projects = {
    bayword: {
        title: 'Bay Word',
        content: `
            <div class="project-icon" style="color: #ff4444;">~!</div>
            <p style="color: var(--charcoal-ink); line-height: 1.8; margin-bottom: 15px;">
                bay word is for the soft voices that haven't congealed quite enough for established publications. currently online+paper - maybe letterpress someday? write something+say hi
            </p>
            <a href="https://bay-word.vercel.app" target="_blank"
               style="display: inline-block; padding: 12px 24px; background: var(--dusty-rose);
                      color: var(--cream-parchment); text-decoration: none; margin-top: 10px;">
                Visit Bay Word →
            </a>
        `
    },
    parallel: {
        title: 'Parallel',
        content: `
            <div class="modal-slideshow">
                <img src="https://i.imgur.com/qbQNpPI.jpeg" class="modal-slide active">
                <img src="https://i.imgur.com/bPDVrAB.jpeg" class="modal-slide">
                <img src="https://i.imgur.com/4hmZSXS.jpeg" class="modal-slide">
                <img src="https://i.imgur.com/eaj9SPD.png" class="modal-slide">
                <img src="https://i.imgur.com/KCsdU31.jpeg" class="modal-slide rotated">
                <div class="slideshow-dots">
                    <span class="dot active" onclick="goToSlide(0)"></span>
                    <span class="dot" onclick="goToSlide(1)"></span>
                    <span class="dot" onclick="goToSlide(2)"></span>
                    <span class="dot" onclick="goToSlide(3)"></span>
                    <span class="dot" onclick="goToSlide(4)"></span>
                </div>
            </div>
            <p style="color: var(--charcoal-ink); line-height: 1.8; margin-top: 20px;">
                Ren is working on a retro futuristic, urban exploration, myst-like, speculative fiction game. The next development update will be posted on Dec 1st; expect dynamic, behind-the-scenes visuals and atmospheric music.
            </p>
            <a href="https://substack.com/@gratifiedwegrow" target="_blank">
                <p style="color: var(--olive-bronze); font-style: italic;">Follow Gratified's Substack for game updates</p>
            </a>
        `
    },
    accumulate: {
        title: 'Accumulate Dollars',
        content: `
            <p style="color: var(--charcoal-ink); line-height: 1.8; margin-bottom: 15px;">
                Nat is currently working for a couple clients in east bay and san francisco, and seeking more! When not serving matchas at coworking spaces, she has big dreams about the ceiling for PA excellence, and would love to chat about your needs and goals.
            </p>
            <p style="color: var(--olive-bronze); font-style: italic;">
                Text/Signal Leah at 4703546184 for an introduction
            </p>
        `
    }
};

// Modal slideshow functionality
let modalCurrentSlide = 0;
let modalSlideInterval = null;

function startModalSlideshow() {
    const slides = document.querySelectorAll('.modal-slide');
    const dots = document.querySelectorAll('.slideshow-dots .dot');

    if (slides.length === 0) return;

    modalSlideInterval = setInterval(() => {
        slides[modalCurrentSlide].classList.remove('active');
        dots[modalCurrentSlide].classList.remove('active');

        modalCurrentSlide = (modalCurrentSlide + 1) % slides.length;

        slides[modalCurrentSlide].classList.add('active');
        dots[modalCurrentSlide].classList.add('active');
    }, 3000);
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.modal-slide');
    const dots = document.querySelectorAll('.slideshow-dots .dot');

    slides[modalCurrentSlide].classList.remove('active');
    dots[modalCurrentSlide].classList.remove('active');

    modalCurrentSlide = index;

    slides[modalCurrentSlide].classList.add('active');
    dots[modalCurrentSlide].classList.add('active');

    clearInterval(modalSlideInterval);
    startModalSlideshow();
}
