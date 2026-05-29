// ===== EVENTS LOADER =====
// Renders event cards from config/events-config.json

async function loadEvents() {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;

    try {
        const response = await fetch('config/events-config.json');
        const data = await response.json();

        grid.innerHTML = '';

        data.events.forEach(event => {
            if (event.status === 'tbd') {
                const card = document.createElement('div');
                card.className = 'event-tbd';
                card.innerHTML = `
                    <h4>${event.title}</h4>
                    <p>${event.description}</p>
                `;
                grid.appendChild(card);
                return;
            }

            const card = document.createElement('div');
            card.className = 'event-card';

            let badgeHtml = '';
            if (event.badge) {
                badgeHtml = `<span class="event-badge">${event.badge}</span>`;
            }

            let rsvpHtml = '';
            if (event.rsvpUrl) {
                rsvpHtml = `<a href="${event.rsvpUrl}" target="_blank" rel="noopener noreferrer" class="submit-btn" style="width: auto; padding: 12px 24px; display: inline-block; text-decoration: none;">RSVP</a>`;
            }

            card.innerHTML = `
                ${badgeHtml}
                <h4>${event.title}</h4>
                <div class="event-details">
                    <strong>${event.date}</strong> &middot; ${event.time}
                </div>
                <p>${event.description}</p>
                ${rsvpHtml}
            `;

            grid.appendChild(card);
        });
    } catch (error) {
        console.log('Could not load events config');
    }
}

document.addEventListener('DOMContentLoaded', loadEvents);
