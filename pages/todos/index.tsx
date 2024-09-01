import { Button } from '@mui/material'
import { signOut } from 'aws-amplify/auth'

const Todos = function Page() {
	return (
		<>
			サインイン成功
			<Button variant='contained' onClick={() => signOut()}>
				ログアウト
			</Button>
		</>
	)
}

export default Todos
