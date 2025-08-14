# Cloudflare Worker for Shopify Split Testing

This Cloudflare Worker enables server-side A/B testing for your Shopify store without any client-side JavaScript.

## Features

- ✅ Server-side variant assignment
- ✅ Cookie-based persistence
- ✅ Weighted traffic distribution
- ✅ Path-based test targeting
- ✅ Bot exclusion
- ✅ Forced variant testing via URL parameters
- ✅ Optional KV storage for cross-device persistence
- ✅ Built-in analytics tracking
- ✅ Debug mode for troubleshooting

## Setup Instructions

### 1. Prerequisites

- Cloudflare account with your domain
- Wrangler CLI installed: `npm install -g wrangler`
- Node.js 16+ installed

### 2. Configuration

1. Clone this directory to your local machine
2. Update `wrangler.toml` with your Cloudflare account details:
   - `account_id`: Your Cloudflare account ID
   - `route`: Your store domain (e.g., `example.myshopify.com/*`)
   - `zone_id`: Your Cloudflare zone ID

3. Configure tests in `worker.js`:
   - Modify the `CONFIG.tests` object to define your split tests
   - Adjust variant weights, paths, and cookie settings

### 3. Deployment

```bash
# Install dependencies
npm install

# Login to Cloudflare
wrangler login

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### 4. Optional: Enable KV Storage

For persistent cross-device variant assignments:

```bash
# Create KV namespace
wrangler kv:namespace create "SPLIT_TESTS"

# Add the namespace ID to wrangler.toml
# Uncomment the kv_namespaces section and add your ID
```

## Shopify Theme Integration

### 1. Detect Variant in theme.liquid

Add to the top of your `layout/theme.liquid`:

```liquid
{% liquid
  # Detect split test variant
  assign ab_variant = request.host | split: '?variant=' | last | split: '&' | first
  assign ab_test = request.host | split: '?variant_test=' | last | split: '&' | first
  
  # Fallback to URL parameters
  if ab_variant == request.host
    for param in request.host
      if param contains 'variant='
        assign ab_variant = param | split: '=' | last
      endif
    endfor
  endif
  
  # Default to control if no variant
  unless ab_variant
    assign ab_variant = 'control'
  endunless
%}
```

### 2. Conditional Rendering

Use the variant in your sections:

```liquid
{% if ab_variant == 'variant-a' %}
  {% render 'hero-variant-a' %}
{% elsif ab_variant == 'variant-b' %}
  {% render 'hero-variant-b' %}
{% else %}
  {% render 'hero-control' %}
{% endif %}
```

### 3. Track Events

Add to your analytics:

```liquid
<script>
  // Track variant in Google Analytics
  gtag('event', 'split_test_view', {
    'test_id': '{{ ab_test }}',
    'variant': '{{ ab_variant }}',
    'page_path': '{{ request.path }}'
  });
  
  // Track in Shopify Analytics
  window.ShopifyAnalytics.meta = window.ShopifyAnalytics.meta || {};
  window.ShopifyAnalytics.meta.ab_variant = '{{ ab_variant }}';
  window.ShopifyAnalytics.meta.ab_test = '{{ ab_test }}';
</script>
```

## Testing

### Force Variants

Test specific variants by adding URL parameters:
- `https://your-store.com/?ab_variant=variant-a`
- `https://your-store.com/?ab_variant=control`

### Debug Mode

Enable debug mode in `CONFIG.settings.debug` to see test information in response headers:
- `X-Split-Test-ID`: Current test ID
- `X-Split-Test-Variant`: Assigned variant
- `X-Split-Test-Debug`: Debug mode indicator

### Local Testing

```bash
# Start local development server
npm run dev

# Test with curl
curl -I http://localhost:8787

# Check headers and cookies
curl -v http://localhost:8787
```

## Configuration Options

### Test Configuration

Each test in `CONFIG.tests` supports:

```javascript
{
  enabled: true,                    // Enable/disable test
  variants: [                       // Variant definitions
    { id: 'control', weight: 50 },
    { id: 'variant-a', weight: 50 }
  ],
  paths: ['/products/*'],          // Paths to test
  excludePaths: ['/products/gift'], // Paths to exclude
  cookie: 'ab_product_test',       // Cookie name
  duration: 30 * 24 * 60 * 60 * 1000 // Cookie duration (ms)
}
```

### Global Settings

Modify `CONFIG.settings` for global behavior:

```javascript
{
  variantHeader: 'X-AB-Variant',     // Header name for variant
  forceParam: 'ab_variant',          // URL param to force variant
  variantParam: 'variant',           // URL param added to requests
  excludeBots: true,                 // Exclude bots from tests
  botAgents: [...],                  // Bot user agents to exclude
  globalExcludePaths: [...],         // Paths to never test
  debug: false,                      // Enable debug headers
  analyticsEndpoint: null,           // Analytics tracking URL
  useKV: false,                      // Use KV for persistence
  kvNamespace: 'SPLIT_TESTS'        // KV namespace binding
}
```

## Monitoring

### Cloudflare Analytics

Monitor worker performance in Cloudflare dashboard:
- Request count by variant
- Error rates
- Response times
- Geographic distribution

### Custom Analytics

Implement the `analyticsEndpoint` to track:
- Variant assignments
- Conversion rates
- User journeys
- Test performance

## Rollback

To disable all tests immediately:

1. Set all tests to `enabled: false` in worker.js
2. Deploy: `npm run deploy:production`

OR

Remove the worker route in Cloudflare dashboard

## Troubleshooting

### Variant Not Detected in Theme

1. Check browser developer tools for cookies
2. Verify URL parameters are being added
3. Enable debug mode and check response headers
4. Test with curl to see raw response

### Uneven Distribution

1. Check variant weights add up correctly
2. Verify cookie persistence is working
3. Consider using KV storage for better persistence
4. Monitor analytics for actual distribution

### Performance Issues

1. Reduce number of active tests
2. Simplify path matching logic
3. Disable analytics tracking
4. Use Cloudflare cache more aggressively

## Support

For issues or questions:
1. Check worker logs in Cloudflare dashboard
2. Enable debug mode for detailed information
3. Test locally with `wrangler dev`
4. Review Cloudflare Workers documentation