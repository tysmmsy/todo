import PageContainer from '@/layout/PageContainer'
import { Box, Button, Typography } from '@mui/material'
import { del, get, post, put } from 'aws-amplify/api'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'

const listTodo = async () => {
	try {
		const restOperation = get({
			apiName: 'myHttpApi',
			path: 'todo',
			options: {
				headers: {
					Authorization: `Bearer ${(await fetchAuthSession()).tokens?.accessToken}`,
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

const putTodo = async () => {
	try {
		const restOperation = put({
			apiName: 'myHttpApi',
			// 動作確認用
			path: 'todo/01J6YBY13N6FM5KZPM9E39CE10',
			options: {
				headers: {
					Authorization: `Bearer ${(await fetchAuthSession()).tokens?.accessToken}`,
				},
				body: {
					// TODO: UIから入力できるようにする
					title: 'test update title',
					content: 'test update content'.repeat(1000),
				},
			},
		})

		const { body } = await restOperation.response
		const response = await body.json()

		console.log('put call succeeded', response)
	} catch (error) {
		// TODO: コンポーネント化するときにエラーを表示するように
		console.log(error)
	}
}

const deleteTodo = async () => {
	try {
		const restOperation = del({
			apiName: 'myHttpApi',
			// 動作確認用
			path: 'todo/01J6YBY13N6FM5KZPM9E39CE10',
			options: {
				headers: {
					Authorization: `Bearer ${(await fetchAuthSession()).tokens?.accessToken}`,
				},
			},
		})

		const response = await restOperation.response

		console.log('del call succeeded', response)
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
				<Button variant='contained' onClick={listTodo} sx={{ mt: 2 }}>
					取得(リスト)
				</Button>
				<Button variant='contained' onClick={postTodo} sx={{ mt: 2 }}>
					追加
				</Button>
				<Button variant='contained' onClick={putTodo} sx={{ mt: 2 }}>
					更新
				</Button>
				<Button variant='contained' onClick={deleteTodo} sx={{ mt: 2 }}>
					削除
				</Button>
			</Box>
		</PageContainer>
	)
}

export default Todos
