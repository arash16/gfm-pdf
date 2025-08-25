/* cSpell:ignore rehype katex mdast hast atrule prolog doctype cdata punctuation builtin Fira Consolas Andale */
import { unified, type Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkPrism from 'remark-prism';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

export interface MarkdownProcessorOptions {
  enableMath?: boolean;
  enableSyntaxHighlighting?: boolean;
  enableMermaid?: boolean;
  syntaxTheme?: string;
}

export class MarkdownProcessor {
  private options: Required<MarkdownProcessorOptions>;

  constructor(options: MarkdownProcessorOptions = {}) {
    this.options = {
      enableMath: options.enableMath ?? true,
      enableSyntaxHighlighting: options.enableSyntaxHighlighting ?? true,
      enableMermaid: options.enableMermaid ?? true,
      syntaxTheme: options.syntaxTheme ?? 'github',
    };
  }

  async processMarkdown(markdown: string): Promise<string> {
    const processor: Processor = unified();
    processor.use(remarkParse).use(remarkGfm); // GitHub Flavored Markdown support

    // Add math support
    if (this.options.enableMath) {
      processor.use(remarkMath);
    }

    // Add syntax highlighting
    if (this.options.enableSyntaxHighlighting) {
      // @ts-expect-error - remarkPrism has type compatibility issues with unified v11
      processor.use(remarkPrism, {
        plugins: [
          'line-numbers',
          // 'show-language',
        ],
      });
    }

    // Convert to HTML
    processor.use(remarkRehype, { allowDangerousHtml: true });

    // Add KaTeX for math rendering
    if (this.options.enableMath) {
      processor.use(rehypeKatex);
    }

    // Custom plugin for Mermaid diagrams
    if (this.options.enableMermaid) {
      processor.use(this.mermaidPlugin);
    }

    processor.use(rehypeStringify, {
      allowDangerousHtml: true,
    });

    const result = await processor.process(markdown);
    return String(result);
  }

  private mermaidPlugin = () => {
    return (tree: any) => {
      const visit = (node: any, callback: (node: any) => void) => {
        callback(node);
        if (node.children) {
          node.children.forEach((child: any) => visit(child, callback));
        }
      };

      visit(tree, (node: any) => {
        if (
          node.type === 'element' &&
          node.tagName === 'pre' &&
          node.children &&
          node.children[0] &&
          node.children[0].type === 'element' &&
          node.children[0].tagName === 'code'
        ) {
          const codeNode = node.children[0];
          const className = codeNode.properties?.className;

          if (className && className.includes('language-mermaid')) {
            // Convert code block to mermaid div
            node.tagName = 'div';
            node.properties = {
              className: ['mermaid'],
            };
            node.children = [
              {
                type: 'text',
                value: this.extractTextContent(codeNode),
              },
            ];
          }
        }
      });
    };
  };

  private extractTextContent(node: any): string {
    if (node.type === 'text') {
      return node.value || '';
    }

    if (node.children && Array.isArray(node.children)) {
      return node.children
        .map((child: any) => this.extractTextContent(child))
        .join('');
    }

    return '';
  }

  getSyntaxHighlightingCss(): string {
    // Return CSS for syntax highlighting theme
    switch (this.options.syntaxTheme) {
      case 'github':
        return `
          /* GitHub Theme for Prism.js */
          code[class*="language-"],
          pre[class*="language-"] {
            color: #24292e;
            background: none;
            font-family: 'Fira Code', 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
            font-size: 1em;
            text-align: left;
            white-space: pre;
            word-spacing: normal;
            word-break: normal;
            word-wrap: normal;
            line-height: 1.5;
            -moz-tab-size: 4;
            -o-tab-size: 4;
            tab-size: 4;
            -webkit-hyphens: none;
            -moz-hyphens: none;
            -ms-hyphens: none;
            hyphens: none;
          }

          pre[class*="language-"] {
            padding: 1em;
            margin: .5em 0;
            overflow: auto;
            background: #f6f8fa;
            border-radius: 6px;
          }

          :not(pre) > code[class*="language-"] {
            padding: .1em .3em;
            border-radius: .3em;
            white-space: normal;
            background: #f6f8fa;
          }

          .token.comment,
          .token.prolog,
          .token.doctype,
          .token.cdata {
            color: #6a737d;
          }

          .token.punctuation {
            color: #24292e;
          }

          .token.property,
          .token.tag,
          .token.constant,
          .token.symbol,
          .token.deleted {
            color: #d73a49;
          }

          .token.boolean,
          .token.number {
            color: #005cc5;
          }

          .token.selector,
          .token.attr-name,
          .token.string,
          .token.char,
          .token.builtin,
          .token.inserted {
            color: #032f62;
          }

          .token.operator,
          .token.entity,
          .token.url,
          .language-css .token.string,
          .style .token.string,
          .token.variable {
            color: #e36209;
          }

          .token.atrule,
          .token.attr-value,
          .token.function,
          .token.class-name {
            color: #6f42c1;
          }

          .token.keyword {
            color: #d73a49;
          }

          .token.regex,
          .token.important {
            color: #e36209;
          }

          .token.important,
          .token.bold {
            font-weight: bold;
          }

          .token.italic {
            font-style: italic;
          }

          .token.entity {
            cursor: help;
          }
        `;
      default:
        return this.getSyntaxHighlightingCss(); // Fallback to github theme
    }
  }
}
