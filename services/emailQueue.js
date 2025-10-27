const Queue = require('bull');
const Redis = require('redis');

// Email job queue for background processing
class EmailQueue {
  constructor() {
    // Create Redis client for queue storage
    this.redisClient = Redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('Redis server connection refused');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          console.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          console.error('Redis retry attempts exhausted');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // Create Bull queue
    this.emailQueue = new Queue('email sending', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined
      },
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    // Process email jobs
    this.emailQueue.process('send-contact-email', 5, this.processContactEmail.bind(this));
    this.emailQueue.process('send-quote-email', 5, this.processQuoteEmail.bind(this));

    console.log('📧 Email queue initialized');
  }

  /**
   * Add contact email job to queue
   */
  async addContactEmailJob(contactData) {
    try {
      const job = await this.emailQueue.add('send-contact-email', {
        type: 'contact',
        data: contactData,
        timestamp: new Date().toISOString()
      });

      console.log(`📧 Contact email job queued: ${job.id}`);
      return { success: true, jobId: job.id };
    } catch (error) {
      console.error('❌ Failed to queue contact email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add quote email job to queue
   */
  async addQuoteEmailJob(quoteData) {
    try {
      const job = await this.emailQueue.add('send-quote-email', {
        type: 'quote',
        data: quoteData,
        timestamp: new Date().toISOString()
      });

      console.log(`📧 Quote email job queued: ${job.id}`);
      return { success: true, jobId: job.id };
    } catch (error) {
      console.error('❌ Failed to queue quote email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process contact email jobs
   */
  async processContactEmail(job) {
    try {
      console.log(`📧 Processing contact email job: ${job.id}`);

      const emailService = require('../services/emailService');
      const confirmationResult = await emailService.sendConfirmationEmail(job.data.data);
      const adminNotificationResult = await emailService.sendAdminNotification(job.data.data);

      if (!confirmationResult.success || !adminNotificationResult.success) {
        throw new Error(`Email sending failed: Confirmation: ${confirmationResult.success}, Admin: ${adminNotificationResult.success}`);
      }

      console.log(`✅ Contact email job completed: ${job.id}`);
      return { success: true, confirmation: confirmationResult.success, admin: adminNotificationResult.success };

    } catch (error) {
      console.error(`❌ Contact email job failed: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Process quote email jobs
   */
  async processQuoteEmail(job) {
    try {
      console.log(`📧 Processing quote email job: ${job.id}`);

      const emailService = require('../services/emailService');
      const confirmationResult = await emailService.sendQuoteConfirmation(job.data.data);
      const adminNotificationResult = await emailService.sendQuoteAdminNotification(job.data.data);

      if (!confirmationResult.success || !adminNotificationResult.success) {
        throw new Error(`Email sending failed: Confirmation: ${confirmationResult.success}, Admin: ${adminNotificationResult.success}`);
      }

      console.log(`✅ Quote email job completed: ${job.id}`);
      return { success: true, confirmation: confirmationResult.success, admin: adminNotificationResult.success };

    } catch (error) {
      console.error(`❌ Quote email job failed: ${job.id}`, error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const waiting = await this.emailQueue.getWaiting();
      const active = await this.emailQueue.getActive();
      const completed = await this.emailQueue.getCompleted();
      const failed = await this.emailQueue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length
      };
    } catch (error) {
      console.error('❌ Failed to get queue stats:', error);
      return null;
    }
  }

  /**
   * Gracefully shutdown queue
   */
  async close() {
    try {
      await this.emailQueue.close();
      this.redisClient.quit();
      console.log('📧 Email queue shut down gracefully');
    } catch (error) {
      console.error('❌ Error shutting down email queue:', error);
    }
  }
}

// Export singleton instance
module.exports = new EmailQueue();
