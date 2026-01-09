# Happy HOA Typography Guidelines

## Font Stack

### Primary Font: Inter
- **Font Family:** `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif`
- **Type:** Humanist sans-serif
- **Weight Range:** 300, 400, 500, 600, 700
- **Usage:** All UI, buttons, labels, body text
- **Characteristics:** Clean, modern, excellent on-screen readability

### Secondary Font: Merriweather
- **Font Family:** `Merriweather, Georgia, serif`
- **Type:** Serif
- **Weight Range:** 400, 700
- **Usage:** Headlines, marketing pages, emphasis text
- **Characteristics:** Elegant, professional, traditional appeal

## Heading Scale

### H1 - Page Titles
- **Font Size:** 32px (2rem)
- **Font Weight:** 700 (Bold)
- **Line Height:** 1.2 (38.4px)
- **Letter Spacing:** -0.02em
- **Font Family:** Merriweather
- **Color:** #1F2937 (Charcoal)
- **Margin Bottom:** 24px
- **Usage:** Main page headings, section titles

### H2 - Section Headings
- **Font Size:** 24px (1.5rem)
- **Font Weight:** 600 (Semibold)
- **Line Height:** 1.3 (31.2px)
- **Letter Spacing:** -0.01em
- **Font Family:** Inter
- **Color:** #1F2937 (Charcoal)
- **Margin Bottom:** 16px
- **Usage:** Section headers, subsection titles

### H3 - Subsection Headings
- **Font Size:** 20px (1.25rem)
- **Font Weight:** 600 (Semibold)
- **Line Height:** 1.4 (28px)
- **Letter Spacing:** 0em
- **Font Family:** Inter
- **Color:** #1F2937 (Charcoal)
- **Margin Bottom:** 12px
- **Usage:** Feature titles, card headers

### H4 - Tertiary Headings
- **Font Size:** 16px (1rem)
- **Font Weight:** 600 (Semibold)
- **Line Height:** 1.5 (24px)
- **Letter Spacing:** 0em
- **Font Family:** Inter
- **Color:** #1F2937 (Charcoal)
- **Margin Bottom:** 8px
- **Usage:** Labels, form titles, list headers

## Body Text

### Large Body
- **Font Size:** 16px (1rem)
- **Font Weight:** 400 (Regular)
- **Line Height:** 1.6 (25.6px)
- **Letter Spacing:** 0em
- **Font Family:** Inter
- **Color:** #1F2937 (Charcoal)
- **Usage:** Large body paragraphs, important text

### Regular Body
- **Font Size:** 14px (0.875rem)
- **Font Weight:** 400 (Regular)
- **Line Height:** 1.6 (22.4px)
- **Letter Spacing:** 0.2px
- **Font Family:** Inter
- **Color:** #1F2937 (Charcoal)
- **Usage:** Standard body text, form content, descriptions

### Small Body
- **Font Size:** 12px (0.75rem)
- **Font Weight:** 400 (Regular)
- **Line Height:** 1.5 (18px)
- **Letter Spacing:** 0.3px
- **Font Family:** Inter
- **Color:** #6B7280 (Slate)
- **Usage:** Helper text, captions, metadata

### Extra Small
- **Font Size:** 11px (0.6875rem)
- **Font Weight:** 500 (Medium)
- **Line Height:** 1.5 (16.5px)
- **Letter Spacing:** 0.5px
- **Font Family:** Inter
- **Color:** #9CA3AF (Gray)
- **Usage:** Badges, tags, small labels

## Button Text

### Primary Button
- **Font Size:** 14px (0.875rem)
- **Font Weight:** 600 (Semibold)
- **Line Height:** 1.5 (21px)
- **Letter Spacing:** 0em
- **Font Family:** Inter
- **Text Transform:** None
- **Usage:** Call-to-action buttons

### Secondary Button
- **Font Size:** 14px (0.875rem)
- **Font Weight:** 500 (Medium)
- **Line Height:** 1.5 (21px)
- **Letter Spacing:** 0em
- **Font Family:** Inter
- **Text Transform:** None
- **Usage:** Secondary actions

## Form Labels

### Label Text
- **Font Size:** 14px (0.875rem)
- **Font Weight:** 500 (Medium)
- **Line Height:** 1.4 (19.6px)
- **Letter Spacing:** 0em
- **Font Family:** Inter
- **Color:** #374151 (Dark Gray)
- **Margin Bottom:** 6px
- **Usage:** Form field labels, input labels

### Placeholder Text
- **Font Size:** 14px (0.875rem)
- **Font Weight:** 400 (Regular)
- **Color:** #D1D5DB (Placeholder Gray)
- **Opacity:** 0.7
- **Usage:** Form input placeholders

## CSS Custom Properties

```css
/* Headings */
--heading-h1: 2rem / 1.2;
--heading-h2: 1.5rem / 1.3;
--heading-h3: 1.25rem / 1.4;
--heading-h4: 1rem / 1.5;

/* Body Text */
--text-large: 1rem / 1.6;
--text-base: 0.875rem / 1.6;
--text-small: 0.75rem / 1.5;
--text-xs: 0.6875rem / 1.5;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Font Families */
--font-sans: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
--font-serif: Merriweather, Georgia, serif;
```

## Accessibility

- **Minimum font size:** 12px for all user-facing text
- **Line height minimum:** 1.4 for improved readability
- **Color contrast:** All text meets WCAG AA standards (4.5:1 minimum for normal text)
- **Text spacing:** Adjustable line height and letter spacing for accessibility
- **Font loading:** Web fonts use system fallbacks for optimal performance

## Usage Guidelines

1. **Hierarchy:** Use heading scale to establish clear visual hierarchy
2. **Consistency:** Maintain consistent font families and weights across similar elements
3. **Readability:** Ensure sufficient contrast and line height for body text
4. **Mobile:** Reduce heading sizes by 1-2 steps on devices < 640px wide
5. **Performance:** Use font-display: swap for faster font loading

## Font Sources  
- Inter: [Google Fonts](https://fonts.google.com/specimen/Inter)  
- Merriweather: [Google Fonts](https://fonts.google.com/specimen/Merriweather)  