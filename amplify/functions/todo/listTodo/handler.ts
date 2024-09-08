import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import httpHeaderNormalizer from '@middy/http-header-normalizer'
import { to } from 'await-to-js'
import type {
	APIGatewayProxyEventV2WithJWTAuthorizer,
	APIGatewayProxyHandlerV2WithJWTAuthorizer,
	APIGatewayProxyResultV2,
} from 'aws-lambda'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import createError from 'http-errors'
import type { Schema } from '../../../data/resource'
import { ddbDocClient } from '../../shared/aws-sdk-client/ddbDocClient'
import { isTokenValid } from '../../shared/isTokenValid'
import { logger } from '../../shared/powertools/utilities'

dayjs.extend(utc)
dayjs.extend(timezone)

type ResponseListTodo = Schema['ResponseListTodo']['type']

const lambdaHandler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
	event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
	if (
		!process.env.TODO_TABLE_NAME ||
		!process.env.COGNITO_USER_POOL_ID ||
		!process.env.COGNITO_USER_POOL_CLIENT_ID
	) {
		logger.error('必要な環境変数が設定されていません。')
		throw createError.InternalServerError(
			'必要な環境変数が設定されていません。',
		)
	}

	const token = event.headers.authorization?.split(' ')[1]
	if (!token) {
		throw new createError.Forbidden()
	}

	if (!(await isTokenValid(token))) {
		throw new createError.Forbidden()
	}

	// NOTE: ページネーションの考慮が必要
	const command = new QueryCommand({
		TableName: process.env.TODO_TABLE_NAME,
		IndexName: 'gsi-OwnerTodo',
		KeyConditionExpression: '#owner = :owner',
		ExpressionAttributeNames: {
			'#owner': 'owner',
		},
		ExpressionAttributeValues: {
			':owner': `${event.requestContext.authorizer.jwt.claims.sub}::${event.requestContext.authorizer.jwt.claims.username}`,
		},
	})

	const [error, result] = await to(ddbDocClient.send(command))
	if (error) {
		logger.error('DynamoDB処理中に内部エラーが発生しました。', { error })
		throw new createError.InternalServerError(
			'DynamoDB処理中に内部エラーが発生しました。',
		)
	}

	const resultItems = result?.Items || []
	const response: ResponseListTodo = {
		todos: resultItems.map((item) => ({
			id: item.id,
			title: item.title,
			content: item.content,
		})),
	}

	return {
		statusCode: 200,
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify(response),
	}
}

export const handler = middy(lambdaHandler)
	.use(
		injectLambdaContext(logger, {
			logEvent: true,
		}),
	)
	.use(httpHeaderNormalizer())
	.use(
		httpErrorHandler({
			logger: (error) => {
				const { statusCode } = error
				if (typeof statusCode === 'number' && statusCode < 500) {
					logger.warn(error?.message ?? 'エラーが発生しました', {
						error,
						statusCode,
					})
					return
				}
				logger.error(error?.message ?? 'エラーが発生しました', {
					error,
					statusCode,
				})
			},
		}),
	)
