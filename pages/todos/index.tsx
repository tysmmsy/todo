import PageContainer from '@/layout/PageContainer'
import { Box, Button, Typography } from '@mui/material'
import { post } from 'aws-amplify/api'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'

const postTodo = async () => {
	try {
		const restOperation = post({
			apiName: 'myHttpApi',
			path: 'todo',
			options: {
				headers: {
					Authorization: `Bearer ${(await fetchAuthSession()).tokens?.accessToken}`,
				},
				body: {
					// TODO: UIから入力できるようにする
					title: '',
					content: 'test',
				},
			},
		})

		const { body } = await restOperation.response
		const response = await body.json()

		console.log('post call succeeded', response)
	} catch (error) {
		// TODO: コンポーネント化するときにエラーを表示するように
		console.log(error)
	}
}

const Todos = function Page() {
	return (
		<PageContainer title='todo'>
			<Box alignItems='center'>
				<Typography variant='h6'>サインイン成功</Typography>
				<Button variant='contained' onClick={() => signOut()} sx={{ mt: 2 }}>
					ログアウト
				</Button>
				<Button variant='contained' onClick={postTodo} sx={{ mt: 2 }}>
					追加
				</Button>
			</Box>
		</PageContainer>
	)
}

export default Todos
