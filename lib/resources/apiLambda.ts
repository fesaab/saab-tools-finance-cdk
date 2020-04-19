import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as logs from '@aws-cdk/aws-logs';

export interface ApiLambdaProps {
    readonly transactionTable: dynamodb.ITable;
    readonly lambdaNodeProjectPath: string;
}

export class ApiLambdaResources extends cdk.Construct {

    public readonly listHandler: lambda.Function;

    constructor(scope: cdk.Construct, id: string, props: ApiLambdaProps) {
        super(scope, id);

        // ---------------------------------------------
        // Creates the lambda to list all transactions
        const lambdaName = 'TransactionsApiGetHandler';
        this.listHandler = new lambda.Function(this, lambdaName, {
            functionName: lambdaName,
            runtime: lambda.Runtime.NODEJS_12_X,
            memorySize: 256,
            timeout: cdk.Duration.seconds(30),
            code: lambda.Code.fromAsset(props.lambdaNodeProjectPath),
            handler: "api/list.handler",
            environment: {
                "transactionTableName": props.transactionTable.tableName
            }
        });
        const logGroup = new logs.LogGroup(this, 'LogGroup' + lambdaName, {
            logGroupName: '/aws/lambda/' + lambdaName,
            retention: logs.RetentionDays.TWO_WEEKS
        });
        props.transactionTable.grantReadWriteData(this.listHandler);
        logGroup.grantWrite(this.listHandler);
        
    }
}