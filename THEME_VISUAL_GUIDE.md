# 🎨 Theme System Visual Guide

## Color Palette Overview

### Light Theme
```
Background Colors:
├─ --bg-primary: #f8fafc (Light blue-gray)
├─ --bg-secondary: #f1f5f9 (Slightly darker)
└─ --surface: #ffffff (Pure white cards)

Text Colors:
├─ --text-primary: #1e293b (Dark slate)
├─ --text-secondary: #475569 (Medium slate)
└─ --text-tertiary: #64748b (Light slate)

Borders:
├─ --border-primary: #e2e8f0
└─ --border-secondary: #f1f5f9
```

### Dark Theme
```
Background Colors:
├─ --bg-primary: #0c182e (Deep navy)
├─ --bg-secondary: #1e293b (Lighter navy)
└─ --surface: #1e293b (Card background)

Text Colors:
├─ --text-primary: #f8fafc (Almost white)
├─ --text-secondary: #cbd5e1 (Light gray)
└─ --text-tertiary: #94a3b8 (Muted gray)

Borders:
├─ --border-primary: #334155
└─ --border-secondary: #475569
```

### Brand Colors (Both Themes)
```
Primary (Green):
├─ --color-primary: #1f8b4e
├─ --color-primary-light: rgba(31, 139, 78, 0.2)
└─ --color-primary-dark: #145c33

Success:
├─ --color-success: #22c55e
└─ --color-success-light: rgba(34, 197, 94, 0.2)

Danger:
├─ --color-danger: #ef4444
└─ --color-danger-light: rgba(239, 68, 68, 0.2)

Warning:
├─ --color-warning: #f59e0b
└─ --color-warning-light: rgba(245, 158, 11, 0.2)

Info:
├─ --color-info: #3b82f6
└─ --color-info-light: rgba(59, 130, 246, 0.2)
```

---

## Component Examples

### 1. Cards
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
  border-color: var(--color-primary);
}
```

### 2. Buttons
```css
.btn-primary {
  background: linear-gradient(135deg, 
    var(--color-primary), 
    var(--color-primary-dark)
  );
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### 3. Inputs
```css
.input {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--text-primary);
  border-radius: var(--radius-md);
}

.input:focus {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
```

### 4. Status Badges
```css
/* Paid */
.badge.paid {
  background: var(--color-success);
  color: white;
  box-shadow: 0 0 0 2px var(--color-success-light);
}

/* Pending */
.badge.pending {
  background: var(--color-warning);
  color: white;
  box-shadow: 0 0 0 2px var(--color-warning-light);
}

/* Failed */
.badge.failed {
  background: var(--color-danger);
  color: white;
  box-shadow: 0 0 0 2px var(--color-danger-light);
}
```

### 5. Modals
```css
.modal-overlay {
  background: var(--modal-overlay); /* Semi-transparent */
  backdrop-filter: blur(8px);
}

.modal-content {
  background: var(--surface);
  border: 1px solid var(--border-primary);
  border-top: 6px solid var(--color-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
}
```

---

## Spacing & Sizing

### Border Radius
```css
--radius-sm: 0.375rem   /* 6px - Small badges */
--radius-md: 0.5rem     /* 8px - Inputs, buttons */
--radius-lg: 0.75rem    /* 12px - Panels */
--radius-xl: 1rem       /* 16px - Cards */
--radius-full: 9999px   /* Pills, rounded badges */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)

--card-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1)
--card-shadow-hover: 0 10px 25px -5px rgba(0, 0, 0, 0.2)
```

---

## Animation Patterns

### 1. Hover Lift
```css
.element:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
}
```

### 2. Focus Glow
```css
.element:focus {
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
```

### 3. Active Scale
```css
.button:active {
  transform: scale(0.97);
}
```

### 4. Gradient Backgrounds
```css
background: linear-gradient(135deg, 
  var(--color-primary), 
  var(--color-primary-dark)
);
```

### 5. Smooth Transitions
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Usage Examples

### Creating a Themed Button
```vue
<button class="themed-btn">
  Click Me
</button>

<style scoped>
.themed-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  font-weight: 600;
  box-shadow: var(--shadow-md);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.themed-btn:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.themed-btn:active {
  transform: scale(0.97);
}
</style>
```

### Creating a Themed Card
```vue
<div class="themed-card">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>

<style scoped>
.themed-card {
  background: var(--surface);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.themed-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
  border-color: var(--color-primary);
}

.themed-card h3 {
  color: var(--text-primary);
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.themed-card p {
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
```

### Creating a Status Badge
```vue
<span :class="['status-badge', statusClass]">
  {{ status }}
</span>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.success {
  background: var(--color-success);
  color: white;
  box-shadow: 0 0 0 2px var(--color-success-light);
}

.status-badge.warning {
  background: var(--color-warning);
  color: white;
  box-shadow: 0 0 0 2px var(--color-warning-light);
}

.status-badge.danger {
  background: var(--color-danger);
  color: white;
  box-shadow: 0 0 0 2px var(--color-danger-light);
}
</style>
```

---

## Best Practices

### ✅ DO:
- Use semantic CSS variables (`--text-primary`, not `--text-color-1`)
- Add hover states to interactive elements
- Include focus indicators for accessibility
- Use consistent border radius from the system
- Apply smooth transitions for theme switching
- Test in both light and dark modes

### ❌ DON'T:
- Hardcode color values (#ffffff, rgb(0,0,0))
- Forget hover/focus states
- Use abrupt color changes without transitions
- Mix hardcoded and variable colors
- Skip accessibility contrast checks

---

## Quick Reference

### Most Common Patterns:
```css
/* Card */
background: var(--surface);
border: 1px solid var(--border-primary);
box-shadow: var(--card-shadow);

/* Button */
background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
color: white;

/* Input */
background: var(--input-bg);
border: 1px solid var(--input-border);
color: var(--text-primary);

/* Text */
color: var(--text-primary);      /* Headings */
color: var(--text-secondary);    /* Body */
color: var(--text-tertiary);     /* Labels */

/* Transitions */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

---

**Need Help?**  
Refer to `src/styles/themes.css` for the complete variable list!
