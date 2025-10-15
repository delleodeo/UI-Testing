# Dark Mode Implementation Guide

## ✅ Completed Components

### 1. Header.vue ✅
- Added theme toggle button with MoonIcon/SunIcon
- Integrated `useTheme` composable
- Updated all colors to use theme variables
- Added smooth transitions for theme switching

**Key Changes:**
```javascript
import { useTheme } from '../composables/useTheme'
const { isDark, toggleTheme } = useTheme()
```

**Theme Toggle Button:**
```vue
<button @click="toggleTheme" class="icon-button theme-toggle">
  <Transition name="theme-icon" mode="out-in">
    <SunIcon v-if="isDark" key="sun" class="action-icon" />
    <MoonIcon v-else key="moon" class="action-icon" />
  </Transition>
</button>
```

### 2. Home.vue ✅
- Integrated `useTheme` composable
- Updated background colors to `var(--bg-primary)`
- Updated text colors to `var(--text-primary)` and `var(--text-secondary)`
- Added transitions for smooth theme switching

### 3. Orders.vue (Customer Page) ✅
- Integrated `useTheme` composable
- Updated all containers to use `var(--surface)` and `var(--bg-primary)`
- Updated borders to use `var(--border-color)`
- Updated text colors to theme variables
- Added transitions throughout

**Pattern Used:**
```css
.order-card {
  background: var(--surface);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}
```

### 4. Profile.vue ✅
- Removed local `isDarkTheme` ref
- Integrated global `useTheme` composable
- Removed local `toggleTheme` function
- Updated all hardcoded colors to theme variables
- Replaced `isDarkTheme` with `isDark` in template

### 5. Auth.vue ✅
- Integrated `useTheme` composable
- Updated auth wrapper background to `var(--bg-primary)`
- Updated auth card to use `var(--surface)`
- Updated inputs to use theme variables
- Added transitions for smooth switching

## 🔄 Remaining Components (Implementation Pattern)

### ViewProduct.vue
**Steps to implement:**
1. Add import: `import { useTheme } from '../composables/useTheme'`
2. Add composable: `const { isDark } = useTheme()`
3. Update styles:
   - Container background: `var(--bg-primary)`
   - Product card: `var(--surface)`
   - Text colors: `var(--text-primary)`, `var(--text-secondary)`
   - Borders: `var(--border-color)`
   - Buttons: Keep existing button styles, add transition

**Key selectors to update:**
```css
.product-container {
  background: var(--bg-primary);
  transition: background-color var(--transition-fast);
}

.product-card {
  background: var(--surface);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.product-title {
  color: var(--text-primary);
  transition: color var(--transition-fast);
}

.product-description {
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}
```

### ViewSeller.vue
**Steps to implement:**
1. Add import and composable (same as above)
2. Update styles:
   - Seller page background: `var(--bg-primary)`
   - Seller card: `var(--surface)`
   - Product grid items: `var(--surface)`
   - Text colors: `var(--text-primary)`, `var(--text-secondary)`

### Search.vue
**Steps to implement:**
1. Add import and composable
2. Update styles:
   - Search container: `var(--surface)`
   - Search input background: `var(--bg-secondary)`
   - Search input text: `var(--text-primary)`
   - Suggestions dropdown: `var(--surface)`
   - Suggestion items hover: `var(--surface-hover)`

**Pattern for search:**
```css
.search-container {
  background: var(--surface);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.search-input {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.suggestions-dropdown {
  background: var(--surface);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
}

.suggestion-item:hover {
  background: var(--surface-hover);
}
```

### VendorProductView.vue
**Steps to implement:**
1. Add import and composable
2. Ensure modal overlay works in dark mode:
   - Modal background: `var(--surface)`
   - Modal overlay: Use semi-transparent background
   - Content areas: `var(--bg-secondary)`
   - Text colors: theme variables

**Modal pattern:**
```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background: var(--surface);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.modal-header {
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  color: var(--text-primary);
}
```

## 🎨 Modal Components to Update

### ConfirmationModal.vue
**Pattern:**
```css
.modal-backdrop {
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background: var(--surface);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  transition: all var(--transition-fast);
}

.modal-title {
  color: var(--text-primary);
}

.modal-message {
  color: var(--text-secondary);
}

.modal-buttons button {
  transition: all var(--transition-fast);
}
```

### CustomerChatModal.vue
**Already has theme support** ✅ (updated in previous fixes)
- Chat container uses theme variables
- Messages use theme colors
- Input area themed correctly

### ChangeProfileModal.vue
**Pattern:**
```css
.modal {
  background: var(--surface);
  border: 1px solid var(--border-color);
}

.modal-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.form-input {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.form-input:focus {
  border-color: var(--primary-color);
  background: var(--surface);
}
```

### CheckoutModal.vue
Similar pattern to ConfirmationModal - update all backgrounds, borders, and text colors.

### ProductSelectionModal.vue
Similar pattern - focus on product cards, options, and buttons.

## 🎯 CSS Variables Reference

All theme variables are defined in `src/styles/themes.css`:

### Light Mode (Default)
- `--bg-primary`: #f8fafc (Light gray background)
- `--bg-secondary`: #f1f5f9 (Slightly darker gray)
- `--surface`: #ffffff (White cards/surfaces)
- `--surface-hover`: #f1f5f9 (Hover state)
- `--text-primary`: #0f172a (Dark text)
- `--text-secondary`: #64748b (Gray text)
- `--text-inverse`: #ffffff (White text on dark backgrounds)
- `--border-color`: #e2e8f0 (Light borders)
- `--shadow-color`: rgba(0, 0, 0, 0.1)

