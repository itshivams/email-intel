#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { analyze } from './index';

const program = new Command();

program
  .name('email-intel')
  .description('Enterprise standard email intelligence and verification.')
  .version('1.0.1')
  .argument('<email>', 'Email address to analyze')
  .action(async (email: string) => {
    const spinner = ora(`Analyzing ${email}...`).start();
    try {
      const result = await analyze(email);
      spinner.succeed(`Analysis complete for ${chalk.bold(email)}`);

      console.log('');
      console.log(chalk.bold('--- Email Intelligence Report ---'));
      console.log(`${chalk.gray('Domain:')}         ${result.domain}`);
      console.log(`${chalk.gray('Valid:')}          ${result.valid ? chalk.green('Yes') : chalk.red('No')}`);
      console.log(`${chalk.gray('Provider:')}       ${result.provider} ${chalk.gray(`(Confidence: ${result.providerConfidence}%)`)}`);

      let typeColor = chalk.blue;
      if (result.type === 'Public Webmail' || result.type === 'Disposable') {
        typeColor = result.type === 'Disposable' ? chalk.red : chalk.yellow;
      }
      console.log(`${chalk.gray('Type:')}           ${typeColor(result.type)}`);
      console.log(`${chalk.gray('Disposable:')}     ${result.disposable ? chalk.red('Yes') : chalk.green('No')}`);

      console.log('');
      console.log(chalk.bold('--- DNS Records ---'));
      console.log(`${chalk.gray('MX Record:')}      ${result.mx ? chalk.green('Found') : chalk.red('Missing')}`);
      console.log(`${chalk.gray('SPF Record:')}     ${result.spf ? chalk.green('Found') : chalk.red('Missing')}`);

      if (result.dkim) {
        console.log(`${chalk.gray('DKIM Record:')}    ${chalk.green('Found')}`);
      }

      console.log(`${chalk.gray('DMARC Record:')}   ${result.dmarc ? chalk.green('Found') : chalk.yellow('Missing')}`);

      console.log('');
      console.log(chalk.bold('--- Risk Assessment ---'));
      let riskColor = chalk.green;
      if (result.risk === 'medium') riskColor = chalk.yellow;
      if (result.risk === 'high') riskColor = chalk.red;

      console.log(`${chalk.gray('Risk Level:')}     ${riskColor(result.risk.toUpperCase())}`);
      console.log(`${chalk.gray('Score:')}          ${riskColor(result.confidence)} / 100`);
      console.log('');
    } catch (err: any) {
      spinner.fail(`Analysis failed: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
