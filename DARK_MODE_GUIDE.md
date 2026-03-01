# Dark Mode Implementation Guide

## Overview
OfflineSuite now includes a complete dark/light theme system with automatic system preference detection, localStorage persistence, and full accessibility support.

## Features Implemented

### 🌓 Theme System
- **Light and Dark modes** with smooth transitions
- **System preference detection** - automatically detects user's OS theme preference
- **LocalStorage persistence** - remembers user's theme choice across sessions
- **Theme toggle button** in header with keyboard accessibility

### 🎨 Styling Updates
All components have been updated with dark mode support:
- **Layout** - Header, footer with dark mode colors
- **Dashboard** - Tool cards, search, filters, categories
- **ToolPage** - Tool header, content containers
- **FAQ** - Questions, answers, contact section
- **NotFound** - Error page styling

### ♿ Accessibility Improvements
- **Keyboard navigation** - All interactive elements are keyboard accessible
- **Focus indicators** - Clear visual focus states using `focus-visible:ring`
- **ARIA labels** - Proper labels for screen readers
- **Color contrast** - WCAG AA compliant contrast ratios
- **Semantic HTML** - Proper heading hierarchy

## Usage

### For Users
1. **Toggle theme**: Click the sun/moon icon in the header
2. **Keyboard shortcut**: Tab to the theme button, press Enter
3. **Auto-detection**: Theme automatically matches your system preference on first visit

### For Developers

#### Using the Theme Hook
```jsx
import { useTheme } from '@hooks/useTheme'

function MyComponent() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  )
}
```

#### Adding Dark Mode to New Components
Use Tailwind's `dark:` variant:

```jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  <h1 className="text-purple-600 dark:text-purple-400">Title</h1>
  <p className="text-gray-600 dark:text-gray-400">Content</p>
</div>
```

#### Color Palette
**Light Mode:**
- Background: `bg-white`, `from-blue-50 via-purple-50 to-pink-50`
- Text: `text-gray-800`, `text-gray-600`
- Borders: `border-purple-200`, `border-gray-200`
- Accent: `text-purple-600`, `text-pink-600`

**Dark Mode:**
- Background: `dark:bg-gray-800`, `dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`
- Text: `dark:text-gray-200`, `dark:text-gray-400`
- Borders: `dark:border-gray-700`, `dark:border-gray-600`
- Accent: `dark:text-purple-400`, `dark:text-pink-400`

## Technical Implementation

### Theme Context
Located in `src/hooks/useTheme.jsx`:
- Manages theme state
- Syncs with localStorage
- Applies `dark` class to document root
- Exports `ThemeProvider` and `useTheme` hook

### Tailwind Configuration
`tailwind.config.js` updated with:
```js
darkMode: 'class'
```

### Main App Structure
`src/main.jsx` wraps app with ThemeProvider:
```jsx
<ThemeProvider>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</ThemeProvider>
```

### CSS Improvements
`src/index.css`:
- Custom scrollbar for light and dark modes
- Smooth transitions
- Consistent styling across themes

## Accessibility Checklist

✅ **Keyboard Navigation**
- All buttons focusable with Tab
- Enter/Space activates buttons
- Clear focus indicators

✅ **Screen Readers**
- ARIA labels on icon-only buttons
- `aria-label` for theme toggle
- `aria-live` regions for dynamic content

✅ **Visual Accessibility**
- High contrast text in both themes
- Focus rings visible in all states
- No color-only information

✅ **Motion**
- Smooth transitions
- No jarring animations
- Respects user preferences

## Testing

### Manual Testing
1. ✅ Toggle theme button works
2. ✅ Theme persists on page reload
3. ✅ System preference detection works
4. ✅ All pages render correctly in both modes
5. ✅ Focus states visible with keyboard navigation
6. ✅ Scrollbars styled appropriately

### Browser Testing
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Future Enhancements

### Potential Improvements
- [ ] Auto dark mode based on time of day
- [ ] Additional themes (high contrast, sepia, etc.)
- [ ] Per-tool theme preferences
- [ ] Keyboard shortcut for theme toggle (Ctrl+Shift+T)
- [ ] Theme transition animations

## Troubleshooting

### Theme not persisting
- Check localStorage is enabled in browser
- Clear localStorage and refresh

### Colors not updating
- Verify Tailwind's `dark:` classes are present
- Check `dark` class on `<html>` element
- Rebuild with `npm run build`

### Focus indicators not visible
- Ensure `focus-visible:ring-*` classes are applied
- Check browser focus indicator settings

## Component Checklist

Components updated with dark mode:
- ✅ Layout.jsx - Header, footer, navigation
- ✅ Dashboard.jsx - Tool cards, search, filters
- ✅ ToolPage.jsx - Tool header, content area
- ✅ FAQ.jsx - Questions, answers
- ✅ NotFound.jsx - 404 page
- ⏳ Individual tool components (to be updated as needed)

## Resources

- [Tailwind Dark Mode Docs](https://tailwindcss.com/docs/dark-mode)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Web Accessibility Initiative](https://www.w3.org/WAI/)
