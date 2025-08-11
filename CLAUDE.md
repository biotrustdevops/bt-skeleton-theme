# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Shopify Skeleton Theme - a minimal, carefully structured Shopify theme template designed with modularity, maintainability, and Shopify's best practices in mind. It uses Liquid templating, semantic HTML, and minimal external JavaScript dependencies.

## Development Commands

### Theme Development

- **Preview theme**: `shopify theme dev` - Start local development server with hot reload
- **Push theme**: `shopify theme push` - Upload theme changes to Shopify store
- **Pull theme**: `shopify theme pull` - Download theme from Shopify store
- **Check theme**: `shopify theme check` - Run Theme Check linting locally

### CSS Build Process

- **Build CSS**: `npm run build:css` - Regenerate Tailwind CSS file after adding new utility classes
- **Watch CSS**: `npm run watch:css` - Auto-rebuild CSS during development

### Testing & Validation

- **CI/CD**: GitHub Actions runs Theme Check automatically on push
- **Validate locally**: Use `shopify theme check` before committing changes

## Architecture

### Liquid Theme Structure

The theme follows Shopify's standard theme architecture:

- **templates/**: JSON templates defining page structures by combining sections
- **sections/**: Full-width modular components with schema-based customization
- **blocks/**: Reusable nestable UI components within sections
- **layout/**: Top-level HTML wrappers (theme.liquid, password.liquid)
- **snippets/**: Reusable Liquid code fragments (use `{% render 'snippet-name' %}`)
- **assets/**: Static files (CSS, JS, images) accessed via `{{ 'file.ext' | asset_url }}`
- **config/**: Theme settings schema and data
- **locales/**: Translation files accessed via `{{ 'key' | t }}`

### Key Development Patterns

#### CSS Approach

- Mobile-first responsive design with min-width media queries
- Use Tailwind CSS for all styling
- CSS variables for dynamic settings: `style="--variable: {{ setting }}"`
- Maximum specificity 0 4 0 (avoid IDs and !important)
- critical.css contains essential styles for every page

#### JavaScript Approach

- Minimal external dependencies policy
- Use native browser features over JS when possible
- Custom elements for component initialization
- Module pattern to avoid global scope pollution
- Async/await for asynchronous operations
- Private methods prefixed with `#`

#### Liquid Best Practices

- Use `{% liquid %}` for multiline code blocks
- Use `{% # comment %}` for inline comments
- Server-side rendering as first principle (avoid client-side JS rendering)
- Never invent filters/tags/objects - only use valid Shopify Liquid (reference .github\copilot-instructions.md)
- Access settings via `{{ settings.setting_name }}`
- Access section settings via `{{ section.settings.setting_name }}`
- Access block settings via `{{ block.settings.setting_name }}`
- NEVER use Liquid tags or comments inside `{% stylesheet %}` or `{% javascript %}` blocks - use CSS comments `/* */` or JS comments `//` instead

#### Schema Configuration

- Keep settings simple with clear labels
- Group related settings under headings
- Order settings by visual impact and preview order
- Use conditional settings for progressive disclosure

## Shopify Liquid Reference

### Common Filters

- **Assets**: `asset_url`, `asset_img_url`, `inline_asset_content`
- **Money**: `money`, `money_with_currency`, `money_without_currency`
- **HTML**: `link_to`, `image_tag`, `stylesheet_tag`, `script_tag`
- **Strings**: `handleize`, `capitalize`, `truncate`, `escape`
- **Collections**: `where`, `map`, `sort`, `first`, `last`
- **Images**: `image_url`, `img_url`, `img_tag`
- **Translation**: `t` (translate)

### Global Objects

- `shop` - Store information
- `cart` - Current cart state
- `customer` - Logged-in customer
- `routes` - URL helpers (e.g., `routes.root_url`, `routes.cart_url`)
- `settings` - Global theme settings
- `request` - Current request info
- `template` - Current template name
- `content_for_layout` - Main content placeholder
- `content_for_header` - Shopify scripts injection

### Section/Block Context

- `section.settings` - Section configuration values
- `section.id` - Unique section identifier
- `section.blocks` - Array of blocks in section
- `block.settings` - Block configuration values
- `block.id` - Unique block identifier
- `block.type` - Block type name

## Translation & Localization

All user-facing text should be translatable:

- Store translations in `locales/en.default.json`
- Access via `{{ 'namespace.key' | t }}`
- Use meaningful key names reflecting content purpose
- Only add English translations (other languages handled by translators)

## Quality Checks

Before committing:

1. Run `npm run build:css` to regenerate Tailwind CSS if you added new utility classes
2. Run `shopify theme check` for Liquid linting
3. Verify sections have proper schema definitions
4. Ensure all text is translatable
5. Check CSS specificity rules are followed
6. Confirm only needed external JS dependencies are added
7. Test responsiveness and accessibility
8. Make sure there is no degredation of the Lighthouse score

## Important Notes

- This is a minimal starter theme - keep additions focused and necessary
- Follow server-side rendering principles - avoid client-side content generation
- Maintain minimal external dependencies for JavaScript
- Use semantic HTML and native browser features where possible
- All customizable elements should use schema settings, not hardcoded values
- Reference .github\copilot-instructions.md when working with Liquid files