### Dark Mode
- `--bg-primary`: #0f172a (Dark background)
- `--bg-secondary`: #1e293b (Slightly lighter)
- `--surface`: #1e293b (Dark cards/surfaces)
- `--surface-hover`: #334155 (Hover state)
- `--text-primary`: #f1f5f9 (Light text)
- `--text-secondary`: #94a3b8 (Gray text)
- `--text-inverse`: #0f172a (Dark text on light backgrounds)
- `--border-color`: #334155 (Dark borders)
- `--shadow-color`: rgba(0, 0, 0, 0.3)

### Consistent Colors (No change in themes)
- `--primary-color`: #1f8b4e (Green)
- `--color-primary`: #059669 (Emerald)
- `--secondary-color`: #ff7b00 (Orange)
- `--error-color`: #dc2626 (Red)
- `--success-color`: #10b981 (Green)
- `--warning-color`: #f59e0b (Amber)

### Transitions
- `--transition-fast`: all 0.2s ease

## 📋 Implementation Checklist

### Core Pages
- [x] Header.vue - Theme toggle button added ✅
- [x] Home.vue - Full theme support ✅
- [x] Orders.vue (Customer) - Complete theme integration ✅
- [x] Profile.vue - Global theme, removed local state ✅
- [x] Auth.vue - Login/Register forms themed ✅
- [ ] ViewProduct.vue - Product details page
- [ ] ViewSeller.vue - Seller shop page
- [ ] Search.vue - Search with suggestions
- [ ] Cart.vue - Shopping cart (if needed)

### Modals
- [x] CustomerChatModal.vue - Already updated ✅
- [ ] ConfirmationModal.vue - Confirmation dialogs
- [ ] ChangeProfileModal.vue - Profile editing
- [ ] CheckoutModal.vue - Checkout process
- [ ] ProductSelectionModal.vue - Product options

### Vendor Pages (Already themed from previous work)
- [x] Products.vue (Vendor Dashboard) ✅
- [x] VendorProductView.vue ✅
- [x] Orders.vue (Vendor Dashboard) ✅
- [x] Navigation.vue ✅
- [x] Analytics.vue ✅
- [x] AddProduct.vue ✅
- [x] VendorProductCard.vue ✅

## 🚀 Quick Implementation Template

For any remaining component:

```vue
<!-- Script Section -->
<script setup>
import { useTheme } from '../composables/useTheme'
const { isDark } = useTheme()
// ... rest of your imports and logic
</script>

<!-- Template Section -->
<template>
  <div class="component-container">
    <!-- Your content -->
  </div>
</template>

<!-- Style Section -->
<style scoped>
.component-container {
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px var(--shadow-color);
  transition: all var(--transition-fast);
}

.card:hover {
  box-shadow: 0 4px 6px var(--shadow-color);
}

.title {
  color: var(--text-primary);
  transition: color var(--transition-fast);
}

.description {
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.input {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.input:focus {
  border-color: var(--primary-color);
  background: var(--surface);
  outline: none;
}

.input::placeholder {
  color: var(--text-secondary);
}

.button {
  /* Keep existing button styles */
  transition: all var(--transition-fast);
}
</style>
```

## ✨ Best Practices

1. **Always add transitions** - Use `transition: all var(--transition-fast)` for smooth theme switching
2. **Use semantic variables** - `--text-primary` for main text, `--text-secondary` for less important text
3. **Maintain button colors** - Primary/secondary button colors should remain consistent (green/orange)
4. **Test both themes** - Toggle the theme to ensure everything looks good in both modes
5. **Check modals** - Modals should have proper contrast against both light and dark backgrounds
6. **Update placeholders** - Don't forget `::placeholder` pseudo-element for inputs
7. **Border visibility** - Ensure borders are visible in both themes
8. **Shadow consistency** - Use `var(--shadow-color)` for all box-shadows

## 🎨 Theme Toggle Location

The theme toggle button is in the **Header.vue** component, visible on all pages. Users can switch between light and dark mode by clicking the sun/moon icon.

## 🔧 Testing

To test the implementation:
1. Start the development server
2. Click the theme toggle in the header (moon icon for light mode, sun icon for dark mode)
3. Navigate through all pages to ensure consistency
4. Open modals and check they render correctly
5. Check form inputs, buttons, and interactive elements
6. Verify text contrast and readability
7. Check that transitions are smooth

## 📝 Notes

- Theme preference is saved to localStorage with key `'dashboard-theme'`
- System preference is detected on first visit
- Theme persists across page reloads and sessions
- All vendor dashboard pages already have full theme support from previous updates
- The theme system uses a singleton pattern in the `useTheme` composable
- HTML root element gets `theme-light` or `theme-dark` class applied

## 🎯 Priority Order

If implementing remaining components, prioritize in this order:
1. ViewProduct.vue (high traffic page)
2. Search.vue (frequently used)
3. ViewSeller.vue (medium traffic)
4. Modals (ConfirmationModal, ChangeProfileModal, etc.)
5. VendorProductView.vue modal
6. Any remaining components

---

**Last Updated:** Implementation completed for Header, Home, Orders (Customer), Profile, and Auth pages.
**Status:** 5/9 major components complete + theme infrastructure ✅
