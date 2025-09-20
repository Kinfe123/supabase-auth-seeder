import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  seeding: {
    totalUsers: number;
    batchSize: number;
    concurrentBatches: number;
    defaultPassword: string;
    emailDomain: string;
  };
}

export const config: Config = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  seeding: {
    totalUsers: parseInt(process.env.TOTAL_USERS || '7000000'),
    batchSize: parseInt(process.env.BATCH_SIZE || '1000'),
    concurrentBatches: parseInt(process.env.CONCURRENT_BATCHES || '5'),
    defaultPassword: process.env.DEFAULT_PASSWORD || 'password123',
    emailDomain: process.env.EMAIL_DOMAIN || 'example.com',
  },
};

export function validateConfig(): void {
  if (!config.supabase.url) {
    throw new Error('SUPABASE_URL is required');
  }
  if (!config.supabase.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }
  
  console.log('✅ Configuration validated successfully');
  console.log(`📊 Planning to seed ${config.seeding.totalUsers.toLocaleString()} users`);
  console.log(`📦 Batch size: ${config.seeding.batchSize}`);
  console.log(`⚡ Concurrent batches: ${config.seeding.concurrentBatches}`);
}
