import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware'
import middy from '@middy/core'
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { logger } from '../../shared/powertools/utilities'

const lambdaHandler: APIGatewayProxyHandlerV2 = async () => {
	return {
		statusCode: 200,
		body: JSON.stringify('invokeテスト'),
	}
}

export const handler = middy(lambdaHandler).use(
	injectLambdaContext(logger, {
		logEvent: true,
	}),
)
