/**
 * Cloudflare Worker for Server-Side Split Testing with Shopify
 * 
 * This worker intercepts requests to your Shopify store and assigns users
 * to test variants, passing the variant information to Shopify for
 * server-side rendering of different experiences.
 */

// Configuration
const CONFIG = {
  // Test configuration
  tests: {
    'homepage-hero': {
      enabled: true,
      variants: [
        { id: 'control', weight: 50 },
        { id: 'variant-a', weight: 25 },
        { id: 'variant-b', weight: 25 }
      ],
      paths: ['/'],
      excludePaths: [],
      cookie: 'ab_homepage_hero',
      duration: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    },
    'product-layout': {
      enabled: false,
      variants: [
        { id: 'control', weight: 80 },
        { id: 'variant-a', weight: 20 }
      ],
      paths: ['/products/*'],
      excludePaths: [],
      cookie: 'ab_product_layout',
      duration: 30 * 24 * 60 * 60 * 1000,
    },
    'checkout-flow': {
      enabled: false,
      variants: [
        { id: 'control', weight: 90 },
        { id: 'variant-a', weight: 10 }
      ],
      paths: ['/checkout', '/cart'],
      excludePaths: [],
      cookie: 'ab_checkout_flow',
      duration: 30 * 24 * 60 * 60 * 1000,
    }
  },
  
  // Global settings
  settings: {
    // Header name to pass variant to Shopify
    variantHeader: 'X-AB-Variant',
    
    // Query parameter for forcing variants (e.g., ?ab_variant=variant-a)
    forceParam: 'ab_variant',
    
    // Query parameter for variant info (e.g., ?variant=a)
    variantParam: 'variant',
    
    // Exclude bots from tests
    excludeBots: true,
    
    // Bot user agents to exclude (partial matches)
    botAgents: ['bot', 'crawler', 'spider', 'scraper', 'facebookexternalhit', 
                'linkedinbot', 'whatsapp', 'slack', 'telegram', 'discord'],
    
    // Paths to never test
    globalExcludePaths: ['/admin', '/account', '/.well-known', '/policies'],
    
    // Enable debug mode (adds headers with test info)
    debug: false,
    
    // Analytics endpoint (optional)
    analyticsEndpoint: null, // 'https://analytics.example.com/track'
    
    // Enable KV storage for persistent assignments
    useKV: false,
    kvNamespace: 'SPLIT_TESTS' // Bind this in wrangler.toml
  }
};

/**
 * Main request handler
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event));
});

/**
 * Handle incoming requests
 */
async function handleRequest(request, event) {
  const url = new URL(request.url);
  
  // Check if path should be excluded globally
  if (shouldExcludePath(url.pathname)) {
    return fetch(request);
  }
  
  // Check if request is from a bot
  if (CONFIG.settings.excludeBots && isBot(request)) {
    return fetch(request);
  }
  
  // Find applicable test for this path
  const test = findApplicableTest(url.pathname);
  if (!test) {
    return fetch(request);
  }
  
  // Get or assign variant
  const variant = await getVariant(request, test);
  
  // Track assignment if analytics enabled
  if (CONFIG.settings.analyticsEndpoint) {
    event.waitUntil(trackAssignment(request, test, variant));
  }
  
  // Modify request with variant information
  const modifiedRequest = await modifyRequest(request, test, variant);
  
  // Fetch from origin
  const response = await fetch(modifiedRequest);
  
  // Modify response to set cookie if needed
  return modifyResponse(response, test, variant);
}

/**
 * Check if path should be excluded
 */
function shouldExcludePath(pathname) {
  return CONFIG.settings.globalExcludePaths.some(path => {
    if (path.endsWith('*')) {
      return pathname.startsWith(path.slice(0, -1));
    }
    return pathname === path;
  });
}

/**
 * Check if request is from a bot
 */
function isBot(request) {
  const userAgent = request.headers.get('User-Agent') || '';
  const lowerUA = userAgent.toLowerCase();
  return CONFIG.settings.botAgents.some(bot => lowerUA.includes(bot));
}

/**
 * Find applicable test for the current path
 */
function findApplicableTest(pathname) {
  for (const [testId, test] of Object.entries(CONFIG.tests)) {
    if (!test.enabled) continue;
    
    // Check if path matches test paths
    const matches = test.paths.some(path => {
      if (path.endsWith('*')) {
        return pathname.startsWith(path.slice(0, -1));
      }
      return pathname === path;
    });
    
    if (!matches) continue;
    
    // Check if path is excluded for this test
    const excluded = test.excludePaths.some(path => {
      if (path.endsWith('*')) {
        return pathname.startsWith(path.slice(0, -1));
      }
      return pathname === path;
    });
    
    if (excluded) continue;
    
    return { id: testId, ...test };
  }
  
  return null;
}

/**
 * Get variant for user (from cookie, forced param, or assign new)
 */
