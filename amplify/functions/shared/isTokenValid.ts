import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { logger } from './powertools/utilities'

/** CognitoのJWTトークンが有効かどうかを検証してbooleanで返す
 * https://github.com/awslabs/aws-jwt-verify?tab=readme-ov-file#Verifying-JWTs-from-Amazon-Cognito
 */
export const isTokenValid = async (
	token: string,
	userPoolId: string,
	userPoolClientId: string,
): Promise<boolean> => {
	logger.debug('token', token)
	logger.debug('userPoolId', userPoolId)
	logger.debug('userPoolClientId', userPoolClientId)
	const verifier = CognitoJwtVerifier.create({
		userPoolId: userPoolId,
		tokenUse: 'access',
		clientId: userPoolClientId,
	})

	try {
		await verifier.verify(token)
		return true
	} catch (error) {
		logger.debug('検証失敗', { error })
		return false
	}
}
