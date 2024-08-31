import { defineBackend } from '@aws-amplify/backend'
import { Stack } from 'aws-cdk-lib'
import {
	CorsHttpMethod,
	HttpApi,
	HttpMethod,
} from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { postTodoFn } from './functions/todo/postTodo/resource'

const backend = defineBackend({
	auth,
	data,
	postTodoFn,
})

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

const postTodoIntegration = new HttpLambdaIntegration(
	'postTodoFn',
	backend.postTodoFn.resources.lambda,
)

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
