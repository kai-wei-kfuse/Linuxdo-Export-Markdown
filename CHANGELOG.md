# Changelog

## v1.2.0 - 2026-06-04

### Added

- Add boost / direct reply summaries to HTML exports.
- Read real rendered Boost bubbles from the current Linux.do page instead of inferring them from reply relationships.

## v1.1.1 - 2026-06-04

### Changed

- Show the Markdown not-recommended hint only when exporting comments or custom post ranges.
- Keep the Markdown option unmarked when exporting the main post only.

## v1.1.0 - 2026-06-04

### Added

- Add complete HTML export as the recommended default export format.
- Add an export format selector with `HTML` and `Markdown（不推荐）` options.

### Changed

- Rename the floating export button from `导出 MD` to `导出`.
- Keep Markdown export available for users who still want plain Markdown output.

## v1.0.2 - 2026-06-04

### Fixed

- Fix Linux.do image attachment exports that included broken nested Markdown brackets.
- Export image attachment links as plain Markdown images and prefer the original image URL when available.

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
