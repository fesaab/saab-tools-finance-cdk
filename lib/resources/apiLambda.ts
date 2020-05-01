import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as logs from '@aws-cdk/aws-logs';

export interface ApiLambdaProps {
    readonly transactionTable: dynamodb.ITable;
    readonly categoriesMappingTable: dynamodb.ITable;
    readonly lambdaNodeProjectPath: string;
}

export class ApiLambdaResources extends cdk.Construct {

    public readonly authorizerHandler: lambda.IFunction;
    public readonly listHandler: lambda.IFunction;
    public readonly categoryMappingHandler: lambda.IFunction;

    constructor(scope: cdk.Construct, id: string, props: ApiLambdaProps) {
        super(scope, id);

        // ---------------------------------------------
        // Creates the request based lambda authorizer
        // ---------------------------------------------
        // Creates the lambda to list all transactions
        const authorizerLambda = this.createLambda({
            name: 'TransactionsApiAuthorizerHandler',
            handler: "api/authorizer.handler",
            environmentVars: {
                "AUTHORIZATION_HEADER": 'Custom CMc[3pSa3JvS}68Dztd6[qE'
            },
            projectPath: props.lambdaNodeProjectPath
        });
        this.authorizerHandler = authorizerLambda.lambda;

        // ---------------------------------------------
        // Creates the lambda to list all transactions
        const listLambda = this.createLambda({
            name: 'TransactionsApiGetHandler',
            handler: "api/list.handler",
            environmentVars: {
                "transactionTableName": props.transactionTable.tableName
            },
            projectPath: props.lambdaNodeProjectPath
        });
        props.transactionTable.grantReadWriteData(listLambda.lambda);
        this.listHandler = listLambda.lambda;

        // ---------------------------------------------
        // Creates the lambda to update the transaction category and category mapping
        const categoryLambda = this.createLambda({
            name: 'TransactionsApiCategoryPutHandler',
            handler: "api/category.handler",
            environmentVars: {
                "transactionTableName": props.transactionTable.tableName,
                "categoriesMappingTableName": props.categoriesMappingTable.tableName
            },
            projectPath: props.lambdaNodeProjectPath
        });
        props.transactionTable.grantReadWriteData(categoryLambda.lambda);
        props.categoriesMappingTable.grantReadWriteData(categoryLambda.lambda);
        this.categoryMappingHandler = categoryLambda.lambda;
    }

    /**
     * Creates a new lambda function with it's own log group.
     * 
     * @param props 
     */    
    private createLambda(props: LambdaFunctionProps): LambdaFunction {
        const lambdaFucntion = new lambda.Function(this, props.name, {
            functionName: props.name,
            runtime: lambda.Runtime.NODEJS_12_X,
            memorySize: 256,
            timeout: cdk.Duration.seconds(30),
            code: lambda.Code.fromAsset(props.projectPath),
            handler: props.handler,
            environment: props.environmentVars
        });
        const logGroup = new logs.LogGroup(this, 'LogGroup' + props.name, {
            logGroupName: '/aws/lambda/' + props.name,
            retention: logs.RetentionDays.TWO_WEEKS
        });
        logGroup.grantWrite(lambdaFucntion);

        return {
            lambda: lambdaFucntion,
            logGroup: logGroup
        }
    }
}

interface LambdaFunctionProps {
    name: string,
    handler: string,
    environmentVars?: {
        [key: string]: string;
    }
    projectPath: string
}

interface LambdaFunction {
    lambda: lambda.IFunction,
    logGroup: logs.ILogGroup
}