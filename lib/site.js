// Shared site-level constants for social/link previews.
// Kept out of lib/contentful.js so page components can import them without
// pulling the Contentful client (and its env-var check) into the browser bundle.

export const SITE_URL = 'https://zachscheinfeld.com';
export const SITE_NAME = 'Zach Scheinfeld Design';
export const SITE_DESCRIPTION = 'Multidisciplinary designer, artist, and creative programmer';

// Drop the image at public/og-image.jpg (1200x630 works best).
export const SITE_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
