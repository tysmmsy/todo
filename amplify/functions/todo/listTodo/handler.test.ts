import { QueryCommand, type QueryCommandOutput } from '@aws-sdk/lib-dynamodb'
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import mockContext from 'aws-lambda-mock-context'
import { ddbDocClient } from '../../shared/aws-sdk-client/ddbDocClient'
import { isTokenValid } from '../../shared/isTokenValid'
import { handler } from './handler'

jest.mock('../../shared/aws-sdk-client/ddbDocClient')
jest.mock('../../shared/isTokenValid')
jest.mock('../../shared/powertools/utilities')

const mockedDdbDocClient = jest.mocked(ddbDocClient, {
	shallow: false,
}) as jest.MockedObjectDeep<DynamoDBDocumentClient>
const mockedIsTokenValid = jest.mocked(isTokenValid, {
	shallow: false,
}) as jest.MockedFunction<typeof isTokenValid>

describe('ListTodo Tests', () => {
	const OLD_ENV = process.env

	beforeEach(() => {
		jest.resetAllMocks()
		process.env = { ...OLD_ENV }
	})

	afterAll(() => {
		process.env = OLD_ENV
	})

	interface ExtendedAPIGatewayProxyEventV2WithJWTAuthorizer
		extends APIGatewayProxyEventV2WithJWTAuthorizer {
		rawHeaders: Record<string, string>
	}

	const validEvent: ExtendedAPIGatewayProxyEventV2WithJWTAuthorizer = {
		rawHeaders: {},
		version: '2.0',
		routeKey: 'GET /todo',
		rawPath: '/todo',
		rawQueryString: '',
		headers: {
			authorization: 'Bearer valid.token.here',
		},
		requestContext: {
			accountId: '123456789012',
			apiId: 'api-id',
			authorizer: {
				jwt: {
					claims: {
						sub: 'user-sub',
						username: 'user-username',
					},
					scopes: [],
				},
				principalId: '',
				integrationLatency: 0,
			},
			domainName: 'id.execute-api.region.amazonaws.com',
			domainPrefix: 'id',
			http: {
				method: 'GET',
				path: '/todo',
				protocol: 'HTTP/1.1',
				sourceIp: '123.123.123.123',
				userAgent: 'Mozilla/5.0',
			},
			requestId: 'id',
			routeKey: 'GET /todo',
			stage: '$default',
			time: '12/Mar/2020:19:03:58 +0000',
			timeEpoch: 1583348638390,
		},
		body: undefined,
		isBase64Encoded: false,
	}

	it('成功時に200を返す', async () => {
		process.env.TODO_TABLE_NAME = 'TestTable'
		process.env.COGNITO_USER_POOL_ID = 'TestUserPoolId'
		process.env.COGNITO_USER_POOL_CLIENT_ID = 'TestClientId'

		mockedIsTokenValid.mockResolvedValue(true)
		const queryCommandOutput: QueryCommandOutput = {
			$metadata: {
				httpStatusCode: 200,
				requestId: 'mock-request-id',
				attempts: 1,
				totalRetryDelay: 0,
			},
			Items: [
				{ id: '1', title: 'タイトル1', content: 'コンテンツ1' },
				{ id: '2', title: 'タイトル2', content: 'コンテンツ2' },
			],
		}

		// const sendMock = jest
		// 	.fn()
		// 	.mockResolvedValue(queryCommandOutput) as jest.MockedFunction<
		// 	typeof ddbDocClient.send
		// >

		// mockedDdbDocClient.send = sendMock as unknown as jest.MockedFunction<
		// 	typeof ddbDocClient.send
		// >

		const context = mockContext()

		const response = (await handler(validEvent, context)) as {
			statusCode: number
			headers: { [key: string]: string }
			body: string
		}

		expect(response.statusCode).toBe(200)
		expect(response.headers['content-type']).toBe('application/json')

		const responseBody = JSON.parse(response.body)
		expect(responseBody).toHaveProperty('todos')
		expect(responseBody.todos).toEqual([
			{ id: '1', title: 'タイトル1', content: 'コンテンツ1' },
			{ id: '2', title: 'タイトル2', content: 'コンテンツ2' },
		])

		expect(isTokenValid).toHaveBeenCalledWith('valid.token.here')
		expect(ddbDocClient.send).toHaveBeenCalledWith(expect.any(QueryCommand))
	})
})
