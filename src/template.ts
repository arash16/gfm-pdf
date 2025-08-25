export interface TemplateOptions {
  title?: string;
  margins?: string;
  format?: string;
  enableMath?: boolean;
  enableMermaid?: boolean;
  enableSyntaxHighlighting?: boolean;
  customCss?: string;
  syntaxCss?: string;
}

export function generateHtmlTemplate(
  content: string,
  options: TemplateOptions = {},
): string {
  const {
    title = 'Markdown to PDF',
    enableMath = true,
    enableMermaid = true,
    enableSyntaxHighlighting = true,
    customCss = '',
    syntaxCss = '',
  } = options;

  const mathCss = enableMath
    ? `
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
  `
    : '';

  const mermaidScript = enableMermaid
    ? `
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11.0.1/dist/mermaid.min.js"></script>
    <script>
      mermaid.initialize({ 
        startOnLoad: true,
        theme: 'default',
        fontFamily: 'Arial, sans-serif'
      });
    </script>
  `
    : '';

  const syntaxHighlightingCss = enableSyntaxHighlighting
    ? `
    <style>
      ${syntaxCss}
    </style>
  `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  
  ${mathCss}
  
  ${syntaxHighlightingCss}
  
  <style>
    /* Base PDF styles */
    @page {
      margin: ${options.format !== 'Singular' ? (options.margins ?? '1cm') : '0'};
      padding: 0;
    }

    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: none;
      margin: 0;
      padding: 0;
      background: white;
    }
    
    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 2em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.25;
      color: #1a1a1a;
    }
    
    h1 {
      font-size: 2em;
      border-bottom: 2px solid #eaecef;
      padding-bottom: 0.3em;
      page-break-after: avoid;
    }
    
    h2 {
      font-size: 1.5em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 1.25em;
      page-break-after: avoid;
    }
    
    h4, h5, h6 {
      font-size: 1em;
      page-break-after: avoid;
    }
    
    /* Paragraphs and text */
    p {
      margin-bottom: 1em;
      orphans: 3;
      widows: 3;
    }
    
    /* Lists */
    ul, ol {
      margin-bottom: 1em;
      padding-left: 2em;
    }
    
    li {
      margin-bottom: 0.25em;
    }
    
    /* Code */
    code {
      font-family: 'Fira Code', 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
      font-size: 0.9em;
      background-color: rgba(27, 31, 35, 0.05);
      padding: 0.2em 0.4em;
      border-radius: 3px;
    }
    
    pre {
      background-color: #f6f8fa;
      border-radius: 6px;
      font-size: 0.85em;
      line-height: 1.45;
      overflow: auto;
      padding: 16px;
      margin: 1em 0;
      page-break-inside: avoid;
    }
    
    pre code {
      background: none;
      padding: 0;
    }
    
    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
      page-break-inside: avoid;
    }
    
    th, td {
      border: 1px solid #dfe2e5;
      padding: 6px 13px;
      text-align: left;
    }
    
    th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
    
    tr:nth-child(2n) {
      background-color: #f6f8fa;
    }
    
    /* Blockquotes */
    blockquote {
      border-left: 4px solid #dfe2e5;
      padding: 0 1em;
      margin: 1em 0;
      color: #6a737d;
    }
    
    blockquote > :first-child {
      margin-top: 0;
    }
    
    blockquote > :last-child {
      margin-bottom: 0;
    }
    
    /* Images */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
      page-break-inside: avoid;
    }
    
    /* Horizontal rules */
    hr {
      border: 0;
      height: 1px;
      background: #eaecef;
      margin: 2em 0;
    }
    
    /* Mermaid diagrams */
    .mermaid {
      text-align: center;
      margin: 1em 0;
      page-break-inside: avoid;
    }
    
    /* Math formulas */
    .katex-display {
      margin: 1em 0;
      text-align: center;
      page-break-inside: avoid;
    }
    
    /* Print optimizations */
    @media print {
      body {
        font-size: 12pt;
      }
      
      h1 {
        font-size: 18pt;
      }
      
      h2 {
        font-size: 16pt;
      }
      
      h3 {
        font-size: 14pt;
      }
      
      h4, h5, h6 {
        font-size: 12pt;
      }
      
      pre, code {
        font-size: 10pt;
      }
      
      /* Avoid page breaks in inappropriate places */
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
      }
      
      pre, blockquote, table, img, .mermaid {
        page-break-inside: avoid;
      }
      
      /* Keep content together */
      p, li {
        orphans: 3;
        widows: 3;
      }
    }

    main {
      padding: 0;
      margin: ${options.format === 'Singular' ? (options.margins ?? '0.5cm') : '0'};
      min-height: auto;
    }

    main > *:first-child {
      margin-top: 0 !important;
    }
    
    main > *:last-child {
      margin-bottom: 0 !important;
    }

    ${customCss}
  </style>
</head>
<body>
  <main>
    ${content}
  </main>
  
  ${mermaidScript}
  
  <script>
    // Wait for all content to load before signaling ready
    window.addEventListener('load', () => {
      // If Mermaid is present, wait for diagrams to render
      if (typeof mermaid !== 'undefined') {
        // Add a small delay to ensure all diagrams are rendered
        setTimeout(() => {
          document.body.setAttribute('data-ready', 'true');
        }, 1000);
      } else {
        document.body.setAttribute('data-ready', 'true');
      }
    });
    
    // Fallback in case load event doesn't fire
    setTimeout(() => {
      document.body.setAttribute('data-ready', 'true');
    }, 5000);
  </script>
</body>
</html>`;
}
