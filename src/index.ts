#!/usr/bin/env node

import chalk from 'chalk';
import { validateConfig, config } from './config';
import { AuthUserSeeder } from './seeder';

async function main() {
  console.log(chalk.blue.bold('🚀 Supabase Auth User Seeder'));
  console.log(chalk.gray('Based on the GitHub discussion: https://github.com/orgs/supabase/discussions/35391'));
  console.log('');

  try {
    validateConfig();

    const seeder = new AuthUserSeeder();

    await seeder.seedUsers();

    console.log('');
    console.log(chalk.green.bold('✨ All done! Check your Supabase dashboard to verify the users.'));
    
  } catch (error) {
    console.error(chalk.red.bold('❌ Seeding failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    
    if (error instanceof Error && error.message.includes('required')) {
      console.log('');
      console.log(chalk.yellow('💡 Make sure you have:'));
      console.log(chalk.yellow('   1. Created a .env file with your Supabase credentials'));
      console.log(chalk.yellow('   2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'));
      console.log(chalk.yellow('   3. Copied env.example to .env and filled in your values'));
    }
    
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(chalk.blue.bold('Supabase Auth User Seeder'));
  console.log('');
  console.log('Usage: npm run seed [options]');
  console.log('');
  console.log('Options:');
  console.log('  --users=NUMBER    Override total number of users to seed');
  console.log('  --batch=NUMBER    Override batch size');
  console.log('  --concurrent=N    Override number of concurrent batches');
  console.log('  --debug           Enable debug logging');
  console.log('  --help, -h        Show this help message');
  console.log('');
  console.log('Environment Variables:');
  console.log('  SUPABASE_URL              Your Supabase project URL');
  console.log('  SUPABASE_SERVICE_ROLE_KEY Your Supabase service role key');
  console.log('  TOTAL_USERS               Total number of users to seed (default: 7000000)');
  console.log('  BATCH_SIZE                Batch size (default: 1000)');
  console.log('  CONCURRENT_BATCHES        Concurrent batches (default: 5)');
  console.log('  DEFAULT_PASSWORD          Default password for users (default: password123)');
  console.log('  EMAIL_DOMAIN              Email domain for generated users (default: example.com)');
  process.exit(0);
}

// Parse command line arguments
args.forEach(arg => {
  if (arg.startsWith('--users=')) {
    const users = parseInt(arg.split('=')[1]);
    if (!isNaN(users)) {
      process.env.TOTAL_USERS = users.toString();
    }
  } else if (arg.startsWith('--batch=')) {
    const batch = parseInt(arg.split('=')[1]);
    if (!isNaN(batch)) {
      process.env.BATCH_SIZE = batch.toString();
    }
  } else if (arg.startsWith('--concurrent=')) {
    const concurrent = parseInt(arg.split('=')[1]);
    if (!isNaN(concurrent)) {
      process.env.CONCURRENT_BATCHES = concurrent.toString();
    }
  } else if (arg === '--debug') {
    process.env.DEBUG = 'true';
  }
});

main();
