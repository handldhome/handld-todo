// App constants

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Handld Todo';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Smart list IDs (virtual, not in database)
export const SMART_LISTS = {
  INBOX: 'inbox',
  ALL: 'all',
  TODAY: 'today',
  STARRED: 'starred',
  COMPLETED: 'completed',
} as const;

// Default colors for lists
export const LIST_COLORS = [
  '#D64545', // Red (default)
  '#E67E22', // Orange
  '#F5A623', // Yellow
  '#27AE60', // Green
  '#3498DB', // Blue
  '#9B59B6', // Purple
  '#1ABC9C', // Teal
  '#95A5A6', // Gray
] as const;

// Default icons for lists
export const LIST_ICONS = [
  'list',
  'inbox',
  'home',
  'briefcase',
  'shopping-cart',
  'heart',
  'star',
  'bookmark',
  'folder',
  'tag',
] as const;

// Animation durations (in ms)
export const ANIMATIONS = {
  CHECKBOX_FILL: 300,
  CHECKMARK_DRAW: 200,
  STRIKETHROUGH: 200,
  TASK_SLIDE: 300,
  STAR_BOUNCE: 200,
  PANEL_SLIDE: 300,
} as const;

// Layout dimensions
export const LAYOUT = {
  SIDEBAR_WIDTH: 280,
  DETAIL_PANEL_WIDTH: 400,
  TASK_ITEM_HEIGHT: 52,
  SIDEBAR_ITEM_HEIGHT: 40,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
} as const;

// Keyboard shortcuts
export const SHORTCUTS = {
  NEW_TASK: 'n',
  TOGGLE_COMPLETE: ' ', // Space
  TOGGLE_STAR: 's',
  DELETE: ['Delete', 'Backspace'],
  ESCAPE: 'Escape',
  NAVIGATE_UP: 'ArrowUp',
  NAVIGATE_DOWN: 'ArrowDown',
  NEW_LIST: 'Shift+Meta+n',
} as const;
