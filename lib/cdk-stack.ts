import * as cdk from '@aws-cdk/core';
import { DynamoDbResources } from './resources/dynamodb';
import { SmsProcessorResources } from './resources/smsProcessor';
import { ApiLambdaResources } from './resources/apiLambda';
import { ApiGatewayResources } from './resources/apiGateway';
import * as path from 'path';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB
    const dynamodbTables = new DynamoDbResources(this, 'DynamoDB Tables', {
      smsTableArn: "arn:aws:dynamodb:us-east-1:689243596060:table/Sms-ta6uu4hiczh3lfovbmafoet3mq-prod",
      smsTableStreamArn: "arn:aws:dynamodb:us-east-1:689243596060:table/Sms-ta6uu4hiczh3lfovbmafoet3mq-prod/stream/2020-11-22T14:28:44.045"
    });

    // Lambda
    const smsProcessor = new SmsProcessorResources(this, 'SMS Processor', {
      smsTable: dynamodbTables.smsTable,
      transactionTable: dynamodbTables.transactionsTable,
      categoriesMappingTable: dynamodbTables.categoryTable,
      lambdaJavaProjectPomPath: path.join(__dirname, '..', '..', 'saab-tools-finance', 'pom.xml'),
      lambdaJavaProjectJarPath: path.join(__dirname, '..', '..', 'saab-tools-finance', 'target', 'finance-1.0.jar')
    });

    // API
    const apiLambdas = new ApiLambdaResources(this, 'API Lambdas', {
      transactionTable: dynamodbTables.transactionsTable,
      categoriesMappingTable: dynamodbTables.categoryTable,
      monthPeriodTable: dynamodbTables.monthPeriodTable,
      lambdaNodeProjectPath: path.join(__dirname, '..', '..', 'saab-tools-finance-api')
    });
    const apiGateway = new ApiGatewayResources(this, 'API Gateway', {
      authorizerHandler: apiLambdas.authorizerHandler,
      listHandler: apiLambdas.listHandler,
      categoryHandler: apiLambdas.categoryMappingHandler,
      monthPeriodListHandler: apiLambdas.monthPeriodListHandler,
      monthPeriodUpdateHandler: apiLambdas.monthPeriodUpdateHandler
    })

  }
}
