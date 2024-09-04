import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { DeleteCommand } from '@aws-sdk/lib-dynamodb'
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

type ResponseDeleteTodo = Schema['ResponseDeleteTodo']['type']

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

	const id = event.pathParameters?.id
	if (!id) {
		throw new createError.BadRequest('idを指定してください。')
	}

	const token = event.headers.authorization?.split(' ')[1]
	if (!token) {
		throw new createError.Forbidden()
	}

	const isTokeValid = await isTokenValid(
		token,
		process.env.COGNITO_USER_POOL_ID,
		process.env.COGNITO_USER_POOL_CLIENT_ID,
	)
	if (!isTokeValid) {
		throw new createError.Forbidden()
	}

	const command = new DeleteCommand({
		TableName: process.env.TODO_TABLE_NAME,
		Key: {
			id,
		},
		ConditionExpression: 'attribute_exists(id) AND #owner = :owner',
		ExpressionAttributeNames: {
			'#owner': 'owner',
		},
		ExpressionAttributeValues: {
			':owner': `${event.requestContext.authorizer.jwt.claims.sub}::${event.requestContext.authorizer.jwt.claims.username}`,
		},
	})

	const [error] = await to(ddbDocClient.send(command))
	if (error) {
		if (error instanceof ConditionalCheckFailedException) {
			throw new createError.BadRequest('もう一度実行してください。')
		}

		logger.error('DynamoDB更新中に内部エラーが発生しました。', { error })
		throw new createError.InternalServerError(
			'DynamoDB更新中に内部エラーが発生しました。',
		)
	}

	const response: ResponseDeleteTodo = {
		id,
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
