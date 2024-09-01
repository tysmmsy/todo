import { defineBackend } from '@aws-amplify/backend'
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
import { postTodoFunction } from './functions/todo/postTodo/resource'

const backend = defineBackend({
	auth,
	postTodoFunction,
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
todoTable.grantWriteData(backend.postTodoFunction.resources.lambda)

/**
 * Lambda
 */
// TODO: Lambdaごとにやると手間なため、後で改善する
new LogGroup(backend.postTodoFunction.resources.lambda, 'PostTodoFnLogGroup', {
	logGroupName: `/aws/lambda/${backend.postTodoFunction.resources.lambda.functionName}`,
	retention: RetentionDays.ONE_DAY,
})
backend.postTodoFunction.addEnvironment(
	'COGNITO_USER_POOL_CLIENT_ID',
	backend.auth.resources.userPoolClient.userPoolClientId,
)
backend.postTodoFunction.addEnvironment(
	'COGNITO_USER_POOL_ID',
	backend.auth.resources.userPool.userPoolId,
)
backend.postTodoFunction.addEnvironment('TODO_TABLE_NAME', todoTable.tableName)
backend.postTodoFunction.addEnvironment('POWERTOOLS_LOG_LEVEL', 'DEBUG')

const postIntegration = new HttpLambdaIntegration(
	'postIntegration',
	backend.postTodoFunction.resources.lambda,
)

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
			// CorsHttpMethod.GET,
			CorsHttpMethod.POST,
			// CorsHttpMethod.PUT,
			// CorsHttpMethod.DELETE,
		],
		allowOrigins: ['*'],
		allowHeaders: ['*'],
	},
	createDefaultStage: true,
})

httpApi.addRoutes({
	path: '/todo',
	methods: [HttpMethod.POST],
	integration: postIntegration,
	authorizer: userPoolAuthorizer,
})

const apiPolicy = new Policy(apiStack, 'ApiPolicy', {
	statements: [
		new PolicyStatement({
			actions: ['execute-api:Invoke'],
			resources: [
				`${httpApi.arnForExecuteApi('*', '/todo')}`,
				`${httpApi.arnForExecuteApi('*', '/todo/*')}`,
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
