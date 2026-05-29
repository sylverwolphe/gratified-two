// ===== SQUARE WEB PAYMENTS CLIENT =====
// Handles Square SDK initialization and payment tokenization
// The actual payment processing happens in the Cloudflare Worker

(function initSquareClient() {
    let squareConfig = null;
    let payments = null;
    let card = null;

    // Load Square config
    async function loadConfig() {
        try {
            const response = await fetch('config/square-config.json');
            squareConfig = await response.json();

            // Don't load SDK if config has placeholder values
            if (squareConfig.applicationId.startsWith('YOUR_')) {
                console.log('Square not configured — ordering will show fallback');
                return false;
            }
            return true;
        } catch (error) {
            console.log('Could not load Square config');
            return false;
        }
    }

    // Load Square Web Payments SDK
    async function loadSDK() {
        if (window.Square) return true;

        return new Promise((resolve) => {
            const script = document.createElement('script');
            const env = squareConfig.environment === 'production'
                ? 'https://web.squarecdn.com/v1/square.js'
                : 'https://sandbox.web.squarecdn.com/v1/square.js';
            script.src = env;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.head.appendChild(script);
        });
    }

    // Initialize payment form in #card-container
    async function initPayment() {
        const configLoaded = await loadConfig();
        if (!configLoaded) throw new Error('Square not configured');

        const sdkLoaded = await loadSDK();
        if (!sdkLoaded || !window.Square) throw new Error('Failed to load Square SDK');

        payments = window.Square.payments(squareConfig.applicationId, squareConfig.locationId);
        card = await payments.card();
        await card.attach('#card-container');

        return true;
    }

    // Tokenize card and send payment to worker
    async function processPayment(cartItems, totalAmount, pickupTime) {
        if (!card) throw new Error('Payment form not initialized');

        const result = await card.tokenize();
        if (result.status !== 'OK') {
            throw new Error(result.errors?.[0]?.message || 'Card tokenization failed');
        }

        const sourceId = result.token;

        // Send to Cloudflare Worker
        const response = await fetch(`${squareConfig.workerUrl}/api/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sourceId,
                items: cartItems.map(item => ({
                    name: item.name,
                    size: item.size,
                    milk: item.milk,
                    addOns: item.addOns,
                    price: Math.round(item.price * 100) // cents
                })),
                totalAmount: Math.round(totalAmount * 100), // cents
                pickupTime: pickupTime?.toISOString(),
                currency: 'USD'
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Payment failed');
        }

        return response.json();
    }

    window.squareClient = {
        initPayment,
        processPayment
    };
})();
