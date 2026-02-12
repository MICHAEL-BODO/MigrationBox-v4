/**
 * MigrationBox V5.0 - Azure Service Bus Messaging Adapter
 * 
 * Implements MessagingAdapter interface using Azure Service Bus SDK.
 */

import { ServiceBusClient, ServiceBusSender, ServiceBusReceiver, ServiceBusMessage } from '@azure/service-bus';
import { MessagingAdapter, Message } from '../../../packages/cal/src/interfaces';

export class AzureServiceBusAdapter implements MessagingAdapter {
  private client: ServiceBusClient;
  private connectionString: string;

  constructor() {
    this.connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING || '';
    
    if (!this.connectionString) {
      throw new Error('Azure Service Bus connection string not configured. Set AZURE_SERVICE_BUS_CONNECTION_STRING');
    }

    this.client = new ServiceBusClient(this.connectionString);
  }

  async sendMessage(queue: string, message: Record<string, any>, delaySeconds?: number): Promise<string> {
    const sender = this.client.createSender(queue);
    
    const serviceBusMessage: ServiceBusMessage = {
      body: message,
      applicationProperties: {
        timestamp: new Date().toISOString(),
      },
    };
    
    if (delaySeconds && delaySeconds > 0) {
      serviceBusMessage.scheduledEnqueueTime = new Date(Date.now() + delaySeconds * 1000);
    }
    
    await sender.sendMessages(serviceBusMessage);
    await sender.close();
    
    return `msg-${Date.now()}`;
  }

  async receiveMessages(queue: string, maxMessages?: number, waitTimeSeconds?: number): Promise<Message[]> {
    const receiver = this.client.createReceiver(queue, {
      receiveMode: 'peekLock',
    });
    
    const messages: Message[] = [];
    const maxCount = maxMessages || 10;
    const timeout = waitTimeSeconds ? waitTimeSeconds * 1000 : 5000;
    
    const startTime = Date.now();
    while (messages.length < maxCount && Date.now() - startTime < timeout) {
      const receivedMessages = await receiver.receiveMessages(maxCount - messages.length, {
        maxWaitTimeInMs: timeout - (Date.now() - startTime),
      });
      
      for (const msg of receivedMessages) {
        messages.push({
          id: msg.messageId || '',
          body: msg.body as Record<string, any>,
          receiptHandle: msg.lockToken || '',
          attributes: msg.applicationProperties as Record<string, string> || {},
          receivedAt: new Date(),
        });
      }
      
      if (receivedMessages.length === 0) {
        break;
      }
    }
    
    await receiver.close();
    return messages;
  }

  async deleteMessage(queue: string, receiptHandle: string): Promise<void> {
    const receiver = this.client.createReceiver(queue, {
      receiveMode: 'peekLock',
    });
    
    // In Service Bus, we need to complete/abandon the message
    // This is a simplified version - in production, track messages properly
    await receiver.close();
  }

  async publishEvent(topic: string, event: Record<string, any>, eventType: string): Promise<void> {
    const sender = this.client.createSender(topic);
    
    await sender.sendMessages({
      body: {
        ...event,
        eventType,
        timestamp: new Date().toISOString(),
      },
      applicationProperties: {
        eventType,
      },
    });
    
    await sender.close();
  }

  async createQueue(queueName: string, options?: { fifo?: boolean; dlqArn?: string; maxRetries?: number }): Promise<string> {
    // Azure Service Bus queues are created via Azure Portal or ARM templates
    // This is a placeholder - in production, use Azure Management SDK
    return `sb://${queueName}`;
  }

  async createTopic(topicName: string): Promise<string> {
    // Azure Service Bus topics are created via Azure Portal or ARM templates
    // This is a placeholder - in production, use Azure Management SDK
    return `sb://${topicName}`;
  }

  async subscribeQueueToTopic(topic: string, queue: string): Promise<void> {
    // In Azure Service Bus, subscriptions are created separately
    // This is a placeholder - in production, create subscription via Management SDK
    // Subscription name would be: `${topic}-${queue}`
  }
}
