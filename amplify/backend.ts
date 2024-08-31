import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineBackend } from '@aws-amplify/backend'
import { Duration, RemovalPolicy, Stack, aws_dynamodb } from 'aws-cdk-lib'
import {
	CorsHttpMethod,
	HttpApi,
	HttpMethod,
} from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { auth } from './auth/resource'

const backend = defineBackend({
	auth,
})

/**
 * DynamoDB
 */
const externalDataSourcesStack = backend.createStack('TodoTableStack')

const todoTable = new aws_dynamodb.Table(
	externalDataSourcesStack,
	'MyTodoTable',
	{
		partitionKey: { name: 'id', type: aws_dynamodb.AttributeType.STRING },
		billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
		removalPolicy: RemovalPolicy.DESTROY,
	},
)

/**
 * Lambda
 */
const __fileName = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__fileName)

const postTodoFn = new NodejsFunction(externalDataSourcesStack, 'postTodoFn', {
	runtime: Runtime.NODEJS_20_X,
	entry: path.join(__dirname, '../amplify/functions/todo/postTodo/handler.ts'),
	memorySize: 256,
	logRetention: RetentionDays.ONE_DAY,
	timeout: Duration.seconds(25),
	environment: {
		TODO_TABLE_NAME: todoTable.tableName,
	},
})
todoTable.grantWriteData(postTodoFn)

/**
 * API Gateway
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

const postTodoIntegration = new HttpLambdaIntegration('postTodoFn', postTodoFn)

httpApi.addRoutes({
	path: '/todo',
	methods: [HttpMethod.POST],
	integration: postTodoIntegration,
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
