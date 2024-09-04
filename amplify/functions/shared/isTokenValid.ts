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
	const verifier = CognitoJwtVerifier.create({
		userPoolId: userPoolId,
		tokenUse: 'access',
		clientId: userPoolClientId,
	})

	try {
		await verifier.verify(token)
		return true
	} catch (error) {
		logger.debug('検証処理に失敗しました。', { error })
		return false
	}
}
