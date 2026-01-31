import type { AppProps } from 'next/app'
import RootLayout from '@/layout/layout'
import { CssBaseline } from '@mui/material'
import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter'
import { ThemeModeProvider } from '@/lib/ThemeContext'

// Amplify認証を有効にするかどうか（環境変数で制御）
const ENABLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true'

// 認証が有効な場合のみAmplifyをインポート・設定
if (ENABLE_AUTH) {
	import('@aws-amplify/ui-react/styles.css')
}

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
	if (ENABLE_AUTH) {
		// 動的インポートで認証コンポーネントを読み込み
		const AuthWrapper = require('./AuthWrapper').default
		return <AuthWrapper {...props} />
	}

	return <AppContent {...props} />
}
