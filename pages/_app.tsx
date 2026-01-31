import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import RootLayout from '@/layout/layout'
import { CssBaseline } from '@mui/material'
import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter'
import { ThemeModeProvider } from '@/lib/ThemeContext'

// Amplify認証を有効にするかどうか（環境変数で制御）
const ENABLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true'

// 認証が有効な場合のみAuthWrapperを動的にロード（SSRで読み込まない）
const AuthWrapper = ENABLE_AUTH
	? dynamic(() => import('./AuthWrapper'), { ssr: false })
	: null

function AppContent({ Component, pageProps }: AppProps) {
	return (
		<AppCacheProvider {...Component}>
			<ThemeModeProvider>
				<CssBaseline />
				<RootLayout>
					<Component {...pageProps} />
				</RootLayout>
			</ThemeModeProvider>
		</AppCacheProvider>
	)
}

export default function App(props: AppProps) {
	if (ENABLE_AUTH && AuthWrapper) {
		return <AuthWrapper {...props} />
	}

	return <AppContent {...props} />
}
