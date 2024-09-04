import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import httpHeaderNormalizer from '@middy/http-header-normalizer'
import httpJsonBodyParser from '@middy/http-json-body-parser'
import { to } from 'await-to-js'
import type {
	APIGatewayProxyEventV2WithJWTAuthorizer,
	APIGatewayProxyHandlerV2WithJWTAuthorizer,
	APIGatewayProxyResult,
} from 'aws-lambda'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import createError from 'http-errors'
import { ulid } from 'ulid'
import { z } from 'zod'
import type { Schema } from '../../../data/resource'
import { ddbDocClient } from '../../shared/aws-sdk-client/ddbDocClient'
import { isTokenValid } from '../../shared/isTokenValid'
import { logger } from '../../shared/powertools/utilities'

dayjs.extend(utc)
dayjs.extend(timezone)

const inputSchema = z.object({
	title: z.string(),
	content: z
		.string()
		.min(1, { message: 'コンテンツは必須です' })
		.max(100, { message: 'コンテンツの条件は100文字です' }),
})

type ResponsePostTodo = Schema['ResponsePostTodo']['type']

const lambdaHandler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
	event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResult> => {
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

	const isTokeValid = await isTokenValid(
		token,
		process.env.COGNITO_USER_POOL_ID,
		process.env.COGNITO_USER_POOL_CLIENT_ID,
	)
	if (!isTokeValid) {
		throw new createError.Forbidden()
	}

	const parsedInput = inputSchema.safeParse(event.body)
	if (!parsedInput.success) {
		const errors = parsedInput.error.issues
			.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
			.join(', ')
		throw createError.BadRequest(`リクエスト形式が想定と異なります。 ${errors}`)
	}

	const id = ulid()
	const executionTime = dayjs().tz('Asia/Tokyo').format()

	const command = new PutCommand({
		TableName: process.env.TODO_TABLE_NAME,
		Item: {
			id,
			title: parsedInput.data.title,
			content: parsedInput.data.content,
			owner: `${event.requestContext.authorizer.jwt.claims.sub}::${event.requestContext.authorizer.jwt.claims.username}`,
			createdAt: executionTime,
			updatedAt: executionTime,
		},
		ConditionExpression: 'attribute_not_exists(id)',
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

	const response: ResponsePostTodo = {
		id,
		title: parsedInput.data.title,
		content: parsedInput.data.content,
		createdAt: executionTime,
		updatedAt: executionTime,
	}

	return {
		statusCode: 200,
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
	.use(httpJsonBodyParser())
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
