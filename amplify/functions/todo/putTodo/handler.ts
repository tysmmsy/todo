import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import httpHeaderNormalizer from '@middy/http-header-normalizer'
import httpJsonBodyParser from '@middy/http-json-body-parser'
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

const resultSchema = z.object({
	id: z.string(),
	title: z.string(),
	content: z.string(),
	updatedAt: z.string(),
})

type ResponsePutTodo = Schema['ResponsePutTodo']['type']

export const lambdaHandler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (
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

	const parsedInput = inputSchema.safeParse(event.body)
	if (!parsedInput.success) {
		const errors = parsedInput.error.issues
			.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
			.join(', ')
		throw new createError.BadRequest(
			`リクエスト形式が想定と異なります。 ${errors}`,
		)
	}

	const { title, content } = parsedInput.data

	const command = new UpdateCommand({
		TableName: process.env.TODO_TABLE_NAME,
		Key: { id },
		UpdateExpression:
			'SET title = :title, content = :content, updatedAt = :updatedAt',
		ExpressionAttributeNames: {
			'#owner': 'owner',
		},
		ExpressionAttributeValues: {
			':title': title,
			':content': content,
			':owner': `${event.requestContext.authorizer.jwt.claims.sub}::${event.requestContext.authorizer.jwt.claims.username}`, // 現在のユーザーのID（JWTのsub）
			':updatedAt': dayjs().tz('Asia/Tokyo').format(),
		},
		ConditionExpression: 'attribute_exists(id) AND #owner = :owner',
		ReturnValues: 'ALL_NEW',
	})

	const [error, result] = await to(ddbDocClient.send(command))
	if (error) {
		if (error instanceof ConditionalCheckFailedException) {
			throw new createError.BadRequest()
		}

		logger.error('DynamoDB更新中に内部エラーが発生しました。', { error })
		throw new createError.InternalServerError(
			'DynamoDB更新中に内部エラーが発生しました。',
		)
	}

	const parsedResult = resultSchema.safeParse(result?.Attributes)
	if (!parsedResult.success) {
		logger.error(`更新結果が想定と異なります ${id}`)
		throw new createError.InternalServerError('更新結果が想定と異なります')
	}

	const response: ResponsePutTodo = {
		id: parsedResult.data.id,
		title: parsedResult.data.title,
		content: parsedResult.data.content,
		updatedAt: parsedResult.data.updatedAt,
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
			fallbackMessage: JSON.stringify({ message: 'Internal Server Error' }),
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
