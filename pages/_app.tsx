import outputs from '@/amplify_outputs.json'
import { Amplify } from 'aws-amplify'
import type { AppProps } from 'next/app'
import '@aws-amplify/ui-react/styles.css'
import { Authenticator } from '@aws-amplify/ui-react'
import { CssBaseline } from '@mui/material'
import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter'

Amplify.configure(outputs, {
	ssr: true,
})

export default function App({ Component, pageProps }: AppProps) {
	return (
		<Authenticator>
			<AppCacheProvider {...Component}>
				<CssBaseline />
				<Component {...pageProps} />
			</AppCacheProvider>
		</Authenticator>
	)
}
