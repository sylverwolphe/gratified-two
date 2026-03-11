// ===== CATERING SECTION LOADER =====
// Loads Moroccan catering content from config/catering-config.json

(function loadCateringContent() {
    fetch('config/catering-config.json')
        .then(response => response.json())
        .then(config => {
            renderCateringSection(config);
            attachRecipeToggles();
        })
        .catch(error => {
            console.error('Error loading catering config:', error);
        });

    function renderCateringSection(config) {
        const container = document.getElementById('catering');
        if (!container) return;

        let html = `
            <h3 class="section-title">${config.sectionTitle}</h3>
            <p class="section-intro">${config.sectionSubtitle}</p>
        `;

        config.categories.forEach(category => {
            if (category.type === 'coming-soon') {
                html += renderComingSoon(category);
            } else {
                html += renderCategory(category);
            }
        });

        container.innerHTML = html;
    }

    function renderCategory(category) {
        const pricingHtml = category.pricing
            ? `<div class="catering-pricing">${category.pricing} · ${category.minimum}</div>`
            : '';

        const itemsHtml = category.items.map(item => renderCard(item, category.id)).join('');

        return `
            <div class="catering-category" data-category="${category.id}">
                <h4 class="catering-category-title">${category.name}</h4>
                ${pricingHtml}
                <div class="catering-items-grid">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    function renderCard(item, categoryId) {
        const dishesHtml = item.dishes
            ? `<ul class="catering-dishes">${item.dishes.map(d => `<li>${d}</li>`).join('')}</ul>`
            : '';

        const ingredientsHtml = item.ingredients
            ? `<p class="catering-ingredients"><span class="catering-ingredients-label">Ingredients:</span> ${item.ingredients.join(', ')}</p>`
            : '';

        const recipeHtml = item.recipe
            ? `
                <button class="catering-recipe-toggle" aria-expanded="false">
                    <span class="catering-recipe-toggle-text">Recipe</span>
                    <span class="catering-recipe-toggle-icon">+</span>
                </button>
                <div class="catering-recipe" hidden>
                    <ol class="catering-recipe-steps">
                        ${item.recipe.steps.map(s => `<li>${s}</li>`).join('')}
                    </ol>
                </div>
            `
            : '';

        return `
            <div class="catering-card">
                <h5 class="catering-card-name">${item.name}</h5>
                <p class="catering-card-subtitle">${item.subtitle}</p>
                <p class="catering-card-desc">${item.description}</p>
                ${dishesHtml}
                ${ingredientsHtml}
                ${recipeHtml}
            </div>
        `;
    }

    function renderComingSoon(category) {
        return `
            <div class="catering-category" data-category="${category.id}">
                <h4 class="catering-category-title">${category.name}</h4>
                <div class="catering-teaser">
                    <span class="catering-teaser-badge">Coming Soon</span>
                    <p class="catering-teaser-text">${category.teaserText}</p>
                </div>
            </div>
        `;
    }

    function attachRecipeToggles() {
        document.getElementById('catering').addEventListener('click', function(e) {
            const toggle = e.target.closest('.catering-recipe-toggle');
            if (!toggle) return;

            const recipe = toggle.nextElementSibling;
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

            toggle.setAttribute('aria-expanded', !isExpanded);
            toggle.querySelector('.catering-recipe-toggle-icon').textContent = isExpanded ? '+' : '−';
            recipe.hidden = isExpanded;
        });
    }
})();
