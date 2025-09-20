# Supabase Auth User Seeder

A high-performance seeding solution for creating millions of auth users in Supabase, based on the [GitHub discussion](https://github.com/orgs/supabase/discussions/35391).

## 🚀 Features

- **High Performance**: Efficiently seeds 7 million+ users with optimized batching
- **Concurrent Processing**: Configurable concurrent batch processing for maximum throughput
- **Progress Tracking**: Real-time progress bars and ETA calculations
- **Memory Efficient**: Two seeding strategies for different memory requirements
- **Error Handling**: Robust error handling with detailed reporting
- **Configurable**: Flexible configuration via environment variables or CLI arguments

## 📋 Prerequisites

- Node.js 18+ 
- A Supabase project with service role key
- npm or yarn package manager

## 🛠️ Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment template:

```bash
cp env.example .env
```

4. Configure your Supabase credentials in `.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Required |
| `TOTAL_USERS` | Total number of users to seed | 7000000 |
| `BATCH_SIZE` | Number of users per batch | 1000 |
| `CONCURRENT_BATCHES` | Number of concurrent batches | 5 |
| `DEFAULT_PASSWORD` | Default password for all users | password123 |
| `EMAIL_DOMAIN` | Domain for generated email addresses | example.com |

### Command Line Arguments

You can override environment variables using CLI arguments:

```bash
npm run seed --users=10000 --batch=500 --concurrent=3
```

## 🚀 Usage

### Quick Start

1. **Set up your environment** (see Configuration above)

2. **Run the seeder**:
   ```bash
   npm run seed
   ```

### Different Seeding Strategies

#### Standard Seeder (Concurrent)
Best for maximum speed with sufficient memory:
```bash
npm run seed
```

#### Batch Seeder (Memory Efficient)
Better for systems with limited memory:
```bash
npm run seed:batch
```

#### Small Test Run
Test with a smaller number of users:
```bash
npm run seed:small
```

### Advanced Usage

#### Debug Mode
Enable detailed error logging:
```bash
npm run seed --debug
```

#### Custom Configuration
Override specific settings:
```bash
npm run seed --users=50000 --batch=2000 --concurrent=10
```

## 📊 Performance Expectations

Based on testing and the GitHub discussion recommendations:

- **Rate**: ~10,000-50,000 users per minute (depending on your Supabase plan)
- **Memory Usage**: ~500MB-2GB (depending on batch size and concurrency)
- **7 Million Users**: Estimated 2-12 hours (depending on your setup)

### Optimization Tips

1. **Increase concurrency** for faster seeding (if your Supabase plan supports it)
2. **Adjust batch size** based on your memory constraints
3. **Use the batch seeder** for very large datasets on memory-constrained systems
4. **Monitor your Supabase dashboard** during seeding to ensure no rate limiting

## 🔧 Architecture

The seeder implements the approach recommended in the GitHub discussion:

1. **Supabase Admin API**: Uses `supabase.auth.admin.createUser()` for creating users
2. **Batch Processing**: Processes users in configurable batches
3. **Concurrent Execution**: Runs multiple batches simultaneously
4. **Progress Tracking**: Real-time progress bars and ETA calculations
5. **Error Handling**: Graceful handling of API errors and rate limits

### Key Components

- `src/config.ts` - Configuration management
- `src/seeder.ts` - Main concurrent seeder class
- `src/batch-seeder.ts` - Memory-efficient batch seeder
- `src/utils.ts` - Utility functions for data generation and tracking
- `src/index.ts` - CLI interface and main entry point

## 📝 Generated User Data

Each user will have:

- **Email**: `firstname.lastname.timestamp.index@domain.com`
- **Password**: Configurable default password
- **Metadata**: First name, last name, email verified status
- **Status**: Email confirmed, ready to use

## 🚨 Important Notes

### Rate Limiting
- Supabase has API rate limits that vary by plan
- The seeder includes delays to prevent overwhelming the API
- Monitor your Supabase dashboard during seeding

### Memory Considerations
- Default settings use ~1-2GB of memory
- Use `batch-seeder.ts` for memory-constrained environments
- Reduce `CONCURRENT_BATCHES` if you encounter memory issues

### Email Uniqueness
- Generated emails include timestamps to ensure uniqueness
- If you encounter duplicate email errors, the seeder will continue with other users

## 🔍 Troubleshooting

### Common Issues

1. **"SUPABASE_URL is required"**
   - Make sure you've created a `.env` file with your Supabase credentials

2. **"Invalid API key"**
   - Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct
   - Ensure you're using the service role key, not the anon key

3. **Rate limiting errors**
   - Reduce `CONCURRENT_BATCHES` or increase delays
   - Check your Supabase plan's rate limits

4. **Memory issues**
   - Use the batch seeder: `npm run seed:batch`
   - Reduce `BATCH_SIZE` and `CONCURRENT_BATCHES`

### Debug Mode

Enable debug mode to see detailed error information:

```bash
npm run seed --debug
```

## 📚 References

- [Original GitHub Discussion](https://github.com/orgs/supabase/discussions/35391)
- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/admin-api)
- [User Management Documentation](https://supabase.com/docs/guides/auth/managing-user-data)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - see LICENSE file for details.
