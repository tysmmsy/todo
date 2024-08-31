import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import middy from '@middy/core'
import httpErrorHandler from '@middy/http-error-handler'
import { to } from 'await-to-js'
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import createError from 'http-errors'
import { ulid } from 'ulid'
import { z } from 'zod'
import type { Schema } from '../../../data/resource'
import { ddbDocClient } from '../../shared/aws-sdk-client/ddbDocClient'
import { logger } from '../../shared/powertools/utilities'

dayjs.extend(utc)
dayjs.extend(timezone)

const inputSchema = z.object({
	title: z.string(),
	content: z.string().min(1, 'コンテンツは必須です'),
})

type ResponsePostTodo = Schema['ResponsePostTodo']['type']

// TODO: Cognito認証の型を確認してから修正する
const lambdaHandler: APIGatewayProxyHandlerV2 = async (event) => {
	if (!process.env.TODO_TABLE_NAME) {
		logger.error('必要な環境変数が設定されていません。')
		throw createError.InternalServerError(
			'必要な環境変数が設定されていません。',
		)
	}

	const parsedInput = inputSchema.safeParse(event)
	if (!parsedInput.success) {
		const errors = parsedInput.error.issues
			.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
			.join(', ')
		throw createError.BadRequest(`リクエスト形式が想定と異なります: ${errors}`)
	}

	const id = ulid()
	const executionTime = dayjs().tz('Asia/Tokyo').format()

	const command = new PutCommand({
		TableName: process.env.TODO_TABLE_NAME,
		Item: {
			id,
			title: parsedInput.data.title,
			content: parsedInput.data.content,
			createdAt: executionTime,
			updatedAt: executionTime,
		},
		ConditionExpression: 'attribute_not_exists(id)',
	})

	const [error, _] = await to(ddbDocClient.send(command))
	if (error) {
		if (error instanceof ConditionalCheckFailedException) {
			throw new createError.BadRequest('もう一度実行してください。')
		}
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
