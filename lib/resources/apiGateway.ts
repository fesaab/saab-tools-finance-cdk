import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as logs from '@aws-cdk/aws-logs';

export interface ApiGatewayProps {
    readonly authorizerHandler: lambda.IFunction;
    readonly listHandler: lambda.IFunction;
    readonly categoryHandler: lambda.IFunction;
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

        // Request based lambda authorizer
        // const requestAuthorizer = new apigateway.RequestAuthorizer(this, 'transactionAuthorizer', {
        //     handler: props.authorizerHandler,
        //     identitySources: [apigateway.IdentitySource.header('Authorization')]
        // });
        
        // Resource /transactions
        // -------------------------
        const transactionsApi = api.root.addResource("transactions");
        // Bind the List operation to the List lambda, protected by the authorizer
        const operationList = new apigateway.LambdaIntegration(props.listHandler);
        transactionsApi.addMethod("GET", operationList, {
            authorizer: new apigateway.RequestAuthorizer(this, 'transactionAuthorizerList', {
                handler: props.authorizerHandler,
                identitySources: [apigateway.IdentitySource.header('Authorization')]
            })
        });

        // Resource /transactions/category
        // -------------------------
        const categoriesApi = transactionsApi.addResource("category");
        // Bind the Category operation to the Category lambda, protected by the authorizer
        const operationUpdateCategory = new apigateway.LambdaIntegration(props.categoryHandler);
        categoriesApi.addMethod("PUT", operationUpdateCategory, {
            authorizer: new apigateway.RequestAuthorizer(this, 'transactionAuthorizerCategoryUpdate', {
                handler: props.authorizerHandler,
                identitySources: [apigateway.IdentitySource.header('Authorization')]
            })
        });

    }
}