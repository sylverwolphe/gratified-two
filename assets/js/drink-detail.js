// ===== IMAGE LIGHTBOX =====
// Full-size image viewer for drink images

(function initImageLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImage');
    const closeBtn = lightbox?.querySelector('.lightbox-close');

    if (!lightbox || !lightboxImg) return;

    window.openImageLightbox = function(src, alt) {
        lightboxImg.src = src;
        lightboxImg.alt = alt || '';
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeBtn?.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
})();

// ===== DRINK DETAIL VIEW =====
// Handles expanded drink view and menu slider

(function initDrinkDetailView() {
    const detailView = document.getElementById('drinkDetailView');
    const scrollWrapper = document.getElementById('menuScrollWrapper');
    const backButton = document.getElementById('drinkDetailBack');
    const prevButton = document.getElementById('drinkDetailPrev');
    const nextButton = document.getElementById('drinkDetailNext');
    const detailIllustration = document.getElementById('drinkDetailIllustration');
    const detailName = document.getElementById('drinkDetailName');
    const detailDesc = document.getElementById('drinkDetailDesc');
    const detailExtras = document.getElementById('drinkDetailExtras');

    if (!detailView || !scrollWrapper || !backButton) return;

    let currentDrinkIndex = 0;
    let drinkCards = [];

    function updateNavButtons() {
        if (prevButton) {
            prevButton.disabled = currentDrinkIndex <= 0;
        }
        if (nextButton) {
            nextButton.disabled = currentDrinkIndex >= drinkCards.length - 1;
        }
    }

    window.showDrinkDetail = function(drinkId, cardElement) {
        const details = drinkDetails[drinkId];
        if (!details) return;

        drinkCards = Array.from(document.querySelectorAll('.drink-card'));
        currentDrinkIndex = drinkCards.indexOf(cardElement);

        const img = cardElement.querySelector('.drink-image');
        if (img) {
            detailIllustration.innerHTML = img.outerHTML;
            const detailImg = detailIllustration.querySelector('.drink-image');
            if (detailImg) {
                detailImg.addEventListener('click', () => {
                    if (window.openImageLightbox) {
                        openImageLightbox(detailImg.src, detailImg.alt);
                    }
                });
            }
        } else {
            detailIllustration.innerHTML = `<div class="drink-icon-placeholder">${details.name[0]}</div>`;
        }

        detailName.textContent = details.name;
        detailDesc.textContent = details.desc;
        detailExtras.innerHTML = details.extras;

        // Add price display if available
        const existingPrice = detailView.querySelector('.drink-detail-price');
        if (existingPrice) existingPrice.remove();
        if (details.price) {
            const priceEl = document.createElement('div');
            priceEl.className = 'drink-detail-price';
            priceEl.textContent = `$${details.price.toFixed(2)}`;
            detailExtras.parentNode.insertBefore(priceEl, detailExtras.nextSibling);
        }

        // Add order button if ordering is available
        const existingOrderBtn = detailView.querySelector('.drink-detail-order-btn');
        if (existingOrderBtn) existingOrderBtn.remove();
        if (details.price && window.orderFlow) {
            const orderBtn = document.createElement('button');
            orderBtn.className = 'submit-btn drink-detail-order-btn';
            orderBtn.textContent = 'Order This';
            orderBtn.addEventListener('click', () => {
                window.orderFlow.startCustomize(drinkId);
            });
            const info = detailView.querySelector('.drink-detail-info');
            if (info) info.appendChild(orderBtn);
        }

        scrollWrapper.classList.add('hidden');
        detailView.classList.add('active');
        const cartBar = document.getElementById('orderCartBar');
        if (cartBar) cartBar.style.display = 'none';

        updateNavButtons();

        requestAnimationFrame(() => {
            detailView.style.opacity = '1';
            detailView.style.transform = 'translateY(0)';
        });
    };

    function navigateToDrink(index) {
        if (index < 0 || index >= drinkCards.length) return;

        const card = drinkCards[index];
        const drinkId = card.dataset.drink;

        drinkCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        currentDrinkIndex = index;
        const details = drinkDetails[drinkId];
        if (!details) return;

        const img = card.querySelector('.drink-image');
        if (img) {
            detailIllustration.innerHTML = img.outerHTML;
            const detailImg = detailIllustration.querySelector('.drink-image');
            if (detailImg) {
                detailImg.addEventListener('click', () => {
                    if (window.openImageLightbox) {
                        openImageLightbox(detailImg.src, detailImg.alt);
                    }
                });
            }
        } else {
            detailIllustration.innerHTML = `<div class="drink-icon-placeholder">${details.name[0]}</div>`;
        }

        detailName.textContent = details.name;
        detailDesc.textContent = details.desc;
        detailExtras.innerHTML = details.extras;

        // Update price
        const existingPrice = detailView.querySelector('.drink-detail-price');
        if (existingPrice) existingPrice.remove();
        if (details.price) {
            const priceEl = document.createElement('div');
            priceEl.className = 'drink-detail-price';
            priceEl.textContent = `$${details.price.toFixed(2)}`;
            detailExtras.parentNode.insertBefore(priceEl, detailExtras.nextSibling);
        }

        // Update order button
        const existingOrderBtn = detailView.querySelector('.drink-detail-order-btn');
        if (existingOrderBtn) existingOrderBtn.remove();
        if (details.price && window.orderFlow) {
            const orderBtn = document.createElement('button');
            orderBtn.className = 'submit-btn drink-detail-order-btn';
            orderBtn.textContent = 'Order This';
            orderBtn.addEventListener('click', () => {
                window.orderFlow.startCustomize(drinkId);
            });
            const info = detailView.querySelector('.drink-detail-info');
            if (info) info.appendChild(orderBtn);
        }

        updateNavButtons();
    }

    window.hideDrinkDetail = function() {
        detailView.classList.remove('active');
        scrollWrapper.classList.remove('hidden');

        // Show cart bar if there are items
        if (window.orderFlow && window.orderFlow.getCart().length > 0) {
            const cartBar = document.getElementById('orderCartBar');
            if (cartBar) cartBar.style.display = '';
        }

        document.querySelectorAll('.drink-card').forEach(c => c.classList.remove('selected'));
    };

    backButton.addEventListener('click', (e) => {
        e.stopPropagation();
        hideDrinkDetail();
    });

    if (prevButton) {
        prevButton.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateToDrink(currentDrinkIndex - 1);
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateToDrink(currentDrinkIndex + 1);
        });
    }

    document.addEventListener('keydown', (e) => {
        if (!detailView.classList.contains('active')) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateToDrink(currentDrinkIndex - 1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateToDrink(currentDrinkIndex + 1);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            hideDrinkDetail();
        }
    });
})();

// ===== MENU SLIDER CONTROL =====
(function initMenuSlider() {
    const slider = document.getElementById('menuSlider');
    const scrollContainer = document.querySelector('.drinks-scroll');
    if (!slider || !scrollContainer) return;

    let isSliderActive = false;

    scrollContainer.addEventListener('scroll', () => {
        if (isSliderActive) return;
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        if (maxScroll > 0) {
            slider.value = (scrollContainer.scrollLeft / maxScroll) * 100;
        }
    });

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

    slider.addEventListener('input', () => {
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        scrollContainer.scrollLeft = (slider.value / 100) * maxScroll;
    });
})();
