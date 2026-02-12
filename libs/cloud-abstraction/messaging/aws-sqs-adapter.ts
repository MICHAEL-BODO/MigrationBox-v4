/**
 * MigrationBox V5.0 - AWS SQS/SNS Messaging Adapter
 * 
 * Implements MessagingAdapter interface using AWS SDK v3 for SQS and SNS.
 * Works with both real AWS and LocalStack (via AWS_ENDPOINT_URL).
 */

import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  CreateQueueCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import {
  SNSClient,
  PublishCommand,
  CreateTopicCommand,
  SubscribeCommand,
} from '@aws-sdk/client-sns';
import { MessagingAdapter, Message } from '../../../packages/cal/src/interfaces';

export class AWSSQSAdapter implements MessagingAdapter {
  private sqsClient: SQSClient;
  private snsClient: SNSClient;

  constructor() {
    const config: any = {
      region: process.env.AWS_DEFAULT_REGION || process.env.REGION || 'us-east-1',
    };

    // Support LocalStack endpoint
    if (process.env.AWS_ENDPOINT_URL) {
      config.endpoint = process.env.AWS_ENDPOINT_URL;
    }

    this.sqsClient = new SQSClient(config);
    this.snsClient = new SNSClient(config);
  }

  private async getQueueUrl(queueName: string): Promise<string> {
    try {
      const response = await this.sqsClient.send(new GetQueueUrlCommand({
        QueueName: queueName,
      }));
      return response.QueueUrl || '';
    } catch (error: any) {
      if (error.name === 'QueueDoesNotExist') {
        throw new Error(`Queue ${queueName} does not exist`);
      }
      throw error;
    }
  }

  async sendMessage(queue: string, message: Record<string, any>, delaySeconds?: number): Promise<string> {
    const queueUrl = await this.getQueueUrl(queue);
    
    const response = await this.sqsClient.send(new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
      DelaySeconds: delaySeconds || 0,
    }));

    return response.MessageId || '';
  }

  async receiveMessages(queue: string, maxMessages?: number, waitTimeSeconds?: number): Promise<Message[]> {
    const queueUrl = await this.getQueueUrl(queue);
    
    const response = await this.sqsClient.send(new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages || 10,
      WaitTimeSeconds: waitTimeSeconds || 0,
      AttributeNames: ['All'],
    }));

    return (response.Messages || []).map(msg => ({
      id: msg.MessageId || '',
      body: JSON.parse(msg.Body || '{}'),
      receiptHandle: msg.ReceiptHandle || '',
      attributes: msg.Attributes as Record<string, string> || {},
      receivedAt: new Date(),
    }));
  }

  async deleteMessage(queue: string, receiptHandle: string): Promise<void> {
    const queueUrl = await this.getQueueUrl(queue);
    
    await this.sqsClient.send(new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    }));
  }

  async publishEvent(topic: string, event: Record<string, any>, eventType: string): Promise<void> {
    const topicArn = topic.startsWith('arn:') ? topic : await this.getTopicArn(topic);
    
    await this.snsClient.send(new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify({
        ...event,
        eventType,
        timestamp: new Date().toISOString(),
      }),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: eventType,
        },
      },
    }));
  }

  private async getTopicArn(topicName: string): Promise<string> {
    // In LocalStack, construct ARN manually
    if (process.env.AWS_ENDPOINT_URL) {
      const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
      const accountId = process.env.AWS_ACCOUNT_ID || '000000000000';
      return `arn:aws:sns:${region}:${accountId}:${topicName}`;
    }
    
    // For real AWS, create topic if it doesn't exist
    try {
      const response = await this.snsClient.send(new CreateTopicCommand({
        Name: topicName,
      }));
      return response.TopicArn || '';
    } catch (error) {
      throw new Error(`Failed to get topic ARN for ${topicName}`);
    }
  }

  async createQueue(queueName: string, options?: { fifo?: boolean; dlqArn?: string; maxRetries?: number }): Promise<string> {
    const attributes: Record<string, string> = {};
    
    if (options?.fifo) {
      queueName = queueName.endsWith('.fifo') ? queueName : `${queueName}.fifo`;
      attributes.FifoQueue = 'true';
      attributes.ContentBasedDeduplication = 'true';
    }
    
    if (options?.dlqArn) {
      attributes.RedrivePolicy = JSON.stringify({
        deadLetterTargetArn: options.dlqArn,
        maxReceiveCount: options.maxRetries || 3,
      });
    }
    
    const response = await this.sqsClient.send(new CreateQueueCommand({
      QueueName: queueName,
      Attributes: attributes,
    }));

    return response.QueueUrl || '';
  }

  async createTopic(topicName: string): Promise<string> {
    const response = await this.snsClient.send(new CreateTopicCommand({
      Name: topicName,
    }));
    
    return response.TopicArn || '';
  }

  async subscribeQueueToTopic(topic: string, queue: string): Promise<void> {
    const topicArn = topic.startsWith('arn:') ? topic : await this.getTopicArn(topic);
    const queueUrl = await this.getQueueUrl(queue);
    const queueArn = await this.getQueueArn(queueUrl);
    
    await this.snsClient.send(new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: 'sqs',
      Endpoint: queueArn,
    }));
  }

  private async getQueueArn(queueUrl: string): Promise<string> {
    // Extract ARN from queue URL or construct it
    if (queueUrl.includes('arn:')) {
      return queueUrl;
    }
    
    const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
    const accountId = process.env.AWS_ACCOUNT_ID || '000000000000';
    const queueName = queueUrl.split('/').pop() || '';
    
    return `arn:aws:sqs:${region}:${accountId}:${queueName}`;
  }
}
