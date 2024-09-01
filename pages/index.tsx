import { pagesPath } from '@/lib/$path'
import { runWithAmplifyServerContext } from '@/lib/amplify/server-utils'
import type { AmplifyServer } from 'aws-amplify/adapter-core'
import { fetchAuthSession } from 'aws-amplify/auth/server'
import type { GetServerSideProps } from 'next'
interface UserContext {
	authenticated: boolean
}

export default function LoginRedirectPage() {
	return <div>Redirecting...</div>
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const { authenticated } = await runWithAmplifyServerContext<UserContext>({
		nextServerContext: { request: req, response: res },
		operation: async (
			contextSpec: AmplifyServer.ContextSpec,
		): Promise<UserContext> => {
			try {
				const session = await fetchAuthSession(contextSpec, {})
				return {
					authenticated: session.tokens !== undefined,
				}
			} catch (error) {
				return {
					authenticated: false,
				}
			}
		},
	})

	if (!authenticated) {
		return { props: {} }
	}

	return {
		redirect: {
			destination: pagesPath.todos.$url().pathname,
			permanent: false,
		},
	}
}
