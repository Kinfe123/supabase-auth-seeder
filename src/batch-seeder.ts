#!/usr/bin/env node

import chalk from 'chalk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';
import { UserData, generateUserBatch, delay, calculateETA, formatNumber, calculatePercentage } from './utils';
import ProgressBar from 'progress';

/**
 * Alternative batch seeder that processes users in larger chunks
 * This is more memory efficient for very large datasets
 */
export class BatchSeeder {
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
   * Seed users with memory-efficient batch processing
   */
  async seedUsers(): Promise<void> {
    const totalUsers = config.seeding.totalUsers;
    const batchSize = config.seeding.batchSize;
    
    console.log(chalk.blue('🚀 Starting memory-efficient batch seeding...'));
    console.log(chalk.gray(`Total users: ${formatNumber(totalUsers)}`));
    console.log(chalk.gray(`Batch size: ${formatNumber(batchSize)}`));
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
      
      await this.processBatch(batchIndex, currentBatchSize);
      
      await delay(200);
    }

    this.finishSeeding();
  }

  /**
   * Process a single batch of users
   */
  private async processBatch(batchIndex: number, batchSize: number): Promise<void> {
    try {
      console.log(chalk.blue(`📦 Processing batch ${batchIndex + 1}...`));
      
      const users = generateUserBatch(batchSize, config.seeding.emailDomain, config.seeding.defaultPassword);
      
      const chunkSize = 100;
      let processedInBatch = 0;
      
      for (let i = 0; i < users.length; i += chunkSize) {
        const chunk = users.slice(i, i + chunkSize);
        
        const promises = chunk.map(user => this.createUser(user));
        const results = await Promise.allSettled(promises);
        
        const successes = results.filter(result => result.status === 'fulfilled').length;
        const failures = results.filter(result => result.status === 'rejected').length;
        
        this.processedUsers += successes;
        this.errors += failures;
        processedInBatch += successes;
        
        if (this.progressBar) {
          this.progressBar.tick(successes);
        }
        
        await delay(50);
      }
      
      const percentage = calculatePercentage(this.processedUsers, config.seeding.totalUsers);
      const eta = calculateETA(this.processedUsers, config.seeding.totalUsers, this.startTime);
      
      console.log(
        chalk.green(`✅ Batch ${batchIndex + 1} completed: ${processedInBatch} users created`)
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

  private async createUser(userData: UserData): Promise<void> {
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
    } catch (error) {
      if (process.env.DEBUG) {
        console.error(chalk.red(`Failed to create user ${userData.email}:`), error);
      }
      throw error;
    }
  }

  private finishSeeding(): void {
    const duration = Date.now() - this.startTime;
    const durationMinutes = Math.round(duration / (1000 * 60));
    const rate = Math.round((this.processedUsers / duration) * 1000 * 60);

    console.log('');
    console.log(chalk.blue('🎉 Batch seeding completed!'));
    console.log('');
    console.log(chalk.green(`✅ Successfully created: ${formatNumber(this.processedUsers)} users`));
    console.log(chalk.red(`❌ Errors: ${formatNumber(this.errors)}`));
    console.log(chalk.gray(`⏱️  Duration: ${durationMinutes} minutes`));
    console.log(chalk.gray(`📊 Rate: ${formatNumber(rate)} users/minute`));
  }
}

async function main() {
  console.log(chalk.blue.bold('🚀 Supabase Batch Seeder (Memory Efficient)'));
  console.log('');

  try {
    const seeder = new BatchSeeder();
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
