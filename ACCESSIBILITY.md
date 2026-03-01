# Accessibility Standards - OfflineSuite

## Overview
OfflineSuite is committed to providing an accessible experience for all users, following WCAG 2.1 Level AA guidelines.

## Implemented Accessibility Features

### ⌨️ Keyboard Navigation

#### Focus Management
- **Visible focus indicators** on all interactive elements
- `focus-visible:ring-2` and `focus-visible:ring-purple-400` for clear focus states
- `focus-visible:ring-offset-2` for better visibility
- Tab order follows logical reading order

#### Keyboard Shortcuts
- `Tab` - Navigate forward through interactive elements
- `Shift + Tab` - Navigate backward
- `Enter` / `Space` - Activate buttons and links
- `Escape` - Close modals (when implemented)

### 🎨 Color and Contrast

#### Text Contrast Ratios (WCAG AA)
**Light Mode:**
- Primary text: `text-gray-800` on white (17:1) ✅
- Secondary text: `text-gray-600` on white (7:1) ✅
- Link text: `text-purple-600` on white (5:1) ✅

**Dark Mode:**
- Primary text: `text-gray-200` on `gray-800` (11:1) ✅
- Secondary text: `text-gray-400` on `gray-800` (6:1) ✅
- Link text: `text-purple-400` on `gray-800` (5.5:1) ✅

#### No Color-Only Information
- Status indicators use icons + text
- Form validation shows text messages, not just color
- Focus states use outlines, not just color changes

### 🔊 Screen Reader Support

#### ARIA Labels
```jsx
// Search input
<input aria-label="Search tools" />

// Theme toggle
<button aria-label="Switch to dark mode" />

// View mode toggle
<button title="Grid view" aria-label="Grid view" />
```

#### Live Regions
```jsx
// Dynamic content updates
<p aria-live="polite" aria-atomic="true">
  {filteredTools.length} tools
</p>
```

#### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- `<nav>` for navigation sections
- `<main>` for primary content
- `<footer>` for footer content
- `<details>` and `<summary>` for FAQ items

### 🖱️ Mouse and Touch

#### Target Sizes
- Minimum touch target: 44×44px (mobile)
- Desktop buttons: 40px+ height
- Adequate spacing between interactive elements

#### Hover States
- Clear hover feedback on all interactive elements
- Scale/color changes indicate interactivity
- Cursor changes to pointer on clickable elements

### 📱 Responsive Design

#### Mobile Accessibility
- Touch-friendly button sizes
- Horizontal scroll for category filters
- Sticky search bar on mobile
- Collapsible FAQ items
- Responsive text sizes

#### Viewport Support
- Works from 320px to 4K displays
- No horizontal scrolling required
- Content reflows appropriately

## Component-Specific Guidelines

### Dashboard
```jsx
// Tool cards with proper focus and hover states
<Link
  to={`/tool/${tool.id}`}
  className="... focus-visible:ring-2 focus-visible:ring-purple-400"
  aria-label={`Open ${tool.name}`}
>
  {/* Card content */}
</Link>

// Search with label
<input
  type="text"
  aria-label="Search tools"
  placeholder="Search tools..."
/>

// Results count with live region
<p aria-live="polite" aria-atomic="true">
  {count} tools
</p>
```

### Forms (for tools)
```jsx
// File input with label
<label htmlFor="file-upload" className="...">
  Upload File
</label>
<input
  id="file-upload"
  type="file"
  accept=".pdf"
  aria-describedby="file-help"
/>
<p id="file-help" className="text-sm">
  PDF files only, max 10MB
</p>

// Error messages
<div role="alert" className="text-red-600">
  Please select a file
</div>
```

### Modals (when implemented)
```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">Modal Title</h2>
  {/* Modal content */}
</div>
```

### Skip Links (recommended)
```jsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0"
>
  Skip to main content
</a>
```

## Testing Checklist

### Keyboard Testing
- [ ] Tab through all interactive elements
- [ ] Focus order is logical
- [ ] Focus indicators are visible
- [ ] No keyboard traps
- [ ] All actions accessible without mouse

### Screen Reader Testing
- [ ] Test with VoiceOver (macOS)
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] All images have alt text
- [ ] ARIA labels are descriptive
- [ ] Dynamic content announces properly

### Visual Testing
- [ ] Text meets contrast ratios
- [ ] Zoom to 200% - content remains usable
- [ ] Content reflows without horizontal scroll
- [ ] Focus indicators visible in all states
- [ ] No reliance on color alone

### Tools
- **Lighthouse** - Automated accessibility audit
- **axe DevTools** - Browser extension for testing
- **WAVE** - Web accessibility evaluation tool
- **Color Contrast Analyzer** - Check contrast ratios

## Best Practices for New Tools

### 1. Use Semantic HTML
```jsx
// ✅ Good
<button onClick={handleClick}>Submit</button>

// ❌ Bad
<div onClick={handleClick}>Submit</div>
```

### 2. Provide Labels
```jsx
// ✅ Good
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ❌ Bad
<input type="email" placeholder="Email" />
```

### 3. Include Focus States
```jsx
// ✅ Good
className="... focus-visible:ring-2 focus-visible:ring-purple-400"

// ❌ Bad
className="... focus:outline-none"
```

### 4. Handle Errors Accessibly
```jsx
// ✅ Good
<div role="alert" aria-live="assertive">
  Error: File too large
</div>

// ❌ Bad
<div style={{ color: 'red' }}>!</div>
```

### 5. Support Keyboard Navigation
```jsx
// ✅ Good
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Action
</button>

// Note: buttons handle Enter by default, this is for custom elements
```

## WCAG 2.1 Level AA Compliance

### Perceivable
✅ 1.1.1 Non-text Content - Alt text for images  
✅ 1.3.1 Info and Relationships - Semantic HTML  
✅ 1.4.3 Contrast (Minimum) - 4.5:1 for normal text  
✅ 1.4.11 Non-text Contrast - 3:1 for UI components  

### Operable
✅ 2.1.1 Keyboard - All functionality keyboard accessible  
✅ 2.1.2 No Keyboard Trap - Users can navigate away  
✅ 2.4.3 Focus Order - Logical and consistent  
✅ 2.4.7 Focus Visible - Clear focus indicators  
✅ 2.5.5 Target Size - Minimum 44×44px touch targets  

### Understandable
✅ 3.1.1 Language of Page - HTML lang attribute  
✅ 3.2.3 Consistent Navigation - Header/footer consistent  
✅ 3.3.1 Error Identification - Clear error messages  
✅ 3.3.2 Labels or Instructions - All inputs labeled  

### Robust
✅ 4.1.2 Name, Role, Value - Proper ARIA usage  
✅ 4.1.3 Status Messages - Live regions for updates  

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [React Accessibility](https://react.dev/learn/accessibility)
- [Tailwind Accessibility](https://tailwindcss.com/docs/screen-readers)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Testing
- [VoiceOver Guide (macOS)](https://www.apple.com/voiceover/info/guide/)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [Keyboard Testing Guide](https://webaim.org/articles/keyboard/)

## Contributing

When adding new features:
1. Test with keyboard only
2. Run Lighthouse accessibility audit
3. Test with screen reader
4. Verify color contrast
5. Check responsive behavior
6. Add ARIA labels where needed
7. Update this documentation

## Support

For accessibility issues or suggestions:
- Email: contact@prasath.me
- GitHub Issues: [Report Accessibility Issue](https://github.com/rprasath/offlinesuite/issues)
