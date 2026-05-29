// ===== SOCIAL LINKS LOADER =====
// Renders social link cards from config/socials-config.json

async function loadSocials() {
    const grid = document.getElementById('socialLinksGrid');
    if (!grid) return;

    try {
        const response = await fetch('config/socials-config.json');
        const data = await response.json();

        grid.innerHTML = '';

        data.socials.forEach(social => {
            const card = document.createElement('a');
            card.className = 'social-link-card';
            card.href = social.url;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.innerHTML = `
                <span class="social-platform">${social.platform}</span>
                <span class="social-handle">${social.handle}</span>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.log('Could not load social links config');
    }
}

document.addEventListener('DOMContentLoaded', loadSocials);
