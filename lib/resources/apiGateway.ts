import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as logs from '@aws-cdk/aws-logs';

export interface ApiGatewayProps {
    readonly authorizerHandler: lambda.IFunction;
    readonly listHandler: lambda.IFunction;
    readonly categoryHandler: lambda.IFunction;
    readonly monthPeriodListHandler: lambda.IFunction;
    readonly monthPeriodUpdateHandler: lambda.IFunction;
}

interface TransactionApiProps {
    readonly authorizerHandler: lambda.IFunction;
    readonly transactionListHandler: lambda.IFunction;
    readonly categoryMappingHandler: lambda.IFunction;
}

interface MonthsPeriodApiProps {
    readonly authorizerHandler: lambda.IFunction;
    readonly monthPeriodListHandler: lambda.IFunction;
    readonly monthPeriodUpdateHandler: lambda.IFunction;
}

export class ApiGatewayResources extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props: ApiGatewayProps) {
        super(scope, id);

        // All the lambdas mustbe created before
        this.node.addDependency(props.listHandler);

        // Creates the root API
        const apiLogGroup = new logs.LogGroup(this, "PrdLogs", {
            logGroupName: '/aws/apigateway/saab-tools-finance-api'
        });
        const rootApi = new apigateway.RestApi(this, "saab-tools-finance-api", {
            restApiName: "Saab Tools Finance",
            description: "Saab Tools Finance APIs.",
            deployOptions: {
                accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
                accessLogFormat: apigateway.AccessLogFormat.clf()
            }
        });

        // API /transactions
        this.setupTransactionsAPI(rootApi, {
            authorizerHandler: props.authorizerHandler,
            transactionListHandler: props.listHandler,
            categoryMappingHandler: props.categoryHandler
        });

        // API /months
        this.setupMonthsAPI(rootApi, {
            authorizerHandler: props.authorizerHandler,
            monthPeriodListHandler: props.monthPeriodListHandler,
            monthPeriodUpdateHandler: props.monthPeriodUpdateHandler
        });
    }

    /**
     * Setup the infrastructure for the /transactions API
     * @param props
     */
    private setupTransactionsAPI(restApi: apigateway.RestApi, props: TransactionApiProps) {
        
        // Resource GET /transactions
        // -------------------------
        const transactionsApi = restApi.root.addResource("transactions");
        const operationList = new apigateway.LambdaIntegration(props.transactionListHandler);
        transactionsApi.addMethod("GET", operationList, {
            authorizer: new apigateway.RequestAuthorizer(this, 'transactionAuthorizerList', {
                handler: props.authorizerHandler,
                identitySources: [apigateway.IdentitySource.header('Authorization')]
            })
        });

        // Resource PUT /transactions/category
        // -------------------------
        const categoriesApi = transactionsApi.addResource("category");
        const operationUpdateCategory = new apigateway.LambdaIntegration(props.categoryMappingHandler);
        categoriesApi.addMethod("PUT", operationUpdateCategory, {
            authorizer: new apigateway.RequestAuthorizer(this, 'transactionAuthorizerCategoryUpdate', {
                handler: props.authorizerHandler,
                identitySources: [apigateway.IdentitySource.header('Authorization')]
            })
        });

    }

    /**
     * Setup the infrastructure for the /months API
     * @param props
     */
    private setupMonthsAPI(restApi: apigateway.RestApi, props: MonthsPeriodApiProps) {
        const rootApi = restApi.root.addResource("months");
        
        // Resource GET /months/{month}
        // -------------------------
        const listResource = rootApi.addResource("{month}");
        const operationList = new apigateway.LambdaIntegration(props.monthPeriodListHandler);
        listResource.addMethod("GET", operationList, {
            authorizer: new apigateway.RequestAuthorizer(this, 'transactionAuthorizerMonthPeriodList', {
                handler: props.authorizerHandler,
                identitySources: [apigateway.IdentitySource.header('Authorization')]
            })
        });

        // Resource POST /months
        // -------------------------
        const operationUpdate = new apigateway.LambdaIntegration(props.monthPeriodUpdateHandler);
        rootApi.addMethod("POST", operationUpdate, {
            authorizer: new apigateway.RequestAuthorizer(this, 'transactionAuthorizerMonthPeriodUpdate', {
                handler: props.authorizerHandler,
                identitySources: [apigateway.IdentitySource.header('Authorization')]
            })
        });
    }
}