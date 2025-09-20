#!/usr/bin/env node

import chalk from 'chalk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';
import { UserData, generateUserBatch, delay, calculateETA, formatNumber, calculatePercentage } from './utils';
import ProgressBar from 'progress';

/**
 * Conservative seeder that handles rate limiting and network issues better
 */
export class ConservativeSeeder {
  private supabase: SupabaseClient;
  private processedUsers = 0;
  private errors = 0;
  private startTime = Date.now();
  private progressBar: ProgressBar | null = null;

  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Seed users with conservative settings to avoid rate limits
   */
  async seedUsers(): Promise<void> {
    const totalUsers = config.seeding.totalUsers;
    const batchSize = Math.min(config.seeding.batchSize, 100);
    const delayBetweenBatches = 2000;
    
    console.log(chalk.blue('🚀 Starting conservative user seeding...'));
    console.log(chalk.gray(`Total users: ${formatNumber(totalUsers)}`));
    console.log(chalk.gray(`Batch size: ${formatNumber(batchSize)} (reduced for stability)`));
    console.log(chalk.gray(`Delay between batches: ${delayBetweenBatches}ms`));
    console.log('');

    this.progressBar = new ProgressBar(
      chalk.cyan('Progress: :bar :current/:total :percent :eta'),
      {
        total: totalUsers,
        width: 50,
        complete: '█',
        incomplete: '░',
      }
    );

    const batches = Math.ceil(totalUsers / batchSize);

    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const remainingUsers = totalUsers - (batchIndex * batchSize);
      const currentBatchSize = Math.min(batchSize, remainingUsers);
      
      await this.processBatchConservative(batchIndex, currentBatchSize);
      
      if (batchIndex < batches - 1) {
        await delay(delayBetweenBatches);
      }
    }

    this.finishSeeding();
  }

  /**
   * Process a single batch conservatively
   */
  private async processBatchConservative(batchIndex: number, batchSize: number): Promise<void> {
    try {
      const users = generateUserBatch(batchSize, config.seeding.emailDomain, config.seeding.defaultPassword);
      
      let processedInBatch = 0;
      let errorsInBatch = 0;
      
      for (let i = 0; i < users.length; i++) {
        try {
          await this.createUserWithRetry(users[i]);
          processedInBatch++;
          this.processedUsers++;
          
          if (this.progressBar) {
            this.progressBar.tick(1);
          }
          
          await delay(100);
          
        } catch (error) {
          errorsInBatch++;
          this.errors++;
          
          if (i % 10 === 0) {
            console.log(chalk.yellow(`⚠️  Error creating user ${i + 1} in batch ${batchIndex + 1}`));
          }
        }
      }
      
      const percentage = calculatePercentage(this.processedUsers, config.seeding.totalUsers);
      const eta = calculateETA(this.processedUsers, config.seeding.totalUsers, this.startTime);
      
      console.log(
        chalk.green(`✅ Batch ${batchIndex + 1}: ${processedInBatch} users created, ${errorsInBatch} errors`)
      );
      console.log(
        chalk.gray(`   Total: ${formatNumber(this.processedUsers)}/${formatNumber(config.seeding.totalUsers)} (${percentage}%)`)
      );
      console.log(
        chalk.gray(`   ETA: ${eta}`)
      );
      
    } catch (error) {
      console.error(chalk.red(`❌ Batch ${batchIndex + 1} failed:`), error);
      this.errors += batchSize;
    }
  }

  /**
   * Create a user with retry logic for network issues
   */
  private async createUserWithRetry(userData: UserData, maxRetries = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { error } = await this.supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: userData.user_metadata,
        });

        if (error) {
          throw error;
        }
        
        return;
        
      } catch (error) {
        const isNetworkError = error instanceof Error && 
          (error.message.includes('fetch failed') || 
           error.message.includes('ETIMEDOUT') ||
           error.message.includes('ECONNRESET'));
        
        if (isNetworkError && attempt < maxRetries) {
          const waitTime = attempt * 1000;
          await delay(waitTime);
          continue;
        }
        
        throw error;
      }
    }
  }

  /**
   * Finish seeding and display summary
   */
  private finishSeeding(): void {
    const duration = Date.now() - this.startTime;
    const durationMinutes = Math.round(duration / (1000 * 60));
    const rate = Math.round((this.processedUsers / duration) * 1000 * 60);

    console.log('');
    console.log(chalk.blue('🎉 Conservative seeding completed!'));
    console.log('');
    console.log(chalk.green(`✅ Successfully created: ${formatNumber(this.processedUsers)} users`));
    console.log(chalk.red(`❌ Errors: ${formatNumber(this.errors)}`));
    console.log(chalk.gray(`⏱️  Duration: ${durationMinutes} minutes`));
    console.log(chalk.gray(`📊 Rate: ${formatNumber(rate)} users/minute`));
    
    if (this.errors > 0) {
      console.log('');
      console.log(chalk.yellow('⚠️  Some users failed to create due to network issues or rate limits.'));
      console.log(chalk.yellow('   This is normal for large datasets. You can re-run to create more users.'));
    }
  }
}

async function main() {
  console.log(chalk.blue.bold('🚀 Supabase Conservative Seeder (Rate-Limit Safe)'));
  console.log('');

  try {
    const seeder = new ConservativeSeeder();
    await seeder.seedUsers();
    
    console.log('');
    console.log(chalk.green.bold('✨ All done! Check your Supabase dashboard to verify the users.'));
    
  } catch (error) {
    console.error(chalk.red.bold('❌ Seeding failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

main();
