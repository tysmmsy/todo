import { createServerRunner } from '@aws-amplify/adapter-nextjs'

import outputs from '@/amplify_outputs.json'

export const { runWithAmplifyServerContext } = createServerRunner({
	config: {
		Auth: {
			Cognito: {
				userPoolId: outputs.auth.user_pool_id,
				userPoolClientId: outputs.auth.user_pool_client_id,
			},
		},
	},
})
