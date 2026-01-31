import styled from '@emotion/styled'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { Box, Button, IconButton, Typography, useTheme } from '@mui/material'
import { fetchUserAttributes, signOut } from 'aws-amplify/auth'
import { useEffect, useState } from 'react'
import { useThemeMode } from '@/lib/ThemeContext'

const PageWrapper = styled('div')(() => ({
	display: 'flex',
	flexDirection: 'column' as const,
	flexGrow: 1,
	zIndex: 1,
	width: '100%',
	maxWidth: '100%',
	backgroundColor: 'transparent',
	alignItems: 'center',
}))

const Header = styled(Box)<{ isDark: boolean }>(({ isDark }) => ({
	display: 'flex',
	width: '100%',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: '20px',
	backgroundColor: isDark ? '#1e1e1e' : '#1976d2',
	color: '#fff',
	position: 'fixed' as const,
	top: 0,
	left: 0,
	right: 0,
	zIndex: 1000,
	transition: 'background-color 0.3s ease',
}))

export default function RootLayout({
	children,
}: { children: React.ReactNode }) {
	const [userEmail, setEmail] = useState<string>('')
	const { mode, toggleTheme } = useThemeMode()
	const theme = useTheme()
	const isDark = mode === 'dark'

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const user = await fetchUserAttributes()
				if (!user.email) {
					throw Error('クライアント情報の取得に失敗しました。')
				}
				setEmail(user.email)
			} catch (error) {
				console.error('Error fetching user:', error)
			}
		}

		fetchUser()
	}, [])

	return (
		<Box
			sx={{
				minHeight: '100vh',
				bgcolor: 'background.default',
				color: 'text.primary',
				transition: 'background-color 0.3s ease, color 0.3s ease',
			}}
		>
			<Header isDark={isDark}>
				<Box
					sx={{
						marginLeft: { xs: '20px', sm: '50px', md: '100px' },
					}}
				>
					<Typography
						variant='h1'
						sx={{ fontSize: '2rem', fontWeight: 'bold' }}
					>
						Todo App
					</Typography>
				</Box>
				<Box
					sx={{
						marginRight: { xs: '20px', sm: '30px', md: '50px' },
						display: 'flex',
						alignItems: 'center',
						gap: 1,
					}}
				>
					<Typography sx={{ mr: 1 }}>{userEmail}</Typography>
					<IconButton
						onClick={toggleTheme}
						sx={{
							color: '#fff',
							'&:hover': {
								backgroundColor: 'rgba(255, 255, 255, 0.1)',
							},
						}}
						aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
					>
						{isDark ? <LightModeIcon /> : <DarkModeIcon />}
					</IconButton>
					<Button
						variant='text'
						onClick={() => signOut()}
						sx={{
							color: '#fff',
							'&:hover': {
								color: 'rgba(255, 255, 255, 0.8)',
								backgroundColor: 'transparent',
							},
						}}
					>
						Sign Out
					</Button>
				</Box>
			</Header>
			<PageWrapper>
				<Box sx={{ pt: '80px' }}>{children}</Box>
			</PageWrapper>
		</Box>
	)
}
