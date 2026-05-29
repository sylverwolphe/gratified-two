// ===== ORDER FLOW CONTROLLER =====
// Multi-step ordering UI: Browse → Customize → Timeslot → Pay → Confirm

(function initOrderFlow() {
    const cart = [];
    let currentDrinkId = null;
    let selectedSize = null;
    let selectedMilk = null;
    let selectedAddOns = [];

    // DOM references
    const menuWrapper = document.getElementById('menuScrollWrapper');
    const detailView = document.getElementById('drinkDetailView');
    const customizePanel = document.getElementById('orderCustomize');
    const timeslotPanel = document.getElementById('orderTimeslot');
    const paymentPanel = document.getElementById('orderPayment');
    const confirmPanel = document.getElementById('orderConfirmation');
    const cartBar = document.getElementById('orderCartBar');

    if (!customizePanel || !timeslotPanel || !paymentPanel || !confirmPanel) return;

    // Helper: hide all panels, show one
    function showPanel(panel) {
        [menuWrapper, detailView, customizePanel, timeslotPanel, paymentPanel, confirmPanel].forEach(p => {
            if (p) p.style.display = 'none';
        });
        if (detailView) detailView.classList.remove('active');
        if (menuWrapper) menuWrapper.classList.remove('hidden');
        if (panel) panel.style.display = '';
    }

    function showMenu() {
        [customizePanel, timeslotPanel, paymentPanel, confirmPanel].forEach(p => {
            if (p) p.style.display = 'none';
        });
        if (detailView) {
            detailView.classList.remove('active');
            detailView.style.display = '';
        }
        if (menuWrapper) {
            menuWrapper.classList.remove('hidden');
            menuWrapper.style.display = '';
        }
        updateCartBar();
    }

    // Calculate price for current customization
    function calculatePrice() {
        if (!currentDrinkId || !menuConfig) return 0;
        const drink = menuConfig.drinks.find(d => d.id === currentDrinkId);
        if (!drink) return 0;

        let price = drink.price || 0;

        // Size upcharge
        if (selectedSize && menuConfig.sizeUpcharges) {
            price += menuConfig.sizeUpcharges[selectedSize] || 0;
        }

        // Add-on prices
        if (menuConfig.addOnPrices) {
            selectedAddOns.forEach(addon => {
                price += menuConfig.addOnPrices[addon] || 0;
            });
        }

        return price;
    }

    // Update subtotal display
    function updateSubtotal() {
        const el = document.getElementById('orderSubtotal');
        if (el) {
            el.textContent = `$${calculatePrice().toFixed(2)}`;
        }
    }

    // Render option chips
    function renderChips(containerId, options, type) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        if (!options || options.length === 0) {
            container.parentElement.style.display = 'none';
            return;
        }
        container.parentElement.style.display = '';

        options.forEach(opt => {
            const chip = document.createElement('button');
            chip.className = 'option-chip';
            chip.type = 'button';

            let label = opt;
            let priceLabel = '';

            if (type === 'size' && menuConfig.sizeUpcharges) {
                const upcharge = menuConfig.sizeUpcharges[opt] || 0;
                if (upcharge > 0) priceLabel = `<span class="chip-price">+$${upcharge.toFixed(2)}</span>`;
            } else if (type === 'addon' && menuConfig.addOnPrices) {
                const price = menuConfig.addOnPrices[opt] || 0;
                if (price > 0) priceLabel = `<span class="chip-price">+$${price.toFixed(2)}</span>`;
            }

            chip.innerHTML = `${label}${priceLabel}`;
            chip.dataset.value = opt;

            chip.addEventListener('click', () => {
                if (type === 'size') {
                    selectedSize = opt;
                    container.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));
                    chip.classList.add('selected');
                } else if (type === 'milk') {
                    selectedMilk = opt;
                    container.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));
                    chip.classList.add('selected');
                } else if (type === 'addon') {
                    const idx = selectedAddOns.indexOf(opt);
                    if (idx >= 0) {
                        selectedAddOns.splice(idx, 1);
                        chip.classList.remove('selected');
                    } else {
                        selectedAddOns.push(opt);
                        chip.classList.add('selected');
                    }
                }
                updateSubtotal();
            });

            container.appendChild(chip);
        });
    }

    // Start customization for a drink
    function startCustomize(drinkId) {
        const drink = menuConfig?.drinks.find(d => d.id === drinkId);
        if (!drink || !drink.price) return;

        currentDrinkId = drinkId;
        selectedSize = drink.sizes?.[0] || null;
        selectedMilk = drink.milkOptions?.[0] || null;
        selectedAddOns = [];

        const nameEl = document.getElementById('orderDrinkName');
        if (nameEl) nameEl.textContent = drink.name;

        renderChips('sizeOptions', drink.sizes, 'size');
        renderChips('milkOptions', drink.milkOptions, 'milk');
        renderChips('addOnOptions', drink.addOns, 'addon');

        // Pre-select first size and milk
        const sizeChips = document.querySelectorAll('#sizeOptions .option-chip');
        if (sizeChips.length > 0) sizeChips[0].classList.add('selected');
        const milkChips = document.querySelectorAll('#milkOptions .option-chip');
        if (milkChips.length > 0) milkChips[0].classList.add('selected');

        updateSubtotal();
        showPanel(customizePanel);
    }

    // Add current customization to cart
    function addToCart() {
        if (!currentDrinkId || !menuConfig) return;
        const drink = menuConfig.drinks.find(d => d.id === currentDrinkId);
        if (!drink) return;

        cart.push({
            drinkId: currentDrinkId,
            name: drink.name,
            size: selectedSize,
            milk: selectedMilk,
            addOns: [...selectedAddOns],
            price: calculatePrice()
        });

        currentDrinkId = null;
        showMenu();
    }

    // Update cart bar display
    function updateCartBar() {
        if (!cartBar) return;
        if (cart.length === 0) {
            cartBar.style.display = 'none';
            return;
        }

        cartBar.style.display = '';
        const countEl = document.getElementById('orderCartCount');
        const totalEl = document.getElementById('orderCartTotal');
        if (countEl) countEl.textContent = `${cart.length} item${cart.length > 1 ? 's' : ''}`;
        if (totalEl) {
            const total = cart.reduce((sum, item) => sum + item.price, 0);
            totalEl.textContent = `$${total.toFixed(2)}`;
        }
    }

    // Generate timeslots (15-min increments for the next few hours)
    function generateTimeslots() {
        const grid = document.getElementById('timeslotGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const now = new Date();
        // Start from next 15-min increment + 30min lead time
        const start = new Date(now);
        start.setMinutes(Math.ceil((start.getMinutes() + 30) / 15) * 15, 0, 0);

        // Generate 3 hours of slots
        for (let i = 0; i < 12; i++) {
            const slot = new Date(start.getTime() + i * 15 * 60 * 1000);
            const hours = slot.getHours();
            const mins = slot.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

            const btn = document.createElement('button');
            btn.className = 'timeslot-btn';
            btn.type = 'button';
            btn.textContent = `${displayHour}:${mins} ${ampm}`;
            btn.dataset.time = slot.toISOString();

            btn.addEventListener('click', () => {
                grid.querySelectorAll('.timeslot-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                window._selectedTimeslot = slot;
                showPayment();
            });

            grid.appendChild(btn);
        }
    }

    // Show timeslot picker
    function showTimeslots() {
        generateTimeslots();
        showPanel(timeslotPanel);
    }

    // Show payment step
    function showPayment() {
        const summaryEl = document.getElementById('orderSummary');
        if (summaryEl) {
            const total = cart.reduce((sum, item) => sum + item.price, 0);
            const lines = cart.map(item => {
                let desc = `${item.name}`;
                if (item.size) desc += ` (${item.size})`;
                if (item.milk) desc += ` — ${item.milk} milk`;
                if (item.addOns.length > 0) desc += ` + ${item.addOns.join(', ')}`;
                desc += ` — $${item.price.toFixed(2)}`;
                return desc;
            });

            if (window._selectedTimeslot) {
                const t = window._selectedTimeslot;
                const hours = t.getHours();
                const mins = t.getMinutes().toString().padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                lines.push(`\nPickup: ${displayHour}:${mins} ${ampm}`);
            }

            lines.push(`\nTotal: $${total.toFixed(2)}`);
            summaryEl.textContent = lines.join('\n');
        }

        showPanel(paymentPanel);

        // Initialize Square payment if available
        if (window.squareClient && window.squareClient.initPayment) {
            window.squareClient.initPayment().then(() => {
                const payBtn = document.getElementById('payBtn');
                if (payBtn) payBtn.disabled = false;
            }).catch(() => {
                // Show fallback message
                const fallback = document.getElementById('orderFallbackMsg');
                if (fallback) fallback.style.display = '';
                const payBtn = document.getElementById('payBtn');
                if (payBtn) payBtn.style.display = 'none';
            });
        } else {
            // No Square client — show fallback
            const fallback = document.getElementById('orderFallbackMsg');
            if (fallback) fallback.style.display = '';
            const payBtn = document.getElementById('payBtn');
            if (payBtn) payBtn.style.display = 'none';
        }
    }

    // Show confirmation
    function showConfirmation(message) {
        const textEl = document.getElementById('orderConfirmationText');
        if (textEl) {
            textEl.textContent = message || 'Your order has been placed. See you soon!';
        }
        cart.length = 0;
        showPanel(confirmPanel);
    }

    // Wire up buttons
    const customizeBackBtn = document.getElementById('orderCustomizeBack');
    if (customizeBackBtn) {
        customizeBackBtn.addEventListener('click', () => {
            currentDrinkId = null;
            showMenu();
        });
    }

    const addToOrderBtn = document.getElementById('addToOrderBtn');
    if (addToOrderBtn) {
        addToOrderBtn.addEventListener('click', addToCart);
    }

    const cartBtn = document.getElementById('orderCartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', showTimeslots);
    }

    const timeslotBackBtn = document.getElementById('orderTimeslotBack');
    if (timeslotBackBtn) {
        timeslotBackBtn.addEventListener('click', showMenu);
    }

    const paymentBackBtn = document.getElementById('orderPaymentBack');
    if (paymentBackBtn) {
        paymentBackBtn.addEventListener('click', showTimeslots);
    }

    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
        payBtn.addEventListener('click', async () => {
            payBtn.disabled = true;
            payBtn.textContent = 'Processing...';

            try {
                if (window.squareClient && window.squareClient.processPayment) {
                    const total = cart.reduce((sum, item) => sum + item.price, 0);
                    await window.squareClient.processPayment(cart, total, window._selectedTimeslot);
                }
                showConfirmation();
            } catch (error) {
                console.error('Payment failed:', error);
                if (window.showNotification) {
                    showNotification('Payment failed. Please try again.', 'error');
                }
                payBtn.disabled = false;
                payBtn.textContent = 'Pay Now';
            }
        });
    }

    const newOrderBtn = document.getElementById('newOrderBtn');
    if (newOrderBtn) {
        newOrderBtn.addEventListener('click', showMenu);
    }

    // Expose for drink-detail.js
    window.orderFlow = {
        startCustomize,
        getCart: () => cart
    };
})();
