const routeLoaders = {
    'admin-login': () => require('../../../netlify/functions/admin-login'),
    'apply-coupon': () => require('../../../netlify/functions/apply-coupon'),
    'create-coupon': () => require('../../../netlify/functions/create-coupon'),
    'create-order': () => require('../../../netlify/functions/create-order'),
    'delete-coupon': () => require('../../../netlify/functions/delete-coupon'),
    'get-coupons': () => require('../../../netlify/functions/get-coupons'),
    'get-dashboard': () => require('../../../netlify/functions/get-dashboard'),
    'get-influencer-details': () => require('../../../netlify/functions/get-influencer-details'),
    'get-influencers': () => require('../../../netlify/functions/get-influencers'),
    'get-orders': () => require('../../../netlify/functions/get-orders'),
    'pay-influencer': () => require('../../../netlify/functions/pay-influencer'),
    'register-user': () => require('../../../netlify/functions/register-user'),
    'send-otp': () => require('../../../netlify/functions/send-otp'),
    'sendMail': () => require('../../../netlify/functions/sendMail'),
    'update-coupon': () => require('../../../netlify/functions/update-coupon'),
    'update-influencer': () => require('../../../netlify/functions/update-influencer'),
    'verify-otp': () => require('../../../netlify/functions/verify-otp'),
    'verify-payment': () => require('../../../netlify/functions/verify-payment')
};

async function handleNetlifyRequest(context) {
    const { request, env, params } = context;
    const url = new URL(request.url);

    // Hydrate process.env with Cloudflare environment variables BEFORE any handlers are loaded
    if (typeof process === 'undefined') {
        globalThis.process = { env: {} };
    } else if (!process.env) {
        process.env = {};
    }
    if (env && typeof env === 'object') {
        Object.assign(process.env, env);
    }

    // Handle OPTIONS CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    let routeName = '';
    if (params && params.path) {
        routeName = Array.isArray(params.path) ? params.path[0] : params.path;
    } else {
        const cleanPath = url.pathname.replace(/^\/\.netlify\/functions\/?/, '');
        routeName = cleanPath.split('/')[0];
    }

    const loader = routeLoaders[routeName];
    if (!loader) {
        return new Response(JSON.stringify({ error: `Netlify Function /.netlify/functions/${routeName || ''} not found` }), {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    let handlerModule;
    try {
        handlerModule = loader();
    } catch (loadErr) {
        console.error(`Error loading module for ${routeName}:`, loadErr);
        return new Response(JSON.stringify({ error: loadErr.message || 'Error loading handler' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    const handler = typeof handlerModule === 'function' ? handlerModule : (handlerModule.handler || handlerModule.default);

    // Build Netlify-compatible event object
    const queryStringParameters = {};
    for (const [key, value] of url.searchParams.entries()) {
        queryStringParameters[key] = value;
    }

    let body = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
            body = await request.text();
        } catch (e) {
            body = null;
        }
    }

    const event = {
        httpMethod: request.method,
        path: url.pathname,
        headers: Object.fromEntries(request.headers.entries()),
        queryStringParameters,
        body
    };

    try {
        const result = await handler(event, context);
        if (!result) {
            return new Response('', { status: 200 });
        }

        const statusCode = result.statusCode || 200;
        const responseHeaders = new Headers(result.headers || {});
        if (!responseHeaders.has('Access-Control-Allow-Origin')) {
            responseHeaders.set('Access-Control-Allow-Origin', '*');
        }

        let resBody = result.body;
        if (typeof resBody === 'object' && resBody !== null) {
            resBody = JSON.stringify(resBody);
        } else if (resBody === undefined || resBody === null) {
            resBody = '';
        }

        return new Response(resBody, {
            status: statusCode,
            headers: responseHeaders
        });
    } catch (err) {
        console.error(`Error executing function ${routeName}:`, err);
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

export async function onRequest(context) {
    return handleNetlifyRequest(context);
}
