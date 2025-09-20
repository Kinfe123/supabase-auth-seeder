export interface UserData {
  email: string;
  password: string;
  user_metadata: {
    first_name: string;
    last_name: string;
    email_verified: boolean;
  };
}

const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Jessica', 'Robert', 'Ashley',
  'William', 'Amanda', 'Richard', 'Jennifer', 'Charles', 'Michelle', 'Thomas', 'Kimberly', 'Christopher', 'Donna',
  'Daniel', 'Lisa', 'Matthew', 'Nancy', 'Anthony', 'Karen', 'Mark', 'Betty', 'Donald', 'Helen',
  'Steven', 'Sandra', 'Paul', 'Donna', 'Andrew', 'Carol', 'Joshua', 'Ruth', 'Kenneth', 'Sharon',
  'Kevin', 'Michelle', 'Brian', 'Laura', 'George', 'Sarah', 'Edward', 'Kimberly', 'Ronald', 'Deborah',
  'Timothy', 'Dorothy', 'Jason', 'Lisa', 'Jeffrey', 'Nancy', 'Ryan', 'Karen', 'Jacob', 'Betty',
  'Gary', 'Helen', 'Nicholas', 'Sandra', 'Eric', 'Donna', 'Jonathan', 'Carol', 'Stephen', 'Ruth',
  'Larry', 'Sharon', 'Justin', 'Michelle', 'Scott', 'Laura', 'Brandon', 'Sarah', 'Benjamin', 'Kimberly',
  'Samuel', 'Deborah', 'Gregory', 'Dorothy', 'Alexander', 'Lisa', 'Patrick', 'Nancy', 'Jack', 'Karen'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes'
];

/**
 * Generate a batch of user data
 */
export function generateUserBatch(batchSize: number, emailDomain: string, defaultPassword: string): UserData[] {
  const users: UserData[] = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < batchSize; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const uniqueId = `${timestamp}-${i}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uniqueId}@${emailDomain}`;
    
    users.push({
      email,
      password: defaultPassword,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        email_verified: true,
      },
    });
  }
  
  return users;
}

/**
 * Create a delay function for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate estimated time remaining
 */
export function calculateETA(processed: number, total: number, startTime: number): string {
  if (processed === 0) return 'Calculating...';
  
  const elapsed = Date.now() - startTime;
  const rate = processed / elapsed; // users per millisecond
  const remaining = total - processed;
  const etaMs = remaining / rate;
  
  const hours = Math.floor(etaMs / (1000 * 60 * 60));
  const minutes = Math.floor((etaMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((etaMs % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Calculate percentage
 */
export function calculatePercentage(current: number, total: number): number {
  return Math.round((current / total) * 100 * 100) / 100; // Round to 2 decimal places
}
