import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as logs from '@aws-cdk/aws-logs';

export interface ApiGatewayProps {
    readonly authorizerHandler: lambda.IFunction;
    readonly listHandler: lambda.IFunction;
}

export class ApiGatewayResources extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props: ApiGatewayProps) {
        super(scope, id);

        // All the lambdas mustbe created before
        this.node.addDependency(props.listHandler);

        // API
        // log group
        const prdLogGroup = new logs.LogGroup(this, "PrdLogs", {
            logGroupName: '/aws/apigateway/transactions-api'
        });
        // api
        const api = new apigateway.RestApi(this, "transactions-api", {
            restApiName: "Transactions API",
            description: "This API serves the Transactions.",
            deployOptions: {
                accessLogDestination: new apigateway.LogGroupLogDestination(prdLogGroup),
                accessLogFormat: apigateway.AccessLogFormat.clf()
            }
        });
        //resource /transactions
        const transactionsApi = api.root.addResource("transactions");

        // Request based lambda authorizer
        const requestAuthorizer = new apigateway.RequestAuthorizer(this, 'transactionAuthorizer', {
            handler: props.authorizerHandler,
            identitySources: [apigateway.IdentitySource.header('Authorization')]
        });

        // ---------------------------------------------
        // Bind the List operation to the List lambda, protected by the authorizer
        const operationList = new apigateway.LambdaIntegration(props.listHandler);
        transactionsApi.addMethod("GET", operationList, {
            authorizer: requestAuthorizer
        });

    }
}