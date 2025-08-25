#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import chalk from 'chalk';
import { MarkdownToPdfConverter } from './converter.js';

const program = new Command();

program
  .name('md2pdf')
  .description(
    'Convert Markdown files to PDF with support for math formulas, Mermaid diagrams, and syntax highlighting',
  )
  .version('1.0.0');

program
  .argument(
    '<input...>',
    'Input markdown file path(s) - supports multiple files',
  )
  .option('-o, --output <path>', 'Output PDF file path')
  .option('-t, --theme <theme>', 'Syntax highlighting theme', 'github')
  .option(
    '-f, --format <format>',
    'Page format (A4, Letter, Legal)',
    'Singular',
  )
  .option('-m, --margins <margins>', 'Page margins in CSS format', '1cm')
  .option('--css <path>', 'Custom CSS file path')
  .option('--no-math', 'Disable math formula support')
  .option('--no-mermaid', 'Disable Mermaid diagram support')
  .option('--no-syntax', 'Disable syntax highlighting')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (inputArgs, options) => {
    try {
      // Process input arguments (can be multiple files due to shell glob expansion)
      const inputFiles: string[] = [];

      for (const input of inputArgs) {
        const filePath = resolve(input);

        if (!existsSync(filePath)) {
          console.error(chalk.red(`Error: File not found: ${filePath}`));
          process.exit(1);
        }

        if (extname(filePath).toLowerCase() !== '.md') {
          console.error(chalk.red(`Error: Not a markdown file: ${filePath}`));
          process.exit(1);
        }

        inputFiles.push(filePath);
      }

      if (inputFiles.length === 0) {
        console.error(chalk.red('Error: No input files specified'));
        process.exit(1);
      }

      // Validate output option for multiple files
      if (inputFiles.length > 1 && options.output) {
        console.error(
          chalk.red(
            `Error: Cannot specify output path when processing multiple files`,
          ),
        );
        process.exit(1);
      }

      if (options.verbose) {
        console.log(chalk.blue('Configuration:'));
        console.log(`  Input files: ${inputArgs.join(', ')}`);
        console.log(`  Files to process: ${inputFiles.length}`);
        console.log(`  Theme: ${options.theme}`);
        console.log(`  Format: ${options.format}`);
        console.log(`  Margins: ${options.margins}`);
        console.log(`  Math support: ${!options.noMath}`);
        console.log(`  Mermaid support: ${!options.noMermaid}`);
        console.log(`  Syntax highlighting: ${!options.noSyntax}`);
        console.log();
      }

      // Create converter instance
      const converter = new MarkdownToPdfConverter({
        theme: options.theme,
        format: options.format,
        margins: options.margins,
        customCssPath: options.css,
        enableMath: !options.noMath,
        enableMermaid: !options.noMermaid,
        enableSyntaxHighlighting: !options.noSyntax,
        verbose: options.verbose,
      });

      // Process each file
      let successCount = 0;
      let errorCount = 0;

      await Promise.all(
        inputFiles.map(async inputPath => {
          try {
            // Generate output path
            const outputPath = options.output
              ? resolve(options.output)
              : inputPath.replace(/\.md$/, '.pdf');

            console.log(chalk.blue(`📄 Converting: ${inputPath}`));

            // Read markdown content
            const markdownContent = readFileSync(inputPath, 'utf-8');

            await converter.convert(markdownContent, outputPath);

            console.log(chalk.green(`✅ Success: ${outputPath}`));
            successCount++;
          } catch (error) {
            console.error(chalk.red(`❌ Error converting ${inputPath}:`));
            console.error(
              error instanceof Error ? error.message : String(error),
            );
            if (options.verbose && error instanceof Error) {
              console.error(error.stack);
            }
            errorCount++;
          }
        }),
      );

      // Summary
      if (inputFiles.length > 1) {
        console.log();
        console.log(chalk.blue('Conversion Summary:'));
        console.log(chalk.green(`✅ Successful: ${successCount}`));
      }

      if (errorCount > 0) {
        console.log(chalk.red(`❌ Failed: ${errorCount}`));
        process.exit(1);
      }
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
