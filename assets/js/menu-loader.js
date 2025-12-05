// ===== MENU CONFIG LOADER =====
// Loads menu items from config/menu-config.json for easy editing

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
                extras: drink.extras.map(e => `<p>${e}</p>`).join('')
            };
        });

        // Render menu cards
        renderMenuCards();

        // Re-initialize drink card click handlers after rendering
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

    // Clear existing cards
    drinksScroll.innerHTML = '';

    // Render each drink from config
    menuConfig.drinks.forEach(drink => {
        const card = document.createElement('div');
        card.className = 'drink-card';
        card.setAttribute('data-drink', drink.id);

        const iconSvg = menuConfig.icons[drink.icon] || menuConfig.icons['surprise'];

        card.innerHTML = `
            <div class="drink-illustration">
                ${iconSvg}
            </div>
            <div class="drink-info">
                <div class="drink-name">${drink.name}</div>
                <div class="drink-desc">${drink.shortDesc}</div>
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

            if (window.setLiquidDrink) window.setLiquidDrink(drinkId);
            if (window.setSpiceColors) window.setSpiceColors(drinkId);
            if (window.setLogoColor) window.setLogoColor(drinkId);

            document.querySelectorAll('.drink-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            if (window.showDrinkDetail) window.showDrinkDetail(drinkId, card);
        });
    });
}

// Load menu config when DOM is ready
document.addEventListener('DOMContentLoaded', loadMenuConfig);
