/**
 * Advanced Cloudflare Worker for Split Testing with Shopify
 * Features: KV storage, Durable Objects, advanced analytics, multivariate testing
 */

// Durable Object for maintaining test state and analytics
export class SplitTestState {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method;

    // Handle different endpoints
    switch (url.pathname) {
      case '/assign':
        return this.handleAssignment(request);
      case '/track':
        return this.handleTracking(request);
      case '/report':
        return this.handleReport(request);
      case '/reset':
        return this.handleReset(request);
      default:
        return new Response('Not Found', { status: 404 });
    }
  }

  async handleAssignment(request) {
    const data = await request.json();
    const { testId, userId } = data;
    
    // Get or create assignment
    const key = `assignment:${testId}:${userId}`;
    let assignment = await this.state.storage.get(key);
    
    if (!assignment) {
      // Create new assignment
      assignment = await this.assignVariant(testId);
      await this.state.storage.put(key, assignment);
      
      // Track assignment
      await this.incrementCounter(`${testId}:${assignment}:assignments`);
    }
    
    return Response.json({ variant: assignment });
  }

  async handleTracking(request) {
    const data = await request.json();
    const { testId, variant, event, value } = data;
    
    // Track event
    const eventKey = `${testId}:${variant}:${event}`;
    await this.incrementCounter(eventKey, value || 1);
    
    // Track timestamp
    const timestampKey = `${testId}:${variant}:last_event`;
    await this.state.storage.put(timestampKey, Date.now());
    
    return Response.json({ success: true });
  }

  async handleReport(request) {
    const url = new URL(request.url);
    const testId = url.searchParams.get('testId');
    
    // Get all data for test
    const data = {};
    const list = await this.state.storage.list({ prefix: `${testId}:` });
    
    for (const [key, value] of list) {
      data[key] = value;
    }
    
    return Response.json(data);
  }

  async handleReset(request) {
    const url = new URL(request.url);
    const testId = url.searchParams.get('testId');
    
    // Delete all data for test
    const list = await this.state.storage.list({ prefix: `${testId}:` });
    await this.state.storage.delete(Array.from(list.keys()));
    
    return Response.json({ success: true });
  }

  async assignVariant(testId) {
    // Get test configuration from KV or use default
    const config = await this.env.TEST_CONFIG.get(testId, 'json') || {
      variants: [
        { id: 'control', weight: 50 },
        { id: 'variant-a', weight: 50 }
      ]
    };
    
    // Weighted random assignment
    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
    const random = Math.random() * totalWeight;
    
    let cumulative = 0;
    for (const variant of config.variants) {
      cumulative += variant.weight;
      if (random < cumulative) {
        return variant.id;
      }
    }
    
    return config.variants[0].id;
  }

  async incrementCounter(key, amount = 1) {
    const current = await this.state.storage.get(key) || 0;
    await this.state.storage.put(key, current + amount);
  }
}

// Main Worker
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  }
};

async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  
  // Handle API endpoints
  if (url.pathname.startsWith('/api/split-test')) {
    return handleAPI(request, env, ctx);
  }
  
  // Skip non-HTML requests
  const accept = request.headers.get('Accept') || '';
  if (!accept.includes('text/html')) {
    return fetch(request);
  }
  
  // Get test configuration
  const test = await getActiveTest(url.pathname, env);
  if (!test) {
    return fetch(request);
  }
  
  // Get or assign variant
  const variant = await getVariantAdvanced(request, test, env, ctx);
  
  // Track impression
  ctx.waitUntil(trackImpression(request, test, variant, env));
  
  // Modify request
  const modifiedRequest = await modifyRequestAdvanced(request, test, variant);
  
  // Fetch from origin with caching
  const response = await fetchWithCache(modifiedRequest, test, variant, env);
  
  // Modify response
  return modifyResponseAdvanced(response, test, variant);
}

async function getActiveTest(pathname, env) {
  // Check active tests in KV
  const tests = await env.ACTIVE_TESTS.get('config', 'json') || {};
  
  for (const [testId, config] of Object.entries(tests)) {
    if (!config.enabled) continue;
    
    // Check path matching with regex support
    for (const pattern of config.patterns) {
      const regex = new RegExp(pattern);
      if (regex.test(pathname)) {
        return { id: testId, ...config };
      }
    }
  }
  
  return null;
}

