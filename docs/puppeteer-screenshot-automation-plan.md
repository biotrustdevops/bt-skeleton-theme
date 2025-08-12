# Puppeteer MCP Screenshot Automation Plan

## Overview
This document outlines the implementation plan for using the Puppeteer MCP (Model Context Protocol) server to automatically capture and compare screenshots between development and production Shopify environments.

## Purpose
Enable automated visual comparison between your local development environment and production Shopify store to ensure visual consistency and quickly identify discrepancies during theme development.

## Setup & Configuration

### 1. Install Puppeteer MCP Server

Add the Puppeteer MCP server to your Claude Code configuration. On Windows, edit the configuration file located at:
```
%APPDATA%\Claude\claude_desktop_config.json
```

#### Option A: NPX Method (Visual Debugging)
Use this method when you want to see the browser window during automation:

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

#### Option B: Docker Method (Headless)
Use this method for headless operation without a visible browser window:

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--init", "-e", "DOCKER_CONTAINER=true", "mcp/puppeteer"]
    }
  }
}
```

### 2. Configure Launch Options (Optional)

Customize browser behavior by setting environment variables:

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "env": {
        "PUPPETEER_LAUNCH_OPTIONS": "{ \"headless\": false, \"executablePath\": \"C:/Program Files/Google/Chrome/Application/chrome.exe\" }"
      }
    }
  }
}
```

## Automated Workflow

### Screenshot Capture Process

1. **Production Environment Capture**
   - Navigate to production URL: `https://your-store.myshopify.com`
   - Capture full-page screenshots of critical pages
   - Store with clear naming convention: `prod-[page-name].png`

2. **Development Environment Capture**
   - Start local development server: `shopify theme dev`
   - Navigate to local URL: `http://localhost:9292`
   - Capture identical views as production
   - Store with naming convention: `dev-[page-name].png`

3. **Visual Comparison**
   - Claude Code can view multiple images simultaneously
   - Automatic identification of visual discrepancies
   - Suggestions for CSS/Liquid changes to align environments

## Available Puppeteer Tools

### Core Browser Actions
- **puppeteer_navigate**: Navigate to URLs with optional launch configuration
- **puppeteer_click**: Click elements using CSS selectors
- **puppeteer_hover**: Hover over elements for state changes
- **puppeteer_fill**: Fill input fields with text
- **puppeteer_select**: Select options from dropdown menus

### Content Capture
- **puppeteer_screenshot**: Capture screenshots of entire page or specific elements
- **puppeteer_evaluate**: Execute JavaScript in browser console

### Resources
- **Console Logs**: Access browser console output via `console://logs`
- **Screenshots**: Access captured screenshots via `screenshot://<n>`

## Use Cases

### Basic Comparison Workflow
```
User: "Compare the homepage between dev and production"
Claude: 
1. Uses puppeteer_navigate to open both URLs
2. Captures screenshots with puppeteer_screenshot
3. Analyzes visual differences
4. Provides recommendations for alignment
```

### Section-Specific Comparison
```
User: "Check if the hero section looks the same in both environments"
Claude:
1. Navigates to both environments
2. Screenshots specific sections using CSS selectors
3. Compares visual elements
4. Reports discrepancies
```

### Responsive Testing
```
User: "Compare mobile views between environments"
Claude:
1. Sets viewport to mobile dimensions
2. Captures both environments at mobile size
3. Identifies responsive design differences
```

### Interactive State Testing
```
User: "Check if dropdown menus look identical"
Claude:
1. Navigates to pages with dropdowns
2. Uses puppeteer_hover or puppeteer_click to trigger states
3. Captures open dropdown states
4. Compares styling and layout
```

## Implementation Examples

### Example 1: Full Page Comparison
When asked to compare full pages, Claude will:
```javascript
// Navigate to production
puppeteer_navigate("https://store.myshopify.com/pages/about")

// Capture production screenshot
puppeteer_screenshot()

// Navigate to development
puppeteer_navigate("http://localhost:9292/pages/about")

// Capture development screenshot
puppeteer_screenshot()

// Compare and analyze differences
```

### Example 2: Element-Specific Comparison
For comparing specific sections:
```javascript
// Production environment
puppeteer_navigate("https://store.myshopify.com")
puppeteer_screenshot({ selector: ".hero-section" })

// Development environment
puppeteer_navigate("http://localhost:9292")
puppeteer_screenshot({ selector: ".hero-section" })
```

### Example 3: Interactive Element Testing
For testing interactive states:
```javascript
// Test hover states
puppeteer_navigate("https://store.myshopify.com")
puppeteer_hover(".product-card")
puppeteer_screenshot({ selector: ".product-card" })

// Test click states
puppeteer_click(".mobile-menu-toggle")
puppeteer_screenshot({ selector: ".mobile-menu" })
```

## Advanced Automation Features

### Batch Processing
Create commands for comparing multiple pages at once:
- Homepage
- Product pages
- Collection pages
- Cart and checkout flows

### Visual Regression Testing
- Establish baseline screenshots
- Detect unexpected changes during development
- Generate visual diff reports

### Custom Validation Scripts
Use `puppeteer_evaluate` to:
- Check computed styles
- Verify element dimensions
- Test JavaScript functionality
- Validate dynamic content

## Best Practices

1. **Consistent Environment Setup**
   - Ensure same theme settings in both environments
   - Use identical test data when possible
   - Clear browser cache between tests

2. **Organized Screenshot Management**
   - Use clear naming conventions
   - Store screenshots in dedicated folders
   - Document what each screenshot represents

3. **Efficient Comparison Workflow**
   - Start with high-level page comparisons
   - Drill down to specific sections as needed
   - Focus on critical user-facing elements

4. **Performance Considerations**
   - Allow pages to fully load before screenshots
   - Account for lazy-loaded images
   - Consider network speed differences

## Troubleshooting

### Common Issues and Solutions

1. **Browser Not Opening**
   - Check Puppeteer installation
   - Verify Chrome/Chromium path
   - Try headless mode if display issues

2. **Screenshots Not Capturing**
   - Ensure page fully loaded
   - Check CSS selectors validity
   - Verify viewport settings

3. **Differences Due to Data**
   - Use consistent test products
   - Account for dynamic content
   - Consider time-based variations

## Quick Reference Commands

### Basic Commands for Claude Code
- "Compare homepage between dev and prod"
- "Screenshot the product page in both environments"
- "Check if the cart drawer looks the same"
- "Compare mobile view of collection page"
- "Test hover states on navigation menu"

### Advanced Commands
- "Compare all main pages and create a visual report"
- "Check responsive breakpoints from mobile to desktop"
- "Validate all interactive elements match production"
- "Test theme with different color settings"

## Integration with Development Workflow

1. **Pre-Deployment Checks**
   - Visual regression testing before pushing changes
   - Ensure feature parity with production
   - Validate responsive design across devices

2. **Feature Development**
   - Compare new features against design mockups
   - Test interactive elements thoroughly
   - Ensure consistent styling across environments

3. **Debugging Visual Issues**
   - Quickly identify CSS discrepancies
   - Compare computed styles between environments
   - Validate theme settings application

## Conclusion

This Puppeteer MCP integration enables efficient visual comparison between development and production environments, reducing the time needed to ensure visual consistency and catch discrepancies early in the development process. By automating screenshot capture and comparison, developers can focus on implementing features while Claude Code handles the visual validation.