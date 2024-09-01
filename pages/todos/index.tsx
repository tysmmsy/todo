import PageContainer from '@/layout/PageContainer'
import { Box, Button, Typography } from '@mui/material'
import { signOut } from 'aws-amplify/auth'

const Todos = function Page() {
	return (
		<PageContainer title='todo'>
			<Box alignItems='center'>
				<Typography variant='h6'>サインイン成功</Typography>
				<Button variant='contained' onClick={() => signOut()} sx={{ mt: 2 }}>
					ログアウト
				</Button>
			</Box>
		</PageContainer>
	)
}

export default Todos
