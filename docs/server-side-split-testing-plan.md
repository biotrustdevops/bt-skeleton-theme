# Server-Side Split Testing Plan: Cloudflare + Shopify Liquid

## Architecture Overview

**Traffic Flow:**
1. User request → Cloudflare Worker
2. Worker determines test variant (A/B assignment)
3. Worker modifies request headers/parameters
4. Request forwarded to Shopify with variant info
5. Shopify theme renders appropriate variant
6. Response served to user (with variant tracking)

## Cloudflare Worker Strategy

**Variant Assignment:**
- Use consistent hashing (user IP/session) for sticky assignment
- Set custom header (e.g., `X-AB-Variant: control|variant-a|variant-b`)
- Store assignment in cookie for persistence
- Implement traffic distribution logic (50/50, 80/20, etc.)

**Edge Logic Options:**
- URL parameter injection (`?variant=a`)
- Custom header injection for Shopify to read
- Cookie-based routing with fallback logic
- Geographic or device-based segmentation

## Shopify Theme Architecture

**Variant Detection:**
```liquid
{% comment %} Pseudo-code approach {% endcomment %}
- Read variant from request.host headers
- Check for variant URL parameters
- Default to control if no variant specified
```

**Theme Structure:**
- `sections/hero-control.liquid` vs `sections/hero-variant-a.liquid`
- OR single section with conditional rendering based on variant
- Use theme settings for variant configuration
- Implement snippet-level variations for smaller tests

**Data Flow:**
- Store variant in Liquid variable early in theme.liquid
- Pass variant context through section/block rendering
- Use variant-specific translation keys

## Implementation Approach

**Phase 1: Infrastructure**
- Configure Cloudflare Worker route for store domain
- Set up KV storage for test configurations
- Implement basic A/B assignment logic

**Phase 2: Theme Integration**
- Create variant detection snippet
- Modify critical sections for split testing
- Add variant tracking to analytics

**Phase 3: Analytics**
- Pass variant data to Shopify Analytics
- Configure Google Analytics custom dimensions
- Set up Cloudflare Analytics for edge-level metrics
- Create conversion tracking per variant

## Key Considerations

**Performance:**
- Cloudflare Worker adds ~10-50ms latency
- Cache variant assignments in KV/Durable Objects
- Use Cloudflare Cache API for variant-specific caching
- Minimize Liquid conditional logic overhead

**SEO Impact:**
- Canonical URLs must remain consistent
- Avoid cloaking (showing different content to bots)
- Use `Vary: X-AB-Variant` header for cache control
- Consider excluding bots from tests

**Testing Scenarios:**
- Homepage hero variations
- Product page layout tests
- Checkout flow optimizations
- Pricing display experiments
- Navigation structure tests

**Rollback Strategy:**
- Kill switch in Cloudflare Worker
- Gradual rollout percentages
- Fallback to control on errors
- Quick DNS bypass if needed

## Technical Challenges

**State Management:**
- Cross-domain cookie handling (if using multiple domains)
- Cart persistence across variants
- Session consistency during checkout

**Cache Invalidation:**
- Cloudflare cache needs variant-aware purging
- Shopify CDN caching considerations
- Browser cache may show wrong variant

**Monitoring:**
- Worker error rates and performance
- Variant distribution accuracy
- Conversion rate per variant
- Page load time impact

## Alternative Approaches

**Option A: Query Parameter Based**
- Simpler implementation
- Works with existing caching
- Visible to users (may impact behavior)

**Option B: Subdomain Routing**
- `control.store.com` vs `test.store.com`
- Clean separation but complex setup
- SSL certificate considerations

**Option C: Edge-Side Includes (ESI)**
- More granular control
- Better caching efficiency
- Requires Cloudflare Workers HTML rewriting

## Conclusion

This approach enables true server-side split testing without client-side JavaScript, ensuring consistent user experience and accurate testing results while maintaining performance.