async function getVariantAdvanced(request, test, env, ctx) {
  // Use Durable Object for consistent assignment
  const id = env.SPLIT_TEST_STATE.idFromName(test.id);
  const stub = env.SPLIT_TEST_STATE.get(id);
  
  // Get user identifier
  const userId = getUserId(request);
  
  // Get assignment from Durable Object
  const response = await stub.fetch('https://do/assign', {
    method: 'POST',
    body: JSON.stringify({ testId: test.id, userId })
  });
  
  const data = await response.json();
  return data.variant;
}

function getUserId(request) {
  // Try multiple methods to identify user
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  
  // 1. Session cookie
  if (cookies.session_id) {
    return cookies.session_id;
  }
  
  // 2. Shopify customer ID
  if (cookies.customer_id) {
    return cookies.customer_id;
  }
  
  // 3. Generate from request fingerprint
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ua = request.headers.get('User-Agent') || '';
  const lang = request.headers.get('Accept-Language') || '';
  
  return hashString(`${ip}:${ua}:${lang}`);
}

async function modifyRequestAdvanced(request, test, variant) {
  const url = new URL(request.url);
  
  // Add variant info to URL
  url.searchParams.set('_ab', `${test.id}:${variant}`);
  
  // Clone request with modifications
  const headers = new Headers(request.headers);
  headers.set('X-Split-Test', `${test.id}:${variant}`);
  headers.set('X-Split-Test-Time', Date.now().toString());
  
  // Add edge location for geographic testing
  const colo = request.cf?.colo || 'unknown';
  headers.set('X-Split-Test-Edge', colo);
  
  return new Request(url.toString(), {
    method: request.method,
    headers: headers,
    body: request.body,
    cf: {
      ...request.cf,
      cacheTtl: test.cacheTtl || 300,
      cacheEverything: true,
      cacheKey: `${test.id}:${variant}:${url.pathname}`
    }
  });
}

async function fetchWithCache(request, test, variant, env) {
  const cacheKey = new Request(
    `https://cache.split-test.com/${test.id}/${variant}${new URL(request.url).pathname}`,
    request
  );
  
  const cache = caches.default;
  
  // Check cache
  let response = await cache.match(cacheKey);
  
  if (!response) {
    // Fetch from origin
    response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', `public, max-age=${test.cacheTtl || 300}`);
      
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }
  }
  
  return response;
}

