/**
 * MigrationBox V5.0 - GCP Pub/Sub Messaging Adapter
 * 
 * Implements MessagingAdapter interface using Google Cloud Pub/Sub SDK.
 */

import { PubSub, Topic, Subscription, Message as PubSubMessage } from '@google-cloud/pubsub';
import { MessagingAdapter, Message } from '../../../packages/cal/src/interfaces';

export class GCPPubSubAdapter implements MessagingAdapter {
  private client: PubSub;

  constructor() {
    this.client = new PubSub({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE,
    });
  }

  async sendMessage(queue: string, message: Record<string, any>, delaySeconds?: number): Promise<string> {
    const topic = this.client.topic(queue);
    const exists = await topic.exists();
    
    if (!exists[0]) {
      await topic.create();
    }
    
    const messageBuffer = Buffer.from(JSON.stringify(message));
    const messageId = await topic.publishMessage({
      data: messageBuffer,
      attributes: {
        timestamp: new Date().toISOString(),
      },
    });
    
    return messageId;
  }

  async receiveMessages(queue: string, maxMessages?: number, waitTimeSeconds?: number): Promise<Message[]> {
    const subscription = this.client.subscription(queue);
    const exists = await subscription.exists();
    
    if (!exists[0]) {
      throw new Error(`Subscription ${queue} does not exist`);
    }
    
    const messages: Message[] = [];
    const maxCount = maxMessages || 10;
    const timeout = waitTimeSeconds ? waitTimeSeconds * 1000 : 5000;
    
    return new Promise((resolve, reject) => {
      const messageHandler = (msg: PubSubMessage) => {
        messages.push({
          id: msg.id,
          body: JSON.parse(msg.data.toString()),
          receiptHandle: msg.ackId || msg.id,
          attributes: msg.attributes || {},
          receivedAt: new Date(),
        });
        
        if (messages.length >= maxCount) {
          subscription.removeListener('message', messageHandler);
          resolve(messages);
        }
      };
      
      subscription.on('message', messageHandler);
      
      setTimeout(() => {
        subscription.removeListener('message', messageHandler);
        resolve(messages);
      }, timeout);
    });
  }

  async deleteMessage(queue: string, receiptHandle: string): Promise<void> {
    const subscription = this.client.subscription(queue);
    // In Pub/Sub, messages are acknowledged to delete them
    // receiptHandle is the ackId
    await subscription.ackMessages([receiptHandle]);
  }

  async publishEvent(topic: string, event: Record<string, any>, eventType: string): Promise<void> {
    const pubsubTopic = this.client.topic(topic);
    const exists = await pubsubTopic.exists();
    
    if (!exists[0]) {
      await pubsubTopic.create();
    }
    
    await pubsubTopic.publishMessage({
      data: Buffer.from(JSON.stringify({
        ...event,
        eventType,
        timestamp: new Date().toISOString(),
      })),
      attributes: {
        eventType,
      },
    });
  }

  async createQueue(queueName: string, options?: { fifo?: boolean; dlqArn?: string; maxRetries?: number }): Promise<string> {
    // In Pub/Sub, queues are subscriptions
    const topic = this.client.topic(queueName);
    const exists = await topic.exists();
    
    if (!exists[0]) {
      await topic.create();
    }
    
    const subscription = topic.subscription(`${queueName}-sub`);
    const subExists = await subscription.exists();
    
    if (!subExists[0]) {
      await subscription.create();
    }
    
    return subscription.name;
  }

  async createTopic(topicName: string): Promise<string> {
    const topic = this.client.topic(topicName);
    const exists = await topic.exists();
    
    if (!exists[0]) {
      await topic.create();
    }
    
    return topic.name;
  }

  async subscribeQueueToTopic(topic: string, queue: string): Promise<void> {
    const pubsubTopic = this.client.topic(topic);
    const subscription = pubsubTopic.subscription(queue);
    const exists = await subscription.exists();
    
    if (!exists[0]) {
      await subscription.create();
    }
  }
}
