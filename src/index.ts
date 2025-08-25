#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import chalk from 'chalk';
import { MarkdownToPdfConverter } from './converter.js';

const program = new Command();

program
  .name('md2pdf')
  .description('Convert Markdown files to PDF with support for math formulas, Mermaid diagrams, and syntax highlighting')
  .version('1.0.0');

program
  .argument('<input>', 'Input markdown file path')
  .option('-o, --output <path>', 'Output PDF file path')
  .option('-t, --theme <theme>', 'Syntax highlighting theme', 'github')
  .option('-f, --format <format>', 'Page format (A4, Letter, Legal)', 'Singular')
  .option('-m, --margins <margins>', 'Page margins in CSS format', '1cm')
  .option('--css <path>', 'Custom CSS file path')
  .option('--no-math', 'Disable math formula support')
  .option('--no-mermaid', 'Disable Mermaid diagram support')
  .option('--no-syntax', 'Disable syntax highlighting')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (input, options) => {
    try {
      // Validate input file
      const inputPath = resolve(input);
      if (!existsSync(inputPath)) {
        console.error(chalk.red(`Error: Input file "${input}" does not exist`));
        process.exit(1);
      }

      if (extname(inputPath).toLowerCase() !== '.md') {
        console.error(chalk.red(`Error: Input file must be a Markdown file (.md)`));
        process.exit(1);
      }

      // Generate output path if not provided
      const outputPath = options.output 
        ? resolve(options.output)
        : inputPath.replace(/\.md$/, '.pdf');

      if (options.verbose) {
        console.log(chalk.blue('Configuration:'));
        console.log(`  Input: ${inputPath}`);
        console.log(`  Output: ${outputPath}`);
        console.log(`  Theme: ${options.theme}`);
        console.log(`  Format: ${options.format}`);
        console.log(`  Margins: ${options.margins}`);
        console.log(`  Math support: ${!options.noMath}`);
        console.log(`  Mermaid support: ${!options.noMermaid}`);
        console.log(`  Syntax highlighting: ${!options.noSyntax}`);
        console.log();
      }

      // Read markdown content
      const markdownContent = readFileSync(inputPath, 'utf-8');

      // Create converter instance
      const converter = new MarkdownToPdfConverter({
        theme: options.theme,
        format: options.format,
        margins: options.margins,
        customCssPath: options.css,
        enableMath: !options.noMath,
        enableMermaid: !options.noMermaid,
        enableSyntaxHighlighting: !options.noSyntax,
        verbose: options.verbose
      });

      console.log(chalk.blue('Converting markdown to PDF...'));
      
      await converter.convert(markdownContent, outputPath);
      
      console.log(chalk.green(`✅ PDF generated successfully: ${outputPath}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Error during conversion:'));
      console.error(error instanceof Error ? error.message : String(error));
      if (options.verbose && error instanceof Error) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();