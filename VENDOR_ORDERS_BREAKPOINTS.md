# Vendor Orders - Responsive Breakpoints Quick Reference

## 📱 Device Breakpoints & Key Features

```
┌─────────────────────────────────────────────────────────────────────┐
│                      RESPONSIVE BREAKPOINTS                         │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────┐
│  ≤ 480px      │  EXTRA SMALL PHONES
│  Ultra Compact│  
└───────────────┘
  • Single column cards
  • Font: 0.675rem - 0.875rem
  • Buttons: 38-42px height
  • Padding: 0.625rem
  • Grid actions: 2 columns

┌───────────────┐
│  481-768px    │  MOBILE DEVICES
│  Standard     │
└───────────────┘
  • Single column cards
  • Font: 0.7rem - 0.95rem
  • Buttons: 40-44px height
  • Padding: 0.875rem
  • Horizontal scroll tabs
  • Full-screen modals

┌────────────────┐
│  769-1024px    │  TABLETS
│  Two-Column    │
└────────────────┘
  • Two column cards
  • Font: 0.75rem - 1rem
  • Better spacing
  • Padding: 1.25rem
  • Wrapping tabs
  • Centered modals

┌─────────────────┐
│  1025px+        │  DESKTOP
│  Multi-Column   │
└─────────────────┘
  • Auto-fill grid (3-4 cols)
  • Font: 0.875rem - 1rem
  • Hover effects
  • Default spacing
  • Full features

```

## 🎨 Visual Layout Comparison

### Mobile (≤ 768px)
```
┌──────────────────────────┐
│  📋 Title & Subtitle     │
├──────────────────────────┤
│ [All][Pending][Paid]...→ │ ← Horizontal scroll
├──────────────────────────┤
│ 🔍 Search box (full)     │
├──────────────────────────┤
│ [Print][Sort] (grid 2x1) │
│ [Filters]     (grid 2x1) │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │   Order Card #1      │ │
│ │   (full width)       │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │   Order Card #2      │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│   [Prev]  Page  [Next]   │
└──────────────────────────┘
```

### Tablet (769-1024px)
```
┌───────────────────────────────────┐
│  📋 Title                         │
├───────────────────────────────────┤
│ [All] [Pending] [Paid] [Shipped] │ ← Wrapping
│ [Delivered] [Cancelled]           │
├───────────────────────────────────┤
│ 🔍 Search box | [Print][Sort][⚙️] │
├───────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ │
│ │ Order Card 1 │ │ Order Card 2 │ │
│ └──────────────┘ └──────────────┘ │
│ ┌──────────────┐ ┌──────────────┐ │
│ │ Order Card 3 │ │ Order Card 4 │ │
│ └──────────────┘ └──────────────┘ │
├───────────────────────────────────┤
│      [Prev]  Page 1  [Next]       │
└───────────────────────────────────┘
```

### Desktop (1025px+)
```
┌──────────────────────────────────────────────────┐
│  📋 Orders Dashboard - Manage Your Orders        │
├──────────────────────────────────────────────────┤
│ [All] [Pending] [Paid] [Shipped] [Delivered] [X] │
├──────────────────────────────────────────────────┤
│ 🔍 Search orders...      [Print][Sort][Filters]  │
├──────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ Card 1  │ │ Card 2  │ │ Card 3  │ │ Card 4  │ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ Card 5  │ │ Card 6  │ │ Card 7  │ │ Card 8  │ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
├──────────────────────────────────────────────────┤
│          [Prev]  📄 Page 1 / 5  [Next]           │
└──────────────────────────────────────────────────┘
```

## 🎯 Touch Target Sizes

```
Component              Mobile    Tablet    Desktop
─────────────────────────────────────────────────
Status Tabs            38-40px   42px      44px
Action Buttons         38-44px   42px      40px
Search Input           40px      42px      44px
Expand Button          40-42px   42px      44px
Chat Send Button       42-44px   44px      44px
Pagination Buttons     40-42px   42px      40px
Icon Buttons (chat)    30-32px   32px      32px
```

## 📏 Typography Scale

