import { defineBackend } from '@aws-amplify/backend'
import { Stack } from 'aws-cdk-lib'
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2'
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { auth } from './auth/resource'
import { data } from './data/resource'

const backend = defineBackend({
	auth,
	data,
})

const apiStack = backend.createStack('api-stack')

const httpApi = new HttpApi(apiStack, 'HttpApi', {
	apiName: 'myHttpApi',
	corsPreflight: {
		allowMethods: [
			// CorsHttpMethod.GET,
			// CorsHttpMethod.POST,
			// CorsHttpMethod.PUT,
			// CorsHttpMethod.DELETE,
		],
		allowOrigins: ['*'],
		allowHeaders: ['*'],
	},
	createDefaultStage: true,
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
