import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as logs from '@aws-cdk/aws-logs';

export interface ApiGatewayProps {
    readonly listHandler: lambda.IFunction;
}

export class ApiGatewayResources extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props: ApiGatewayProps) {
        super(scope, id);

        // All the lambdas mustbe created before
        this.node.addDependency(props.listHandler);

        // API
        const prdLogGroup = new logs.LogGroup(this, "PrdLogs", {
            logGroupName: '/aws/apigateway/transactions-api'
        });
        const api = new apigateway.RestApi(this, "transactions-api", {
            restApiName: "Transactions API",
            description: "This API serves the Transactions.",
            deployOptions: {
                accessLogDestination: new apigateway.LogGroupLogDestination(prdLogGroup),
                accessLogFormat: apigateway.AccessLogFormat.clf()
            }
        });
        const transactionsApi = api.root.addResource("transactions");

        // ---------------------------------------------
        // Bind the List operation to the List lambda
        const operationList = new apigateway.LambdaIntegration(props.listHandler);
        transactionsApi.addMethod("GET", operationList);

    }
}