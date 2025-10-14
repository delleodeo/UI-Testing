# Product Dashboard - Visual Design Guide

## 🎨 Design System Overview

### Color Palette
```
Primary Green: #1f8b4e (Brand color)
Primary Hover: #166b3c (Darker green)
Success: #22c55e
Warning: #fbbf24
Danger: #ef4444
Info: #3b82f6

Light Theme:
- Background: #f8fafc
- Surface: #ffffff
- Text: #0f172a

Dark Theme:
- Background: #0c182e
- Surface: #1e293b
- Text: #f8fafc
```

### Spacing Scale
```
xs:  0.25rem (4px)
sm:  0.5rem  (8px)
md:  1rem    (16px)
lg:  1.5rem  (24px)
xl:  2rem    (32px)
2xl: 3rem    (48px)
```

### Border Radius
```
sm:   4px  (subtle)
md:   8px  (standard)
lg:   12px (cards)
xl:   16px (modals)
full: 50%  (circles)
```

---

## 📱 Products.vue Layout

### Desktop View (>1200px)
```
┌─────────────────────────────────────────────────────────┐
│  🎯 My Products                                   [FAB] │
│  Manage your product catalog and inventory              │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │ Total       │  │ In Stock    │                      │
│  │ Products    │  │ Products    │                      │
│  │    15       │  │    12       │                      │
│  └─────────────┘  └─────────────┘                      │
│                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │ Prod │  │ Prod │  │ Prod │  │ Prod │              │
│  │  1   │  │  2   │  │  3   │  │  4   │              │
│  └──────┘  └──────┘  └──────┘  └──────┘              │
│                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │ Prod │  │ Prod │  │ Prod │  │ Prod │              │
│  │  5   │  │  6   │  │  7   │  │  8   │              │
│  └──────┘  └──────┘  └──────┘  └──────┘              │
└─────────────────────────────────────────────────────────┘
```

### Mobile View (<768px)
```
┌──────────────────────┐
│  🎯 My Products      │
│  Manage your catalog │
│                      │
│  ┌────────┐ ┌──────┐│
│  │ Total  │ │ Stock││
│  │   15   │ │  12  ││
│  └────────┘ └──────┘│
│                      │
│  ┌──────────────────┐│
│  │ Product Card  1  ││
│  │                  ││
│  └──────────────────┘│
│                      │
│  ┌──────────────────┐│
│  │ Product Card  2  ││
│  │                  ││
│  └──────────────────┘│
│                      │
│           [FAB]      │
└──────────────────────┘
```

---

## 🎴 Product Card Anatomy

### Desktop Card Structure
```
┌─────────────────────────────┐
│ [New] [Hot]                 │ ← Badges (top-left)
│                             │
│    Product Image            │ ← 4:2.6 aspect ratio
│    (hover: scale 1.05)      │
│                             │
├─────────────────────────────┤
│ Product Name                │ ← Bold, 1rem
│                             │
│ ₱850.00        Sold (125)   │ ← Price & Sales
│                             │
│ ★★★★☆ 4.5 (89)             │ ← Rating
│                             │
│ [View Details]              │ ← CTA Button
└─────────────────────────────┘
```

### Hover States
```
Default State:
- Border: 1px solid var(--border-primary)
- Shadow: Minimal
- Transform: none

Hover State:
- Border: 1px solid rgba(255,255,255,0.28)
- Shadow: 0 10px 28px rgba(0,0,0,0.55)
- Transform: translateY(-4px)
- Image: scale(1.05)
```

---

## 🎯 Floating Action Button (FAB)

### Visual Design
```
┌─────────────────────┐
│                     │
│                     │
│                     │
│                     │
│              ┌───┐  │
│              │ + │  │ ← FAB Position
│              └───┘  │   (bottom-right)
│                     │
└─────────────────────┘

Button Specs:
- Size: 3.75rem × 3.75rem (60px)
- Background: Linear gradient (green)
- Shadow: Multi-layer
- Animation: Floating (3s infinite)
- Hover: Rotate 90deg + scale 1.15
```

### Animation Sequence
```
Idle State (0-3s loop):
  0s:   translateY(0)
  1.5s: translateY(-8px)
  3s:   translateY(0)

Hover State:
  - transform: scale(1.15) rotate(90deg)
  - shadow increases
  - glow effect appears
```

