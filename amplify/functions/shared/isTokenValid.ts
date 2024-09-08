import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { logger } from './powertools/utilities'

const verifier = CognitoJwtVerifier.create({
	// NOTE: 事前に環境変数をチェックしているためlintを回避する
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	userPoolId: process.env.COGNITO_USER_POOL_ID!,
	tokenUse: 'access',
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	clientId: process.env.COGNITO_USER_POOL_CLIENT_ID!,
})

/** CognitoのJWTトークンが有効かどうかを検証してbooleanで返す
 * https://github.com/awslabs/aws-jwt-verify?tab=readme-ov-file#Verifying-JWTs-from-Amazon-Cognito
 */
export const isTokenValid = async (token: string): Promise<boolean> => {
	try {
		await verifier.verify(token)
		return true
	} catch (error) {
		logger.debug('検証処理に失敗しました。', { error })
		return false
	}
}
