import styled from '@emotion/styled'
import { Box, Button, Typography } from '@mui/material'
import { signOut } from 'aws-amplify/auth'

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
					}}
				>
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
