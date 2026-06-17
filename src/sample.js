// Sample markdown, bundled inline so the empty state's "Open sample" button
// works in every build mode (dev server, MSI install, standalone exe) without
// any filesystem dependency.

export const SAMPLE_MARKDOWN = `# MDView — Sample

A quick tour of what MDView renders well.

## Headings, lists, and inline

You can write **bold**, *italic*, ~~strikethrough~~, and \`inline code\`. Links open in your default browser.

- Bullet one
- Bullet two with \`code\`
- Bullet three

1. Numbered first
2. Numbered second
3. Numbered third

> Blockquotes use the accent color for the rule. They're good for callouts, references, and notes from the author.

## Code

\`\`\`javascript
// marked + highlight.js handle the heavy lifting
function render(markdown) {
  const html = marked.parse(markdown, { gfm: true });
  return DOMPurify.sanitize(html);
}
\`\`\`

\`\`\`rust
fn main() {
    let greeting = "hello, mdview";
    println!("{greeting}");
}
\`\`\`

## Tables

| Feature         | Status | Notes                          |
|-----------------|--------|--------------------------------|
| Markdown render | done   | GFM tables, lists, task lists  |
| Syntax highlight| done   | 14+ languages, color-tuned     |
| Drag & drop     | done   | Drop a \`.md\` anywhere in window|
| Outline nav     | done   | Auto-built from headings       |

## Task lists

- [x] Open a file
- [x] Render markdown
- [x] Syntax highlight
- [ ] Take a break

## A long section to test the reader

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Subsubheading

Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida.

> Nested callouts work too. This one is short.

## That's it

Hit \`Ctrl+O\` (or \`Cmd+O\`) to open a file, \`Ctrl+B\` to toggle the outline, \`Ctrl+=\` / \`Ctrl+-\` to zoom.
`;
