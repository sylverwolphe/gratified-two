// ===== MENU CONFIG LOADER =====
// Loads menu items from config/menu-config.json

let menuConfig = null;
let drinkDetails = {};

async function loadMenuConfig() {
    try {
        const response = await fetch('config/menu-config.json');
        menuConfig = await response.json();

        // Build drinkDetails object from config
        menuConfig.drinks.forEach(drink => {
            drinkDetails[drink.id] = {
                name: drink.name,
                desc: drink.fullDesc,
                extras: drink.extras.map(e => `<p>${e}</p>`).join(''),
                price: drink.price || null,
                sizes: drink.sizes || null,
                milkOptions: drink.milkOptions || null,
                addOns: drink.addOns || null
            };
        });

        renderMenuCards();
        initDrinkCardHandlers();

        return menuConfig;
    } catch (error) {
        console.error('Failed to load menu config:', error);
        return null;
    }
}

function renderMenuCards() {
    const drinksScroll = document.querySelector('.drinks-scroll');
    if (!drinksScroll || !menuConfig) return;

    drinksScroll.innerHTML = '';

    menuConfig.drinks.forEach(drink => {
        const card = document.createElement('div');
        card.className = 'drink-card';
        card.setAttribute('data-drink', drink.id);

        let illustrationContent;
        if (drink.image) {
            illustrationContent = `<img src="${drink.image}" alt="${drink.name}" class="drink-image" loading="lazy">`;
        } else {
            illustrationContent = `<div class="drink-icon-placeholder">${drink.name[0]}</div>`;
        }

        const priceDisplay = drink.price ? `<div class="drink-price">$${drink.price.toFixed(2)}</div>` : '';

        card.innerHTML = `
            <div class="drink-illustration">
                ${illustrationContent}
            </div>
            <div class="drink-info">
                <div class="drink-name">${drink.name}</div>
                <div class="drink-desc">${drink.shortDesc}</div>
                ${priceDisplay}
            </div>
        `;

        drinksScroll.appendChild(card);
    });
}

function initDrinkCardHandlers() {
    document.querySelectorAll('.drink-card[data-drink]').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const drinkId = card.dataset.drink;

            document.querySelectorAll('.drink-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            if (window.showDrinkDetail) window.showDrinkDetail(drinkId, card);
        });
    });
}

// Load menu config when DOM is ready
document.addEventListener('DOMContentLoaded', loadMenuConfig);
