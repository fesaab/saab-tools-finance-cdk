import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

export interface DynamoDbProps {
    readonly smsTableArn: string;
    readonly smsTableStreamArn: string;
}

export class DynamoDbResources extends cdk.Construct {

    public readonly transactionsTable: dynamodb.ITable;
    public readonly smsTable: dynamodb.ITable;

    constructor(scope: cdk.Construct, id: string, props: DynamoDbProps) {
        super(scope, id);

        // Transactions Table
        const table = new dynamodb.Table(this, 'Transactions', {
            tableName: "Transactions",
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: "id",
                type: dynamodb.AttributeType.STRING
            }
        });
        this.transactionsTable = table;

        // SMS table reference
        this.smsTable = dynamodb.Table.fromTableAttributes(this, 'SmsTable', {
            tableArn: props.smsTableArn,
            tableStreamArn: props.smsTableStreamArn
        });
    }
}