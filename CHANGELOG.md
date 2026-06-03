# Changelog

## v1.0.1 - 2026-06-03

### Changed

- Render each exported comment label as bold text instead of a Markdown heading.
- Collapse image links that point to the same image into plain Markdown images.

### Fixed

- Avoid visually noisy Markdown like `[![image](image-url)](image-url)` when the link target is the image itself.
- Keep image links clickable only when the link target differs from the image source.

## v1.0.0 - 2026-06-03

Initial public release.

### Added

- Export Linux.do topics to Markdown from Tampermonkey/Violentmonkey.
- Automatically detect flat mode from `/t/topic/{id}` links.
- Automatically detect nest mode from `/n/topic/{id}` links.
- Export the main post only, all replies, or a custom post range.
- Use an in-page dropdown dialog for export range selection.
- Fetch complete Discourse topic data, including posts not currently loaded on the page.
- Preserve common Markdown-friendly content:
  - Links
  - Images
  - Quotes
  - Code blocks
  - Lists
  - Headings
  - Bold and italic text
- Convert emoji-like images to `:name:` text when possible.
- Keep normal images as Markdown image links.
- Prepare userscript metadata for Greasy Fork publishing.

### Changed

- Comment metadata now omits duplicate `作者:` and `链接:` lines.
- Comment headings still keep post number and author for readability.

### Notes

- The script uses the browser's current Linux.do login session.
- Hidden, deleted, or inaccessible posts may be skipped during export.
- The built-in HTML-to-Markdown converter is lightweight and optimized for readable exports, not exact visual reproduction.
