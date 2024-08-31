import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
	console.log('event', event)
	return {
		statusCode: 200,
		body: JSON.stringify('invokeテスト'),
	}
}
