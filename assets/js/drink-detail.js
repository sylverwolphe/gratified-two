// ===== DRINK DETAIL VIEW =====
// Handles expanded drink view and menu slider

(function initDrinkDetailView() {
    const detailView = document.getElementById('drinkDetailView');
    const scrollWrapper = document.getElementById('menuScrollWrapper');
    const backButton = document.getElementById('drinkDetailBack');
    const detailIllustration = document.getElementById('drinkDetailIllustration');
    const detailName = document.getElementById('drinkDetailName');
    const detailDesc = document.getElementById('drinkDetailDesc');
    const detailExtras = document.getElementById('drinkDetailExtras');

    if (!detailView || !scrollWrapper || !backButton) return;

    // Show detail view for a drink
    window.showDrinkDetail = function(drinkId, cardElement) {
        const details = drinkDetails[drinkId];
        if (!details) return;

        // Copy the SVG from the card
        const svg = cardElement.querySelector('.drink-svg');
        if (svg) {
            detailIllustration.innerHTML = svg.outerHTML;
        }

        // Set the content
        detailName.textContent = details.name;
        detailDesc.textContent = details.desc;
        detailExtras.innerHTML = details.extras;

        // Hide scroll wrapper, show detail view
        scrollWrapper.classList.add('hidden');
        detailView.classList.add('active');

        // Trigger animation after display change
        requestAnimationFrame(() => {
            detailView.style.opacity = '1';
            detailView.style.transform = 'translateY(0)';
        });
    };

    // Hide detail view and show scroll menu
    window.hideDrinkDetail = function() {
        detailView.classList.remove('active');
        scrollWrapper.classList.remove('hidden');

        // Reset liquid shader and colors
        if (window.setLiquidDrink) setLiquidDrink('none');
        if (window.setSpiceColors) setSpiceColors('default');
        if (window.setLogoColor) setLogoColor('default');

        // Remove selected state from cards
        document.querySelectorAll('.drink-card').forEach(c => c.classList.remove('selected'));
    };

    // Back button handler
    backButton.addEventListener('click', (e) => {
        e.stopPropagation();
        hideDrinkDetail();
    });
})();

// ===== MENU SLIDER CONTROL =====
(function initMenuSlider() {
    const slider = document.getElementById('menuSlider');
    const scrollContainer = document.querySelector('.drinks-scroll');
    if (!slider || !scrollContainer) return;

    let isSliderActive = false;

    // Update slider when scrolling manually
    scrollContainer.addEventListener('scroll', () => {
        if (isSliderActive) return;
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        if (maxScroll > 0) {
            slider.value = (scrollContainer.scrollLeft / maxScroll) * 100;
        }
    });

    // Disable scroll-snap while dragging slider
    slider.addEventListener('mousedown', () => {
        isSliderActive = true;
        scrollContainer.style.scrollSnapType = 'none';
        scrollContainer.style.scrollBehavior = 'auto';
    });

    slider.addEventListener('touchstart', () => {
        isSliderActive = true;
        scrollContainer.style.scrollSnapType = 'none';
        scrollContainer.style.scrollBehavior = 'auto';
    }, { passive: true });

    // Re-enable scroll-snap when done
    const endSliderDrag = () => {
        if (!isSliderActive) return;
        isSliderActive = false;
        setTimeout(() => {
            scrollContainer.style.scrollSnapType = 'x mandatory';
            scrollContainer.style.scrollBehavior = 'smooth';
        }, 150);
    };

    window.addEventListener('mouseup', endSliderDrag);
    window.addEventListener('touchend', endSliderDrag);

    // Scroll when slider changes
    slider.addEventListener('input', () => {
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        scrollContainer.scrollLeft = (slider.value / 100) * maxScroll;
    });
})();