---

## 📋 VendorProductView Modal

### Desktop Modal Layout (>768px)
```
┌────────────────────────────────────────────────────┐
│  ✨ Product Name                            [X]    │ ← Sticky Header
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌─────────────────────────┐   │
│  │              │  │ Description text goes    │   │
│  │   Product    │  │ here with proper line    │   │
│  │    Image     │  │ height and formatting    │   │
│  │  (380×240)   │  │                          │   │
│  │              │  ├──────────────────────────┤   │
│  └──────────────┘  │ Stock:    50             │   │
│                    │ Sold:     125            │   │
│  [Edit] [Delete]   │ Rating:   4.5/5          │   │
│                    │ Price:    ₱850.00        │   │
│                    └──────────────────────────┘   │
│                                                     │
├────────────────────────────────────────────────────┤
│  ▌Product Options                  [+ Add Option]  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Option 1 │  │ Option 2 │  │ Option 3 │        │
│  │ 250g Bag │  │ 500g Bag │  │   1kg    │        │
│  │ ₱850.00  │  │ ₱1,200   │  │ ₱2,000   │        │
│  │ [E] [D]  │  │ [E] [D]  │  │ [E] [D]  │        │
│  └──────────┘  └──────────┘  └──────────┘        │
└────────────────────────────────────────────────────┘
```

### Mobile Modal Layout (<768px)
```
┌──────────────────────────┐
│ ✨ Product Name    [X]  │
├──────────────────────────┤
│                          │
│  ┌────────────────────┐ │
│  │                    │ │
│  │  Product Image     │ │
│  │                    │ │
│  └────────────────────┘ │
│                          │
│  Description text here   │
│                          │
│  ┌────────────────────┐ │
│  │ Stock:    50       │ │
│  │ Sold:     125      │ │
│  │ Rating:   4.5/5    │ │
│  │ Price:    ₱850.00  │ │
│  └────────────────────┘ │
│                          │
│  [Edit Product]          │
│  [Delete Product]        │
│                          │
├──────────────────────────┤
│  ▌Product Options        │
│  [+ Add Option]          │
│                          │
│  ┌────────────────────┐ │
│  │ Option 1           │ │
│  │ 250g Bag           │ │
│  │ ₱850.00            │ │
│  │ [Edit] [Delete]    │ │
│  └────────────────────┘ │
└──────────────────────────┘
```

---

## 🎭 Interactive States

### Button States
```css
/* Primary Button */
Default:
  background: linear-gradient(135deg, #1f8b4e, #166b3c)
  shadow: 0 4px 12px rgba(31,139,78,0.25)
  transform: none

Hover:
  shadow: 0 8px 20px rgba(31,139,78,0.35)
  transform: translateY(-2px)

Active:
  transform: translateY(0)

/* Outline Button */
Default:
  background: transparent
  border: 2px solid var(--border-primary)
  color: var(--text-primary)

Hover:
  background: var(--surface-hover)
  border-color: var(--color-primary)
  color: var(--color-primary)

/* Danger Button */
Default:
  background: var(--color-danger)
  color: white

Hover:
  background: var(--color-danger-hover)
  shadow increases
```

### Card Hover Effects
```css
Product Card:
  Default → Hover
  • Border: subtle → primary colored
  • Shadow: sm → lg
  • Transform: none → translateY(-4px)
  • Top bar: opacity 0 → 1

Option Card:
  Default → Hover
  • Border: primary colored
  • Shadow: lg
  • Transform: translateY(-4px)
  • Image: scale(1.05)
  • Top gradient bar appears
```

### Input Focus States
```css
Input/Textarea:
  Default:
    border: 1px solid var(--input-border)
  
  Focus:
    border: 1px solid var(--input-border-focus)
    box-shadow: 0 0 0 3px var(--color-primary-light)
    outline: none
```

---

## 🎬 Animations & Transitions

### Page Load Animations
```css
Section Fade In:
  Duration: 500ms
  Easing: cubic-bezier(0.4, 0, 0.2, 1)
  From: opacity 0, translateY(16px)
  To: opacity 1, translateY(0)

Header Slide Down:
  Duration: 600ms
  Delay: 0ms
  From: opacity 0, translateY(-20px)
  To: opacity 1, translateY(0)

Grid Fade Up:
  Duration: 700ms
  Delay: 100ms
  From: opacity 0, translateY(20px)
  To: opacity 1, translateY(0)
```

