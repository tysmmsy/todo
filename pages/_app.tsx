'use client'

import type { AppProps } from 'next/app'
import { CssBaseline } from '@mui/material'
import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter'
import { ThemeModeProvider } from '@/lib/ThemeContext'
import RootLayout from '@/layout/layout'
import { useEffect, useState, ReactNode } from 'react'

const ENABLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true'

function AuthWrapper({ children }: { children: ReactNode }) {
	const [isReady, setIsReady] = useState(false)
	const [AuthenticatorComponent, setAuthenticatorComponent] = useState<React.ComponentType<{ hideSignUp: boolean; children: ReactNode }> | null>(null)

	useEffect(() => {
		const initAmplify = async () => {
			try {
				// Fetch config from public folder to avoid webpack resolution
				const configResponse = await fetch('/amplify_outputs.json')
				const outputs = await configResponse.json()

				const [
					{ Amplify },
					{ Authenticator },
				] = await Promise.all([
					import('aws-amplify'),
					import('@aws-amplify/ui-react'),
				])

				await import('@aws-amplify/ui-react/styles.css')

				Amplify.configure(outputs, { ssr: true })
				const existingConfig = Amplify.getConfig()
				Amplify.configure({
					...existingConfig,
					API: {
						...existingConfig.API,
						REST: outputs.custom?.API,
					},
				})

				setAuthenticatorComponent(() => Authenticator)
				setIsReady(true)
			} catch (error) {
				console.error('Failed to initialize Amplify:', error)
				setIsReady(true)
			}
		}

		initAmplify()
	}, [])

	if (!isReady) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
				Loading...
			</div>
		)
	}

	if (AuthenticatorComponent) {
		return (
			<AuthenticatorComponent hideSignUp>
				{children}
			</AuthenticatorComponent>
		)
	}

	return <>{children}</>
}

export default function App({ Component, pageProps }: AppProps) {
	const content = (
		<AppCacheProvider {...Component}>
			<ThemeModeProvider>
				<CssBaseline />
				<RootLayout>
					<Component {...pageProps} />
				</RootLayout>
			</ThemeModeProvider>
		</AppCacheProvider>
	)

	if (ENABLE_AUTH) {
		return <AuthWrapper>{content}</AuthWrapper>
	}

	return content
}
