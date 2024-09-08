import styled from '@emotion/styled'
import { Box, Button, Typography } from '@mui/material'
import { fetchUserAttributes, signOut } from 'aws-amplify/auth'
import { useEffect, useState } from 'react'

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

const Header = styled(Box)(() => ({
	display: 'flex',
	width: '100%',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: '20px',
	backgroundColor: '#000',
	color: '#fff',
	position: 'fixed' as const,
	top: 0,
	left: 0,
	right: 0,
	zIndex: 1000,
}))

export default function RootLayout({
	children,
}: { children: React.ReactNode }) {
	const [userEmail, setEmail] = useState<string>('')

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
		<>
			<Header>
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
					}}
				>
					<Typography sx={{ mr: 2 }}>{userEmail}</Typography>
					<Button
						variant='text'
						onClick={() => signOut()}
						sx={{
							color: '#fff',
							'&:hover': {
								color: '#ffffff0080c0',
								backgroundColor: 'transparent',
							},
						}}
					>
						Sign Out
					</Button>
				</Box>
			</Header>
			<PageWrapper>
				<Box>{children}</Box>
			</PageWrapper>
		</>
	)
}
