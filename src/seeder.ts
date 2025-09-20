import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';
import { UserData, generateUserBatch, delay, calculateETA, formatNumber, calculatePercentage } from './utils';
import chalk from 'chalk';
import ProgressBar from 'progress';

export class AuthUserSeeder {
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
   * Seed users in batches with concurrency control
   */
  async seedUsers(): Promise<void> {
    const totalUsers = config.seeding.totalUsers;
    const batchSize = config.seeding.batchSize;
    const concurrentBatches = config.seeding.concurrentBatches;
    
    console.log(chalk.blue('🚀 Starting user seeding process...'));
    console.log(chalk.gray(`Total users: ${formatNumber(totalUsers)}`));
    console.log(chalk.gray(`Batch size: ${formatNumber(batchSize)}`));
    console.log(chalk.gray(`Concurrent batches: ${concurrentBatches}`));
    console.log('');

    // Initialize progress bar
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
    let currentBatch = 0;

    // Process batches with concurrency control
    const semaphore = new Array(concurrentBatches).fill(null);
    
    while (currentBatch < batches) {
      const availableSlots = semaphore.filter(slot => slot === null).length;
      
      if (availableSlots > 0 && currentBatch < batches) {
        const batchIndex = currentBatch++;
        const remainingUsers = totalUsers - (batchIndex * batchSize);
        const currentBatchSize = Math.min(batchSize, remainingUsers);
        
        // Start batch processing
        const slotIndex = semaphore.findIndex(slot => slot === null);
        semaphore[slotIndex] = this.processBatch(batchIndex, currentBatchSize).finally(() => {
          semaphore[slotIndex] = null;
        });
      } else {
        // Wait a bit before checking again
        await delay(100);
      }
    }

    // Wait for all batches to complete
    await Promise.all(semaphore.filter(slot => slot !== null));

    this.finishSeeding();
  }

  /**
   * Process a single batch of users
   */
  private async processBatch(batchIndex: number, batchSize: number): Promise<void> {
    try {
      const users = generateUserBatch(batchSize, config.seeding.emailDomain, config.seeding.defaultPassword);
      
      // Create users in parallel within the batch
      const promises = users.map(user => this.createUser(user));
      const results = await Promise.allSettled(promises);
      
      // Count successes and failures
      const successes = results.filter(result => result.status === 'fulfilled').length;
      const failures = results.filter(result => result.status === 'rejected').length;
      
      this.processedUsers += successes;
      this.errors += failures;
      
      // Update progress bar
      if (this.progressBar) {
        this.progressBar.tick(successes);
      }
      
      // Log batch completion
      const percentage = calculatePercentage(this.processedUsers, config.seeding.totalUsers);
      const eta = calculateETA(this.processedUsers, config.seeding.totalUsers, this.startTime);
      
      console.log(
        chalk.green(`✅ Batch ${batchIndex + 1}: ${successes} users created, ${failures} errors`)
      );
      console.log(
        chalk.gray(`   Total: ${formatNumber(this.processedUsers)}/${formatNumber(config.seeding.totalUsers)} (${percentage}%)`)
      );
      console.log(
        chalk.gray(`   ETA: ${eta}`)
      );
      
      // Add small delay to prevent overwhelming the API
      await delay(100);
      
    } catch (error) {
      console.error(chalk.red(`❌ Batch ${batchIndex + 1} failed:`), error);
      this.errors += batchSize;
    }
  }

  /**
   * Create a single user using Supabase Admin API
   */
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
      // Log individual errors only in debug mode
      if (process.env.DEBUG) {
        console.error(chalk.red(`Failed to create user ${userData.email}:`), error);
      }
      throw error;
    }
  }

  /**
   * Finish seeding and display summary
   */
  private finishSeeding(): void {
    const duration = Date.now() - this.startTime;
    const durationMinutes = Math.round(duration / (1000 * 60));
    const rate = Math.round((this.processedUsers / duration) * 1000 * 60); // users per minute

    console.log('');
    console.log(chalk.blue('🎉 Seeding completed!'));
    console.log('');
    console.log(chalk.green(`✅ Successfully created: ${formatNumber(this.processedUsers)} users`));
    console.log(chalk.red(`❌ Errors: ${formatNumber(this.errors)}`));
    console.log(chalk.gray(`⏱️  Duration: ${durationMinutes} minutes`));
    console.log(chalk.gray(`📊 Rate: ${formatNumber(rate)} users/minute`));
    
    if (this.errors > 0) {
      console.log('');
      console.log(chalk.yellow('⚠️  Some users failed to create. Check your logs for details.'));
      console.log(chalk.yellow('   This might be due to duplicate emails or API rate limits.'));
    }
  }
}