```
Element              XS          Mobile      Tablet      Desktop
──────────────────────────────────────────────────────────────────
Page Title           1.35rem     1.5rem      1.75rem     2rem
Order ID             0.875rem    0.95rem     0.95rem     0.95rem
Created Date         0.65rem     0.7rem      0.75rem     0.75rem
Status Pill          0.6rem      0.65rem     0.7rem      0.75rem
Info Labels          0.7rem      0.75rem     0.8rem      0.85rem
Info Values          0.75rem     0.8rem      0.85rem     0.9rem
Item Name            0.75rem     0.8rem      0.85rem     0.9rem
Buttons              0.675rem    0.7-0.8rem  0.8rem      0.875rem
```

## 🎨 Spacing Scale

```
Padding/Margin       XS          Mobile      Tablet      Desktop
──────────────────────────────────────────────────────────────────
Page Padding         0.625rem    0.875rem    1.25rem     1.5-2rem
Card Padding         0.875rem    1rem        1.15rem     1.25rem
Card Gap             0.875rem    1rem        1.15rem     1rem
Button Gap           0.45rem     0.5rem      0.5-0.75rem 0.45rem
Section Gap          0.75rem     0.875rem    1rem        1.15rem
```

## 🔄 Grid Layouts

```css
/* Mobile (≤ 768px) */
.cards-grid {
  grid-template-columns: 1fr;
  gap: 0.875rem-1rem;
}

/* Tablet (769px - 1024px) */
.cards-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 1.15rem;
}

/* Desktop (1025px+) */
.cards-grid {
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1rem;
}
```

## 🎭 Action Buttons Layout

### Mobile (≤ 768px)
```
┌────────────┬────────────┐
│   Ship     │   Cancel   │
├────────────┼────────────┤
│   Print    │   More     │
└────────────┴────────────┘
Grid: 2 columns
```

### Tablet & Desktop
```
[Ship] [Cancel] [Print] [More]
Flex: Horizontal row with wrapping
```

## 🗨️ Modal Behavior

### Mobile
```
┌──────────────────┐
│                  │
│  Full Screen     │
│  100vh × 100vw   │
│  No border       │
│  No radius       │
│                  │
└──────────────────┘
```

### Tablet & Desktop
```
    ┌──────────┐
    │          │
    │ Centered │
    │ Modal    │
    │ Max 90vh │
    │          │
    └──────────┘
```

## 🎨 Status Tabs Behavior

### Mobile (≤ 768px)
```
[All] [Pending] [Paid] [Shipped] ──→
    ↑                           ↑
  Visible                   Scroll to view
  
• Horizontal scroll
• No wrapping
• Scroll snap
• Thin scrollbar
```

### Tablet & Desktop
```
[All] [Pending] [Paid] [Shipped]
[Delivered] [Cancelled]

• Allow wrapping
• Full visibility
• Larger touch targets
```

## 🚦 Quick Testing Guide

### ✅ Mobile Test (375px)
1. Open DevTools
2. Set to iPhone SE (375px width)
3. Check:
   - Cards are full width ✓
   - Tabs scroll horizontally ✓
   - Buttons are in 2-column grid ✓
   - Modal is full screen ✓
   - All text is readable ✓

### ✅ Tablet Test (768px)
1. Set to iPad (768px width)
2. Check:
   - Cards are in 2 columns ✓
   - Search is horizontal ✓
   - Tabs wrap if needed ✓
   - Modal is centered ✓

### ✅ Desktop Test (1920px)
1. Set to full width
2. Check:
   - Cards auto-fill (3-4 cols) ✓
   - Hover effects work ✓
   - All features visible ✓
   - Clean spacing ✓

## 📱 Device Width Reference

```
320px  - iPhone SE (small)
375px  - iPhone 12/13/14
390px  - iPhone 12/13/14 Pro
414px  - iPhone 12/13/14 Plus
768px  - iPad Mini/Air
820px  - iPad
1024px - iPad Pro
1280px - Laptop (small)
1366px - Laptop (standard)
1920px - Desktop (full HD)
```

## 🎯 Priority Features by Device

### Mobile
- ✨ Quick status filtering
- 🔍 Easy search
- 📋 Readable card info
- 👆 Large tap targets
- 💬 Full-screen chat

### Tablet
- ⚡ Two-column efficiency
- 🎯 Better space usage
- 🖐️ Touch & mouse ready
- 📊 More data visible

### Desktop
- 🚀 Maximum productivity
- 🖱️ Hover interactions
- 📈 Multi-column view
- ⌨️ Keyboard shortcuts
- 🖨️ Print features

---

**Quick Tip:** Use browser DevTools responsive mode to test all breakpoints easily!
