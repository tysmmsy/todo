import { defineBackend } from '@aws-amplify/backend'
import type { AddEnvironmentFactory } from '@aws-amplify/backend-function'
import type {
	FunctionResources,
	ResourceAccessAcceptorFactory,
	ResourceProvider,
} from '@aws-amplify/plugin-types'
import { RemovalPolicy, Stack, aws_dynamodb } from 'aws-cdk-lib'
import {
	CorsHttpMethod,
	HttpApi,
	HttpMethod,
} from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { auth } from './auth/resource'
import { deleteTodoFunction } from './functions/todo/deleteTodo/resource'
import { listTodoFunction } from './functions/todo/listTodo/resource'
import { postTodoFunction } from './functions/todo/postTodo/resource'
import { putTodoFunction } from './functions/todo/putTodo/resource'
import { searchTodoFunction } from './functions/todo/searchTodo/resource'

const backend = defineBackend({
	auth,
	listTodoFunction,
	searchTodoFunction,
	postTodoFunction,
	putTodoFunction,
	deleteTodoFunction,
})

/**
 * DynamoDB
 */
const externalDataSourcesStack = backend.createStack('TodoTableStack')

export const todoTable = new aws_dynamodb.Table(
	externalDataSourcesStack,
	'MyTodoTable',
	{
		partitionKey: { name: 'id', type: aws_dynamodb.AttributeType.STRING },
		billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
		removalPolicy: RemovalPolicy.DESTROY,
	},
)

todoTable.addGlobalSecondaryIndex({
	indexName: 'gsi-OwnerTodo',
	partitionKey: { name: 'owner', type: aws_dynamodb.AttributeType.STRING },
	projectionType: aws_dynamodb.ProjectionType.ALL,
})

todoTable.grantReadData(backend.listTodoFunction.resources.lambda)
todoTable.grantReadData(backend.searchTodoFunction.resources.lambda)
todoTable.grantWriteData(backend.postTodoFunction.resources.lambda)
todoTable.grantWriteData(backend.putTodoFunction.resources.lambda)
todoTable.grantWriteData(backend.deleteTodoFunction.resources.lambda)

/**
 * Lambda ロググループ設定
 */
const createLogGroup = (
	lambdaFunction: Omit<
		ResourceProvider<FunctionResources> &
			ResourceAccessAcceptorFactory &
			AddEnvironmentFactory,
		'getResourceAccessAcceptor'
	>,
	logGroupName: string,
) => {
	new LogGroup(lambdaFunction.resources.lambda, logGroupName, {
		logGroupName: `/aws/lambda/${lambdaFunction.resources.lambda.functionName}`,
		retention: RetentionDays.ONE_DAY,
	})
}

createLogGroup(backend.listTodoFunction, 'listTodoFnLogGroup')
createLogGroup(backend.searchTodoFunction, 'searchTodoFnLogGroup')
createLogGroup(backend.postTodoFunction, 'PostTodoFnLogGroup')
createLogGroup(backend.putTodoFunction, 'PutTodoFnLogGroup')
createLogGroup(backend.deleteTodoFunction, 'DeleteTodoFnLogGroup')

/**
 * Lambda 環境変数設定
 */

const addCommonEnvironmentVariables = (
	lambdaFunction: Omit<
		ResourceProvider<FunctionResources> &
			ResourceAccessAcceptorFactory &
			AddEnvironmentFactory,
		'getResourceAccessAcceptor'
	>,
) => {
	lambdaFunction.addEnvironment(
		'COGNITO_USER_POOL_CLIENT_ID',
		backend.auth.resources.userPoolClient.userPoolClientId,
	)
	lambdaFunction.addEnvironment(
		'COGNITO_USER_POOL_ID',
		backend.auth.resources.userPool.userPoolId,
	)
	lambdaFunction.addEnvironment('TODO_TABLE_NAME', todoTable.tableName)
	lambdaFunction.addEnvironment('POWERTOOLS_LOG_LEVEL', 'DEBUG')
}

addCommonEnvironmentVariables(backend.listTodoFunction)
addCommonEnvironmentVariables(backend.searchTodoFunction)
addCommonEnvironmentVariables(backend.postTodoFunction)
addCommonEnvironmentVariables(backend.putTodoFunction)
addCommonEnvironmentVariables(backend.deleteTodoFunction)

/**
 * API Gateway
 * https://docs.amplify.aws/nextjs/build-a-backend/add-aws-services/rest-api/set-up-http-api/
 * に倣って設定
 */
const apiStack = backend.createStack('api-stack')

const userPoolAuthorizer = new HttpUserPoolAuthorizer(
	'userPoolAuth',
	backend.auth.resources.userPool,
	{
		userPoolClients: [backend.auth.resources.userPoolClient],
	},
)

const httpApi = new HttpApi(apiStack, 'HttpApi', {
	apiName: 'myHttpApi',
	corsPreflight: {
		allowMethods: [
			CorsHttpMethod.GET,
			CorsHttpMethod.POST,
			CorsHttpMethod.PUT,
			CorsHttpMethod.DELETE,
		],
		allowOrigins: ['*'],
		allowHeaders: ['*'],
	},
	createDefaultStage: true,
})

httpApi.addRoutes({
	path: '/todo',
	methods: [HttpMethod.GET],
	integration: new HttpLambdaIntegration(
		'listIntegration',
		backend.listTodoFunction.resources.lambda,
	),
	authorizer: userPoolAuthorizer,
})

httpApi.addRoutes({
	path: '/todo/search',
	methods: [HttpMethod.GET],
	integration: new HttpLambdaIntegration(
		'searchIntegration',
		backend.searchTodoFunction.resources.lambda,
	),
	authorizer: userPoolAuthorizer,
})

httpApi.addRoutes({
	path: '/todo',
	methods: [HttpMethod.POST],
	integration: new HttpLambdaIntegration(
		'postIntegration',
		backend.postTodoFunction.resources.lambda,
	),
	authorizer: userPoolAuthorizer,
})

httpApi.addRoutes({
	path: '/todo/{id}',
	methods: [HttpMethod.PUT],
	integration: new HttpLambdaIntegration(
		'putIntegration',
		backend.putTodoFunction.resources.lambda,
	),
	authorizer: userPoolAuthorizer,
})

httpApi.addRoutes({
	path: '/todo/{id}',
	methods: [HttpMethod.DELETE],
	integration: new HttpLambdaIntegration(
		'deleteIntegration',
		backend.deleteTodoFunction.resources.lambda,
	),
	authorizer: userPoolAuthorizer,
})

const apiPolicy = new Policy(apiStack, 'ApiPolicy', {
	statements: [
		new PolicyStatement({
			actions: ['execute-api:Invoke'],
			resources: [
				`${httpApi.arnForExecuteApi('GET', '/todo')}`,
				`${httpApi.arnForExecuteApi('POST', '/todo')}`,
				`${httpApi.arnForExecuteApi('PUT', '/todo/{id}')}`,
				`${httpApi.arnForExecuteApi('DELETE', '/todo/{id}')}`,
			],
		}),
	],
})

backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiPolicy)

backend.addOutput({
	custom: {
		API: {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			[httpApi.httpApiName!]: {
				endpoint: httpApi.url,
				region: Stack.of(httpApi).region,
				apiName: httpApi.httpApiName,
			},
		},
	},
})
