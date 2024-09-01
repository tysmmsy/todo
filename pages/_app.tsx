import outputs from '@/amplify_outputs.json'
import { Amplify } from 'aws-amplify'
import type { AppProps } from 'next/app'
import '@aws-amplify/ui-react/styles.css'
import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter'

Amplify.configure(outputs)

export default function App({ Component, pageProps }: AppProps) {
	return (
		<AppCacheProvider {...pageProps}>
			<Component {...pageProps} />
		</AppCacheProvider>
	)
}
