import outputs from '@/amplify_outputs.json'
import { Amplify } from 'aws-amplify'
import type { AppProps } from 'next/app'
import '@aws-amplify/ui-react/styles.css'
import RootLayout from '@/layout/layout'
import { Authenticator } from '@aws-amplify/ui-react'
import { CssBaseline } from '@mui/material'
import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter'

Amplify.configure(outputs, {
	ssr: true,
})
const existingConfig = Amplify.getConfig()
Amplify.configure({
	...existingConfig,
	API: {
		...existingConfig.API,
		REST: outputs.custom.API,
	},
})

export default function App({ Component, pageProps }: AppProps) {
	return (
		<Authenticator hideSignUp>
			<AppCacheProvider {...Component}>
				<CssBaseline />
				<RootLayout>
					<Component {...pageProps} />
				</RootLayout>
			</AppCacheProvider>
		</Authenticator>
	)
}