async function getVariant(request, test) {
  const url = new URL(request.url);
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  
  // Check for forced variant via query parameter
  const forcedVariant = url.searchParams.get(CONFIG.settings.forceParam);
  if (forcedVariant) {
    const variant = test.variants.find(v => v.id === forcedVariant);
    if (variant) {
      return variant.id;
    }
  }
  
  // Check for existing variant in cookie
  const cookieVariant = cookies[test.cookie];
  if (cookieVariant) {
    const variant = test.variants.find(v => v.id === cookieVariant);
    if (variant) {
      return variant.id;
    }
  }
  
  // Check KV storage if enabled
  if (CONFIG.settings.useKV && typeof SPLIT_TESTS !== 'undefined') {
    const clientId = getClientId(request);
    const kvKey = `${test.id}:${clientId}`;
    const kvVariant = await SPLIT_TESTS.get(kvKey);
    if (kvVariant) {
      const variant = test.variants.find(v => v.id === kvVariant);
      if (variant) {
        return variant.id;
      }
    }
  }
  
  // Assign new variant based on weights
  const assignedVariant = assignVariant(test.variants);
  
  // Store in KV if enabled
  if (CONFIG.settings.useKV && typeof SPLIT_TESTS !== 'undefined') {
    const clientId = getClientId(request);
    const kvKey = `${test.id}:${clientId}`;
    await SPLIT_TESTS.put(kvKey, assignedVariant, {
      expirationTtl: Math.floor(test.duration / 1000)
    });
  }
  
  return assignedVariant;
}

/**
 * Assign variant based on weights
 */
function assignVariant(variants) {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const random = Math.random() * totalWeight;
  
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (random < cumulative) {
      return variant.id;
    }
  }
  
  // Fallback to first variant (should never happen)
  return variants[0].id;
}

/**
 * Get client identifier for KV storage
 */
function getClientId(request) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const userAgent = request.headers.get('User-Agent') || '';
  const accept = request.headers.get('Accept') || '';
  
  // Create hash from client characteristics
  const data = `${ip}:${userAgent}:${accept}`;
  return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

/**
 * Modify request to include variant information
 */
async function modifyRequest(request, test, variant) {
  const url = new URL(request.url);
  
  // Add variant as query parameter
  url.searchParams.set(CONFIG.settings.variantParam, variant);
  url.searchParams.set(`${CONFIG.settings.variantParam}_test`, test.id);
  
  // Create new request with modified URL and headers
  const headers = new Headers(request.headers);
  headers.set(CONFIG.settings.variantHeader, variant);
  headers.set(`${CONFIG.settings.variantHeader}-Test`, test.id);
  
  // Add debug headers if enabled
  if (CONFIG.settings.debug) {
    headers.set('X-Split-Test-Debug', 'true');
    headers.set('X-Split-Test-ID', test.id);
    headers.set('X-Split-Test-Variant', variant);
  }
  
  return new Request(url.toString(), {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: request.redirect,
    cf: {
      ...request.cf,
      cacheKey: `${url.pathname}:${test.id}:${variant}`
    }
  });
}

/**
 * Modify response to set variant cookie
 */
function modifyResponse(response, test, variant) {
  const headers = new Headers(response.headers);
  
  // Set variant cookie
  const cookieOptions = [
    `${test.cookie}=${variant}`,
    `Max-Age=${Math.floor(test.duration / 1000)}`,
    'Path=/',
    'SameSite=Lax',
    'Secure'
  ];
  
  headers.append('Set-Cookie', cookieOptions.join('; '));
  
  // Add debug headers if enabled
  if (CONFIG.settings.debug) {
    headers.set('X-Split-Test-Response', 'true');
    headers.set('X-Split-Test-ID', test.id);
    headers.set('X-Split-Test-Variant', variant);
  }
  
  // Add Vary header for proper caching
  const existingVary = headers.get('Vary') || '';
  const varyHeaders = existingVary ? existingVary.split(',').map(h => h.trim()) : [];
  if (!varyHeaders.includes(CONFIG.settings.variantHeader)) {
    varyHeaders.push(CONFIG.settings.variantHeader);
    headers.set('Vary', varyHeaders.join(', '));
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

/**
 * Parse cookies from Cookie header
 */
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

/**
 * Track variant assignment to analytics
 */
async function trackAssignment(request, test, variant) {
  if (!CONFIG.settings.analyticsEndpoint) return;
  
  try {
    const url = new URL(request.url);
    const data = {
      event: 'split_test_assignment',
      test_id: test.id,
      variant: variant,
      path: url.pathname,
      timestamp: Date.now(),
      user_agent: request.headers.get('User-Agent') || '',
      ip: request.headers.get('CF-Connecting-IP') || '',
      country: request.headers.get('CF-IPCountry') || '',
      referrer: request.headers.get('Referer') || ''
    };
    
    await fetch(CONFIG.settings.analyticsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  } catch (error) {
    // Silently fail analytics tracking
    console.error('Analytics tracking failed:', error);
  }
}