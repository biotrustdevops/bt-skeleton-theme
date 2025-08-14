/**
 * Local testing script for the Cloudflare Worker
 * Run with: node test.js
 */

const CONFIG = {
  tests: {
    'homepage-hero': {
      enabled: true,
      variants: [
        { id: 'control', weight: 50 },
        { id: 'variant-a', weight: 25 },
        { id: 'variant-b', weight: 25 }
      ]
    }
  }
};

// Test variant assignment distribution
function testVariantDistribution(iterations = 10000) {
  console.log('\n📊 Testing Variant Distribution');
  console.log('================================');
  
  const results = {};
  const variants = CONFIG.tests['homepage-hero'].variants;
  
  // Initialize results
  variants.forEach(v => results[v.id] = 0);
  
  // Run assignments
  for (let i = 0; i < iterations; i++) {
    const variant = assignVariant(variants);
    results[variant]++;
  }
  
  // Calculate percentages
  console.log(`\nResults after ${iterations} iterations:`);
  variants.forEach(v => {
    const percentage = (results[v.id] / iterations * 100).toFixed(2);
    const expected = v.weight;
    const difference = Math.abs(percentage - expected).toFixed(2);
    
    console.log(`  ${v.id}:`);
    console.log(`    Expected: ${expected}%`);
    console.log(`    Actual:   ${percentage}%`);
    console.log(`    Diff:     ${difference}%`);
  });
}

// Variant assignment logic from worker
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
  
  return variants[0].id;
}

// Test cookie parsing
function testCookieParsing() {
  console.log('\n🍪 Testing Cookie Parsing');
  console.log('==========================');
  
  const testCases = [
    'ab_homepage_hero=variant-a',
    'ab_homepage_hero=control; ab_product_layout=variant-b',
    'session=123; ab_homepage_hero=variant-a; cart=abc',
    '',
    'malformed',
    'key=value=extra'
  ];
  
  testCases.forEach(testCase => {
    console.log(`\nInput: "${testCase}"`);
    const result = parseCookies(testCase);
    console.log('Output:', result);
  });
}

// Cookie parsing logic from worker
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

// Test path matching
function testPathMatching() {
  console.log('\n🛤️  Testing Path Matching');
  console.log('=========================');
  
  const testPaths = [
    '/',
    '/products/test-product',
    '/products',
    '/collections/all',
    '/cart',
    '/checkout',
    '/admin',
    '/account/login'
  ];
  
  const tests = {
    'homepage': {
      paths: ['/'],
      excludePaths: []
    },
    'products': {
      paths: ['/products/*'],
      excludePaths: ['/products/gift-card']
    },
    'checkout': {
      paths: ['/cart', '/checkout'],
      excludePaths: []
    }
  };
  
  testPaths.forEach(path => {
    console.log(`\nPath: ${path}`);
    Object.entries(tests).forEach(([name, test]) => {
      const matches = matchesPath(path, test.paths, test.excludePaths);
      if (matches) {
        console.log(`  ✅ Matches: ${name}`);
      }
    });
  });
}

// Path matching logic
function matchesPath(pathname, paths, excludePaths) {
  // Check exclusions first
  const excluded = excludePaths.some(path => {
    if (path.endsWith('*')) {
      return pathname.startsWith(path.slice(0, -1));
    }
    return pathname === path;
  });
  
  if (excluded) return false;
  
  // Check inclusions
  return paths.some(path => {
    if (path.endsWith('*')) {
      return pathname.startsWith(path.slice(0, -1));
    }
    return pathname === path;
  });
}

// Test bot detection
function testBotDetection() {
  console.log('\n🤖 Testing Bot Detection');
  console.log('========================');
  
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Googlebot/2.1 (+http://www.google.com/bot.html)',
    'facebookexternalhit/1.1',
    'Mozilla/5.0 (compatible; Baiduspider/2.0)',
    'WhatsApp/2.19.81 A',
    'Slackbot-LinkExpander 1.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'LinkedInBot/1.0',
    'Discordbot/2.0'
  ];
  
  const botAgents = ['bot', 'crawler', 'spider', 'scraper', 'facebookexternalhit', 
                     'linkedinbot', 'whatsapp', 'slack', 'telegram', 'discord'];
  
  userAgents.forEach(ua => {
    const isBot = botAgents.some(bot => ua.toLowerCase().includes(bot));
    console.log(`\n${isBot ? '🚫' : '✅'} ${ua.substring(0, 50)}...`);
    console.log(`   Is Bot: ${isBot}`);
  });
}

// Test client ID generation
function testClientIdGeneration() {
  console.log('\n🆔 Testing Client ID Generation');
  console.log('================================');
  
  const testClients = [
    { ip: '192.168.1.1', userAgent: 'Mozilla/5.0', accept: 'text/html' },
    { ip: '10.0.0.1', userAgent: 'Chrome/91.0', accept: 'text/html' },
    { ip: '192.168.1.1', userAgent: 'Mozilla/5.0', accept: 'text/html' },
    { ip: '172.16.0.1', userAgent: 'Safari/14.0', accept: 'application/json' }
  ];
  
  const ids = new Set();
  
  testClients.forEach((client, index) => {
    const id = generateClientId(client.ip, client.userAgent, client.accept);
    const duplicate = ids.has(id);
    ids.add(id);
    
    console.log(`\nClient ${index + 1}:`);
    console.log(`  IP: ${client.ip}`);
    console.log(`  UA: ${client.userAgent}`);
    console.log(`  ID: ${id}`);
    console.log(`  Duplicate: ${duplicate ? '⚠️ YES' : '✅ NO'}`);
  });
}

// Client ID generation logic
function generateClientId(ip, userAgent, accept) {
  const data = `${ip}:${userAgent}:${accept}`;
  return Buffer.from(data).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

// Run all tests
function runAllTests() {
  console.log('🧪 Cloudflare Worker Split Test - Test Suite');
  console.log('============================================');
  
  testVariantDistribution();
  testCookieParsing();
  testPathMatching();
  testBotDetection();
  testClientIdGeneration();
  
  console.log('\n\n✅ All tests completed!\n');
}

// Run tests
runAllTests();