function modifyResponseAdvanced(response, test, variant) {
  const headers = new Headers(response.headers);
  
  // Set cookies for variant persistence
  const cookieOptions = [
    `split_${test.id}=${variant}`,
    `Max-Age=${test.cookieDuration || 2592000}`, // 30 days
    'Path=/',
    'SameSite=Lax',
    'Secure',
    'HttpOnly'
  ];
  
  headers.append('Set-Cookie', cookieOptions.join('; '));
  
  // Add performance timing headers
  headers.set('X-Split-Test-Response', `${test.id}:${variant}`);
  headers.set('Server-Timing', `split-test;desc="${test.id}:${variant}"`);
  
  // Add vary header for proper caching
  const vary = headers.get('Vary') || '';
  if (!vary.includes('X-Split-Test')) {
    headers.set('Vary', vary ? `${vary}, X-Split-Test` : 'X-Split-Test');
  }
  
  // Inject tracking script
  const contentType = headers.get('Content-Type') || '';
  if (contentType.includes('text/html')) {
    return injectTrackingScript(response, headers, test, variant);
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

async function injectTrackingScript(response, headers, test, variant) {
  const text = await response.text();
  
  const trackingScript = `
    <script>
      (function() {
        window.__splitTest = {
          test: '${test.id}',
          variant: '${variant}',
          timestamp: ${Date.now()},
          track: function(event, data) {
            fetch('/api/split-test/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                test: '${test.id}',
                variant: '${variant}',
                event: event,
                data: data,
                timestamp: Date.now()
              })
            });
          }
        };
        
        // Auto-track page view
        window.__splitTest.track('pageview', {
          path: window.location.pathname,
          referrer: document.referrer
        });
        
        // Track clicks on CTAs
        document.addEventListener('click', function(e) {
          if (e.target.matches('[data-track]')) {
            window.__splitTest.track('click', {
              element: e.target.getAttribute('data-track'),
              text: e.target.textContent
            });
          }
        });
      })();
    </script>
  `;
  
  // Inject before closing body tag
  const modifiedHtml = text.replace('</body>', `${trackingScript}</body>`);
  
  return new Response(modifiedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

async function trackImpression(request, test, variant, env) {
  try {
    // Track to Durable Object
    const id = env.SPLIT_TEST_STATE.idFromName(test.id);
    const stub = env.SPLIT_TEST_STATE.get(id);
    
    await stub.fetch('https://do/track', {
      method: 'POST',
      body: JSON.stringify({
        testId: test.id,
        variant: variant,
        event: 'impression',
        value: 1
      })
    });
    
    // Also track to analytics if configured
    if (env.ANALYTICS_URL) {
      await fetch(env.ANALYTICS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test: test.id,
          variant: variant,
          event: 'impression',
          timestamp: Date.now(),
          edge: request.cf?.colo,
          country: request.cf?.country,
          ip: request.headers.get('CF-Connecting-IP')
        })
      });
    }
  } catch (error) {
    console.error('Tracking error:', error);
  }
}

async function handleAPI(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/split-test', '');
  
  switch (path) {
    case '/track':
      return handleTrackingAPI(request, env, ctx);
    case '/report':
      return handleReportAPI(request, env, ctx);
    case '/config':
      return handleConfigAPI(request, env, ctx);
    default:
      return new Response('Not Found', { status: 404 });
  }
}

async function handleTrackingAPI(request, env, ctx) {
  const data = await request.json();
  
  // Forward to Durable Object
  const id = env.SPLIT_TEST_STATE.idFromName(data.test);
  const stub = env.SPLIT_TEST_STATE.get(id);
  
  await stub.fetch('https://do/track', {
    method: 'POST',
    body: JSON.stringify({
      testId: data.test,
      variant: data.variant,
      event: data.event,
      value: data.value || 1
    })
  });
  
  return Response.json({ success: true });
}

async function handleReportAPI(request, env, ctx) {
  const url = new URL(request.url);
  const testId = url.searchParams.get('test');
  
  // Get report from Durable Object
  const id = env.SPLIT_TEST_STATE.idFromName(testId);
  const stub = env.SPLIT_TEST_STATE.get(id);
  
  const response = await stub.fetch(`https://do/report?testId=${testId}`);
  const data = await response.json();
  
  // Calculate statistics
  const stats = calculateStats(data);
  
  return Response.json(stats);
}

async function handleConfigAPI(request, env, ctx) {
  if (request.method === 'GET') {
    const config = await env.ACTIVE_TESTS.get('config', 'json') || {};
    return Response.json(config);
  }
  
  if (request.method === 'PUT') {
    const config = await request.json();
    await env.ACTIVE_TESTS.put('config', JSON.stringify(config));
    return Response.json({ success: true });
  }
  
  return new Response('Method Not Allowed', { status: 405 });
}

function calculateStats(data) {
  const stats = {
    variants: {},
    total: {
      impressions: 0,
      conversions: 0
    }
  };
  
  // Parse data and calculate metrics
  for (const [key, value] of Object.entries(data)) {
    const parts = key.split(':');
    const variant = parts[1];
    const metric = parts[2];
    
    if (!stats.variants[variant]) {
      stats.variants[variant] = {
        impressions: 0,
        conversions: 0,
        events: {}
      };
    }
    
    if (metric === 'assignments') {
      stats.variants[variant].impressions = value;
      stats.total.impressions += value;
    } else if (metric === 'conversion') {
      stats.variants[variant].conversions = value;
      stats.total.conversions += value;
    } else {
      stats.variants[variant].events[metric] = value;
    }
  }
  
  // Calculate conversion rates
  for (const variant of Object.keys(stats.variants)) {
    const v = stats.variants[variant];
    v.conversionRate = v.impressions > 0 ? (v.conversions / v.impressions * 100).toFixed(2) : 0;
  }
  
  return stats;
}

function parseCookies(cookieString) {
  const cookies = {};
  cookieString.split(';').forEach(cookie => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      cookies[key] = value;
    }
  });
  return cookies;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}