const adminLogin = require('../../../netlify/functions/admin-login');
const applyCoupon = require('../../../netlify/functions/apply-coupon');
const createCoupon = require('../../../netlify/functions/create-coupon');
const createOrder = require('../../../netlify/functions/create-order');
const deleteCoupon = require('../../../netlify/functions/delete-coupon');
const getCoupons = require('../../../netlify/functions/get-coupons');
const getDashboard = require('../../../netlify/functions/get-dashboard');
const getInfluencerDetails = require('../../../netlify/functions/get-influencer-details');
const getInfluencers = require('../../../netlify/functions/get-influencers');
const getOrders = require('../../../netlify/functions/get-orders');
const payInfluencer = require('../../../netlify/functions/pay-influencer');
const registerUser = require('../../../netlify/functions/register-user');
const sendOtp = require('../../../netlify/functions/send-otp');
const sendMail = require('../../../netlify/functions/sendMail');
const updateCoupon = require('../../../netlify/functions/update-coupon');
const updateInfluencer = require('../../../netlify/functions/update-influencer');
const verifyOtp = require('../../../netlify/functions/verify-otp');
const verifyPayment = require('../../../netlify/functions/verify-payment');

const routes = {
    'admin-login': adminLogin,
    'apply-coupon': applyCoupon,
    'create-coupon': createCoupon,
    'create-order': createOrder,
    'delete-coupon': deleteCoupon,
    'get-coupons': getCoupons,
    'get-dashboard': getDashboard,
    'get-influencer-details': getInfluencerDetails,
    'get-influencers': getInfluencers,
    'get-orders': getOrders,
    'pay-influencer': payInfluencer,
    'register-user': registerUser,
    'send-otp': sendOtp,
    'sendMail': sendMail,
    'update-coupon': updateCoupon,
    'update-influencer': updateInfluencer,
    'verify-otp': verifyOtp,
    'verify-payment': verifyPayment
};

async function handleNetlifyRequest(context) {
    const { request, env, params } = context;
    const url = new URL(request.url);

    // Hydrate process.env with Cloudflare environment variables
    if (env && typeof env === 'object') {
        if (typeof process !== 'undefined' && process.env) {
            Object.assign(process.env, env);
        }
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

    const handlerModule = routes[routeName];
    if (!handlerModule) {
        return new Response(JSON.stringify({ error: `Netlify Function /.netlify/functions/${routeName || ''} not found` }), {
            status: 404,
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
