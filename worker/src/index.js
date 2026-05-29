// ===== GRATIFIED API — CLOUDFLARE WORKER =====
// Handles Square API calls securely (access token never exposed to client)

const SQUARE_API_BASE = {
    sandbox: 'https://connect.squareupsandbox.com/v2',
    production: 'https://connect.squareup.com/v2'
};

// CORS headers for GitHub Pages origin
function corsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ['https://gratified.com', 'https://www.gratified.com', 'http://localhost:8000', 'http://127.0.0.1:8000'];

    return {
        'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

// Handle CORS preflight
function handleOptions(request) {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
    });
}

// Square API helper
async function squareFetch(env, path, options = {}) {
    const base = SQUARE_API_BASE[env.ENVIRONMENT] || SQUARE_API_BASE.sandbox;
    const response = await fetch(`${base}${path}`, {
        ...options,
        headers: {
            'Square-Version': '2024-01-18',
            'Authorization': `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    return response;
}

// GET /api/catalog — fetch menu items + prices from Square
async function handleCatalog(request, env) {
    try {
        const response = await squareFetch(env, '/catalog/list?types=ITEM');
        const data = await response.json();

        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch catalog' }), {
                status: 500,
                headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
            });
        }

        // Extract relevant fields
        const items = (data.objects || []).map(item => ({
            id: item.id,
            name: item.item_data?.name,
            description: item.item_data?.description,
            variations: (item.item_data?.variations || []).map(v => ({
                id: v.id,
                name: v.item_variation_data?.name,
                priceCents: v.item_variation_data?.price_money?.amount,
                currency: v.item_variation_data?.price_money?.currency,
            })),
        }));

        return new Response(JSON.stringify({ items }), {
            headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Catalog fetch failed' }), {
            status: 500,
            headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
        });
    }
}

// GET /api/timeslots — available pickup slots
function handleTimeslots(request) {
    // Business logic: generate 15-min slots for the next 3 hours
    const now = new Date();
    const slots = [];
    const start = new Date(now);
    start.setMinutes(Math.ceil((start.getMinutes() + 30) / 15) * 15, 0, 0);

    for (let i = 0; i < 12; i++) {
        const slot = new Date(start.getTime() + i * 15 * 60 * 1000);
        slots.push({
            time: slot.toISOString(),
            available: true,
        });
    }

    return new Response(JSON.stringify({ slots }), {
        headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
    });
}

// POST /api/order — create order + process payment
async function handleOrder(request, env) {
    try {
        const body = await request.json();
        const { sourceId, items, totalAmount, pickupTime, currency } = body;

        if (!sourceId || !items || !totalAmount) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
            });
        }

        const locationId = env.SQUARE_LOCATION_ID;
        const idempotencyKey = crypto.randomUUID();

        // Create order
        const orderResponse = await squareFetch(env, '/orders', {
            method: 'POST',
            body: JSON.stringify({
                idempotency_key: idempotencyKey + '-order',
                order: {
                    location_id: locationId,
                    line_items: items.map(item => ({
                        name: [item.name, item.size, item.milk].filter(Boolean).join(' — '),
                        quantity: '1',
                        base_price_money: {
                            amount: item.price,
                            currency: currency || 'USD',
                        },
                        note: item.addOns?.length > 0 ? `Add: ${item.addOns.join(', ')}` : undefined,
                    })),
                    fulfillments: pickupTime ? [{
                        type: 'PICKUP',
                        state: 'PROPOSED',
                        pickup_details: {
                            schedule_type: 'SCHEDULED',
                            pickup_at: pickupTime,
                        },
                    }] : undefined,
                },
            }),
        });

        const orderData = await orderResponse.json();
        if (!orderResponse.ok) {
            console.error('Order creation failed:', JSON.stringify(orderData));
            return new Response(JSON.stringify({ error: 'Failed to create order', details: orderData.errors }), {
                status: 500,
                headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
            });
        }

        const orderId = orderData.order?.id;

        // Process payment
        const paymentResponse = await squareFetch(env, '/payments', {
            method: 'POST',
            body: JSON.stringify({
                idempotency_key: idempotencyKey + '-payment',
                source_id: sourceId,
                amount_money: {
                    amount: totalAmount,
                    currency: currency || 'USD',
                },
                order_id: orderId,
                location_id: locationId,
            }),
        });

        const paymentData = await paymentResponse.json();
        if (!paymentResponse.ok) {
            console.error('Payment failed:', JSON.stringify(paymentData));
            return new Response(JSON.stringify({ error: 'Payment failed', details: paymentData.errors }), {
                status: 500,
                headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({
            success: true,
            orderId: orderId,
            paymentId: paymentData.payment?.id,
        }), {
            headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Order handler error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
        });
    }
}

// Router
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return handleOptions(request);
        }

        // Route requests
        if (path === '/api/catalog' && request.method === 'GET') {
            return handleCatalog(request, env);
        }

        if (path === '/api/timeslots' && request.method === 'GET') {
            return handleTimeslots(request);
        }

        if (path === '/api/order' && request.method === 'POST') {
            return handleOrder(request, env);
        }

        // Health check
        if (path === '/' || path === '/health') {
            return new Response(JSON.stringify({ status: 'ok', service: 'gratified-api' }), {
                headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
            });
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders(request) });
    },
};
