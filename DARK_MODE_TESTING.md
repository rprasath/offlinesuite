# Dark Mode Visual Testing Checklist

## How to Test

1. **Toggle Theme**: Click the moon/sun icon in the header
2. **Test Each Tool**: Open every tool and verify visibility
3. **Check Contrast**: Ensure all text is readable

## Quick Test Steps

### Dashboard
- [ ] Tool icons visible (purple in light, light purple in dark)
- [ ] Tool card backgrounds change
- [ ] Search bar readable
- [ ] Category filters visible
- [ ] Footer text readable

### Individual Tools

#### PDF Tools
- [ ] **PDF Merger** - Forms, buttons, file list
- [ ] **PDF Compressor** - Settings panel, quality options
- [ ] **PDF Splitter** - Range inputs, page selector
- [ ] **PDF Watermark** - Position controls, preview
- [ ] **PDF to Images** - Format selector, download options
- [ ] **PDF Metadata** - Form fields, metadata display
- [ ] **PDF Sign** - Signature pad, position controls
- [ ] **PDF Diff** - Comparison view, results

#### Image Tools
- [ ] **Passport Photo** - Size selector, adjustment controls
- [ ] **Background Remover** - Upload area, result display
- [ ] **Image Compressor** - Quality slider, file list
- [ ] **Image Converter** - Format options, settings
- [ ] **Image Editor** - Tools panel, filter controls

#### Other Tools
- [ ] **QR Generator** - Type selector, color pickers, form inputs
- [ ] **Signature Maker** - Step indicators, adjustment controls
- [ ] **Invoice Generator** - Form fields, template selector
- [ ] **Text Diff** - Text areas, comparison view

## What to Look For

### ✅ Good (Fixed)
- Icons have color (purple/light purple)
- Backgrounds adapt to theme
- Text is clearly readable
- Borders visible but not harsh
- Smooth transitions

### ❌ Bad (If Found)
- Black icons on dark background
- White boxes in dark mode
- Low contrast text
- Invisible borders
- Harsh color changes

## Common Elements to Check

### In Every Tool:
1. **Upload Areas** - Background, border, text
2. **Form Inputs** - Background, border, placeholder text
3. **Buttons** - Background, text, hover states
4. **Cards/Panels** - Background, borders
5. **Help Text** - Color and readability
6. **Error Messages** - Visibility
7. **Success Messages** - Contrast

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## System Theme Detection

Test automatic detection:
1. Set system to dark mode
2. Open app in new browser window
3. Verify app opens in dark mode
4. Change system to light mode
5. Refresh app
6. Verify app switches to light (if no preference saved)

## LocalStorage Persistence

1. Set theme to dark
2. Refresh page
3. Verify theme stays dark
4. Close browser
5. Reopen app
6. Verify theme is still dark

## Accessibility

- [ ] Tab through all controls (focus visible)
- [ ] Theme toggle has aria-label
- [ ] All icons have proper contrast
- [ ] Form labels associated with inputs

## Mobile Responsiveness

On mobile/tablet:
- [ ] Theme toggle button accessible
- [ ] Tool cards readable
- [ ] Forms usable
- [ ] Touch targets adequate size

## Performance

- [ ] Theme toggle instant (no lag)
- [ ] Smooth transitions
- [ ] No flash of unstyled content
- [ ] HMR working in dev mode

## Report Issues

If you find any visibility issues:
1. Note the tool name
2. Note the specific element (button, form, etc.)
3. Take a screenshot if possible
4. Check browser console for errors
5. Report in GitHub issues

## Known Good Patterns

These should be visible everywhere:

**Light Mode:**
- Purple icons: `text-purple-600`
- White backgrounds: `bg-white`
- Gray text: `text-gray-600`, `text-gray-800`
- Gray borders: `border-gray-200`, `border-gray-300`

**Dark Mode:**
- Light purple icons: `dark:text-purple-400`
- Dark backgrounds: `dark:bg-gray-800`
- Light gray text: `dark:text-gray-200`, `dark:text-gray-400`
- Dark gray borders: `dark:border-gray-700`, `dark:border-gray-600`

## Success Criteria

✅ **All Passed** if:
- Every tool is usable in both themes
- No black icons on dark backgrounds
- No white panels in dark mode
- All text readable with proper contrast
- Smooth transitions between themes
- Theme preference persists
