import { chromium, Browser, Page } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { MarkdownProcessor, MarkdownProcessorOptions } from './markdown-processor.js';
import { generateHtmlTemplate, TemplateOptions } from './template.js';
import chalk from 'chalk';

export interface ConversionOptions {
  theme?: string;
  format?: 'A4' | 'A3' | 'A5' | 'Legal' | 'Letter' | 'Tabloid' | 'Singular';
  margins?: string;
  customCssPath?: string;
  enableMath?: boolean;
  enableMermaid?: boolean;
  enableSyntaxHighlighting?: boolean;
  verbose?: boolean;
}

export class MarkdownToPdfConverter {
  private options: Required<ConversionOptions>;
  private markdownProcessor: MarkdownProcessor;

  constructor(options: ConversionOptions = {}) {
    this.options = {
      theme: options.theme ?? 'github',
      format: options.format ?? 'A4',
      margins: options.margins ?? '1cm',
      customCssPath: options.customCssPath ?? '',
      enableMath: options.enableMath ?? true,
      enableMermaid: options.enableMermaid ?? true,
      enableSyntaxHighlighting: options.enableSyntaxHighlighting ?? true,
      verbose: options.verbose ?? false
    };

    this.markdownProcessor = new MarkdownProcessor({
      enableMath: this.options.enableMath,
      enableSyntaxHighlighting: this.options.enableSyntaxHighlighting,
      enableMermaid: this.options.enableMermaid,
      syntaxTheme: this.options.theme
    });
  }

  async convert(markdownContent: string, outputPath: string): Promise<void> {
    let browser: Browser | null = null;
    
    try {
      if (this.options.verbose) {
        console.log(chalk.blue('🔄 Processing markdown content...'));
      }

      // Process markdown to HTML
      const htmlContent = await this.markdownProcessor.processMarkdown(markdownContent);

      if (this.options.verbose) {
        console.log(chalk.blue('✅ Markdown processed successfully'));
        console.log(chalk.blue('🎨 Generating HTML template...'));
      }

      // Load custom CSS if provided
      let customCss = '';
      if (this.options.customCssPath) {
        try {
          customCss = readFileSync(this.options.customCssPath, 'utf-8');
          if (this.options.verbose) {
            console.log(chalk.blue(`📄 Custom CSS loaded from ${this.options.customCssPath}`));
          }
        } catch (error) {
          console.warn(chalk.yellow(`⚠️  Could not load custom CSS from ${this.options.customCssPath}`));
        }
      }

      // Generate complete HTML document
      const templateOptions: TemplateOptions = {
        title: 'Markdown to PDF',
        margins: this.options.margins,
        enableMath: this.options.enableMath,
        enableMermaid: this.options.enableMermaid,
        enableSyntaxHighlighting: this.options.enableSyntaxHighlighting,
        customCss,
        syntaxCss: this.options.enableSyntaxHighlighting 
          ? this.markdownProcessor.getSyntaxHighlightingCss() 
          : ''
      };

      const fullHtml = generateHtmlTemplate(htmlContent, templateOptions);

      if (this.options.verbose) {
        console.log(chalk.blue('✅ HTML template generated'));
        console.log(chalk.blue('🚀 Launching browser...'));
      }

      // Launch Playwright browser
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const context = await browser.newContext({
        deviceScaleFactor: 2, // Higher resolution for better quality
      });

      const page = await context.newPage();
      const pageWidth = this.getPageWidth()
      await page.setViewportSize({
        width: pageWidth,
        height: 1080 // Temporary height, will be adjusted
      });

      if (this.options.verbose) {
        console.log(chalk.blue('✅ Browser launched'));
        console.log(chalk.blue('📝 Loading content...'));
      }

      // Set content and wait for it to be ready
      await page.setContent(fullHtml, { 
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Wait for dynamic content to render (Mermaid diagrams, math formulas)
      if (this.options.enableMermaid || this.options.enableMath) {
        if (this.options.verbose) {
          console.log(chalk.blue('⏳ Waiting for dynamic content to render...'));
        }
        
        await page.waitForFunction(
          () => (globalThis as any).document.body.hasAttribute('data-ready'),
          { timeout: 30000 }
        );
      }

      if (this.options.verbose) {
        console.log(chalk.blue('✅ Content loaded and ready'));
        console.log(chalk.blue('📄 Generating PDF...'));
      }

      let pageHeight: string | number = this.getPageHeight();
      if (this.options.format === 'Singular') {
        // Get the actual content height
        const contentHeight = await page.evaluate(() => {
          const { document } = (globalThis as any);
          const body = document.body;
          const range = document.createRange();
          range.selectNodeContents(body);
          const rect = range.getBoundingClientRect();
          return rect.height;
        });
        
        // Convert pixels to inches (96 DPI is standard)
        pageHeight = (contentHeight / 96) + 'in';
      }

      // Generate PDF
      const pdfOptions = {
        path: outputPath,
        width: pageWidth,
        height: pageHeight,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        printBackground: true,
        preferCSSPageSize: false,
      };

      await page.pdf(pdfOptions);

      if (this.options.verbose) {
        console.log(chalk.blue('✅ PDF generated successfully'));
      }

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`PDF conversion failed: ${error.message}`);
      }
      throw new Error(`PDF conversion failed: ${String(error)}`);
    } finally {
      // Clean up browser
      if (browser) {
        await browser.close();
        if (this.options.verbose) {
          console.log(chalk.blue('🧹 Browser closed'));
        }
      }
    }
  }

  private getPageWidth(): number {
    const pageWidthsInches = {
      'A4': 8.27,
      'A3': 11.69,
      'A5': 5.83,
      'Legal': 8.5,
      'Letter': 8.5,
      'Tabloid': 11,
      'Singular': 9,
    };

    let widthInches = pageWidthsInches[this.options.format] || pageWidthsInches['A4'];
    return Math.floor(widthInches * 96); // Convert to pixels
  }

  private getPageHeight(): number {
    const pageHeightsInches = {
      'A4': 11.69,
      'A3': 16.54,
      'A5': 8.27,
      'Legal': 14,
      'Letter': 11,
      'Tabloid': 17,
      'Singular': 100,
    };

    let heightInches = pageHeightsInches[this.options.format] || pageHeightsInches['A4'];
    return Math.floor(heightInches * 96); // Convert to pixels
  }
}