### FAB Animation
```css
Floating Animation:
  Duration: 3s
  Loop: infinite
  Easing: ease-in-out
  
  Keyframes:
    0%:   translateY(0)
    50%:  translateY(-8px)
    100%: translateY(0)
```

### Modal Transitions
```css
Modal Overlay:
  Duration: 300ms
  From: opacity 0
  To: opacity 1

Modal Content:
  Duration: 300ms
  Easing: cubic-bezier(0.4, 0, 0.2, 1)
  From: opacity 0, scale(0.94), translateY(20px)
  To: opacity 1, scale(1), translateY(0)
```

---

## 📐 Responsive Grid Behavior

### Products Grid Breakpoints
```css
Desktop (>1200px):
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))
  gap: 1.5rem

Tablet (768px - 1200px):
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))
  gap: 1.25rem

Mobile (480px - 768px):
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))
  gap: 1rem

Small Mobile (<480px):
  grid-template-columns: 1fr
  gap: 1rem
```

### Modal Product Details
```css
Desktop (>1024px):
  grid-template-columns: 380px 1fr
  
Tablet (768px - 1024px):
  grid-template-columns: 320px 1fr

Mobile (<768px):
  grid-template-columns: 1fr
```

---

## 🎨 Theme Switching

### Light Theme
```css
Background: #f8fafc (Cool gray)
Surface: #ffffff (Pure white)
Text: #0f172a (Dark blue-gray)
Borders: #e2e8f0 (Light gray)
Shadows: Subtle, low opacity
```

### Dark Theme
```css
Background: #0c182e (Deep blue)
Surface: #1e293b (Dark blue-gray)
Text: #f8fafc (Off-white)
Borders: #334155 (Medium gray)
Shadows: Deeper, higher opacity
```

### Transition Behavior
```css
All themeable properties:
  transition: 
    background 180ms ease,
    color 180ms ease,
    border-color 180ms ease
```

---

## 🎯 Touch Targets (Mobile)

### Minimum Touch Target Sizes
```
Buttons: 44px × 44px minimum
FAB: 52px × 52px (3.25rem)
Close buttons: 40px × 40px
Card tap areas: Full card height
Links: 44px minimum height
```

---

## 💡 Pro Tips

### Performance Optimization
- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating `height`, `width`, `top`, `left`
- Use `will-change` sparingly
- Implement `contain` property where appropriate

### Accessibility
- Maintain 4.5:1 contrast ratio for normal text
- 3:1 for large text (18px+)
- Provide focus indicators
- Support keyboard navigation
- Add ARIA labels to interactive elements

### Best Practices
- Use CSS variables for consistency
- Keep animations under 400ms
- Provide reduced motion alternatives
- Test on real devices
- Optimize images for web

---

## 📚 Component Hierarchy

```
Products.vue
├── Page Header
│   ├── Title + Icon
│   ├── Subtitle
│   └── Statistics Cards (×2)
├── Products Grid
│   └── VendorProductCard (×N)
│       ├── Image + Badges
│       ├── Product Info
│       ├── Price + Sales
│       ├── Rating
│       └── CTA Button
├── Empty State (conditional)
│   ├── Icon
│   ├── Message
│   └── CTA Button
└── FAB (Add Product)

VendorProductView.vue
├── Modal Overlay
└── Modal Content
    ├── Header (sticky)
    │   ├── Title + Icon
    │   └── Close Button
    ├── Body
    │   ├── Product Details
    │   │   ├── Image
    │   │   ├── Description
    │   │   └── Meta Cards
    │   ├── Header Actions
    │   │   ├── Edit Button
    │   │   └── Delete Button
    │   └── Options Section
    │       ├── Section Header
    │       ├── Add Option Button
    │       └── Options Grid
    │           └── Option Card (×N)
    │               ├── Image
    │               ├── Info
    │               ├── Badge
    │               └── Actions
    └── Forms (conditional)
        ├── ProductEditForm
        ├── OptionForm
        └── OptionEditForm
```

---

This visual guide provides a comprehensive overview of the design implementation. All measurements, colors, and animations are production-ready and tested across modern browsers.
