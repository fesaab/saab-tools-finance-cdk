import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambdaEvents from '@aws-cdk/aws-lambda-event-sources';
import * as sqs from '@aws-cdk/aws-sqs';
import * as logs from '@aws-cdk/aws-logs';
import { execSync } from 'child_process';

export interface SmsProcessorProps {
    readonly smsTable: dynamodb.ITable;
    readonly transactionTable: dynamodb.ITable;
    readonly categoriesMappingTable: dynamodb.ITable;
    readonly lambdaJavaProjectPomPath: string;
    readonly lambdaJavaProjectJarPath: string;
}

export class SmsProcessorResources extends cdk.Construct {

    public readonly lambda: lambda.Function;

    constructor(scope: cdk.Construct, id: string, props: SmsProcessorProps) {
        super(scope, id);

        // Declare that this construct explicitly depends on the dynamodb tables
        this.node.addDependency(props.smsTable);
        this.node.addDependency(props.transactionTable);
        

        // Build the java code and pack the final jar on the lambda.Code
        console.log("Compiling, testing and packing java code...")
        try {
            const cmd = `mvn test package -f "${props.lambdaJavaProjectPomPath}"`;
            const outputBuffer = execSync(cmd);
            console.log(outputBuffer.toString());
            console.log("Java code ready!")
        } catch (exception) {
            console.log("--------------------------------");
            console.log("Error preparing Java code with the following message: " + exception.stderr.toString());
            console.log("--------------------------------");
        }

        // Creates the lambda to process SMS messages
        const lambdaName = 'SMSDynamoDbHandler';
        this.lambda = new lambda.Function(this, 'SMSDynamoDbHandler', {
            functionName: lambdaName,
            runtime: lambda.Runtime.JAVA_11,
            memorySize: 512,
            timeout: cdk.Duration.seconds(30),
            code: lambda.Code.fromAsset(props.lambdaJavaProjectJarPath),
            handler: "com.saab.tools.finance.handler.SMSDynamoDbHandler::handleRequest",
            environment: {
                "smsTableName": props.smsTable.tableName,
                "transactionTableName": props.transactionTable.tableName,
                "categoriesMappingTableName": props.categoriesMappingTable.tableName
            }
        });

        // Give permission on the tables to the lambda
        props.smsTable.grantStreamRead(this.lambda);
        props.smsTable.grantReadWriteData(this.lambda);
        props.transactionTable.grantReadWriteData(this.lambda);
        props.categoriesMappingTable.grantReadWriteData(this.lambda);

        // Dead Letter Queue to store processing errors
        const dlQueue = new sqs.Queue(this, 'SMSDeadLetterQueue', {
            queueName: 'SMSDeadLetterQueue'
        });
        dlQueue.grantSendMessages(this.lambda);

        // Log Group of the lambda
        const logGroup = new logs.LogGroup(this, 'LogGroupSMSDynamoDbHandler', {
            logGroupName: '/aws/lambda/' + lambdaName,
            retention: logs.RetentionDays.TWO_WEEKS
        });
        logGroup.grantWrite(this.lambda);

        // Add a trigger in the SMS DynamoDb table to invoke the lambda
        this.lambda.addEventSource(new lambdaEvents.DynamoEventSource(props.smsTable, {
            startingPosition: lambda.StartingPosition.LATEST,
            batchSize: 1,
            onFailure: new lambdaEvents.SqsDlq(dlQueue),
            retryAttempts: 2
        }));
        
    }
}