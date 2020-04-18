import * as cdk from '@aws-cdk/core';
import { DynamoDbResources } from './resources/dynamodb';
import { SmsProcessorResources } from './resources/smsProcessor'
import * as path from 'path';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB
    const dynamodbTables = new DynamoDbResources(this, 'DynamoDB Tables', {
      smsTableArn: "arn:aws:dynamodb:us-east-1:689243596060:table/Sms-t6sbvak6bfcfrmog5tw7j6o5cq-dev",
      smsTableStreamArn: "arn:aws:dynamodb:us-east-1:689243596060:table/Sms-t6sbvak6bfcfrmog5tw7j6o5cq-dev/stream/2020-03-29T09:36:04.035"
    });

    // Lambda
    const smsProcessor = new SmsProcessorResources(this, 'SMS Processor', {
      smsTable: dynamodbTables.smsTable,
      transactionTable: dynamodbTables.transactionsTable,
      lambdaJavaProjectPomPath: path.join(__dirname, '..', '..', 'saab-tools-finance', 'pom.xml'),
      lambdaJavaProjectJarPath: path.join(__dirname, '..', '..', 'saab-tools-finance', 'target', 'finance-1.0.jar')
    });

    // TODO API

    // TODO front end

  }
}
