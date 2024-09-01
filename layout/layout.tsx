import styled from '@emotion/styled'
import { Box } from '@mui/material'

const MainWrapper = styled('div')(() => ({
	display: 'flex',
	minHeight: '100vh',
	width: '100%',
}))

const PageWrapper = styled('div')(() => ({
	display: 'flex',
	flexGrow: 1,
	padding: '60px',
	zIndex: 1,
	width: '100%',
	backgroundColor: 'transparent',
}))

export default function RootLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<MainWrapper>
			<PageWrapper>
				<Box>{children}</Box>
			</PageWrapper>
		</MainWrapper>
	)
}
