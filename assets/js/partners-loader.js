// ===== PARTNER LOGOS LOADER =====
// Loads partner logos from partners/partners.json

async function loadPartnerLogos() {
    const container = document.getElementById('partnersLogos');
    if (!container) return;

    try {
        const response = await fetch('partners/partners.json');
        const data = await response.json();

        // Filter out the _readme entry and check if we have real partners
        const partners = data.partners.filter(p => p.logo && p.logo !== 'example-logo.png');

        if (partners.length === 0) {
            // Keep the placeholder if no partners
            return;
        }

        // Clear placeholder
        container.innerHTML = '';

        // Add each partner logo
        partners.forEach(partner => {
            const logoWrapper = document.createElement('a');
            logoWrapper.className = 'partner-logo';
            logoWrapper.title = partner.name;

            if (partner.url) {
                logoWrapper.href = partner.url;
                logoWrapper.target = '_blank';
                logoWrapper.rel = 'noopener noreferrer';
            } else {
                logoWrapper.style.cursor = 'default';
            }

            const img = document.createElement('img');
            img.src = `partners/${partner.logo}`;
            img.alt = partner.name;
            img.loading = 'lazy';

            logoWrapper.appendChild(img);
            container.appendChild(logoWrapper);
        });
    } catch (error) {
        console.log('No partner logos configured yet');
    }
}

document.addEventListener('DOMContentLoaded', loadPartnerLogos);
