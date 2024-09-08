import { del, get, post, put } from 'aws-amplify/api'
import { fetchAuthSession } from 'aws-amplify/auth'
import useSWR, { mutate } from 'swr'

interface Todo {
	id: string
	title: string
	content: string
}

const fetcher = async (url: string): Promise<Todo[]> => {
	const token = `Bearer ${(await fetchAuthSession()).tokens?.accessToken}`
	const restOperation = get({
		apiName: 'myHttpApi',
		path: url,
		options: {
			headers: {
				Authorization: token,
			},
		},
	})

	const { body } = await restOperation.response
	const jsonResponse: { todos?: Todo[] } = (await body.json()) as {
		todos?: Todo[]
	}

	if (jsonResponse.todos) {
		return jsonResponse.todos as Todo[]
	}

	return jsonResponse as Todo[]
}

export const useTodos = () => {
	const {
		data: todos,
		error,
		isLoading,
	} = useSWR<Todo[]>('todo', fetcher, {
		fallbackData: [],
	})

	const postTodo = async (newTodo: { title: string; content: string }) => {
		const optimisticTodo = { id: Date.now().toString(), ...newTodo }

		mutate('todo', (prevTodos = []) => [...prevTodos, optimisticTodo], false)

		try {
			const token = `Bearer ${(await fetchAuthSession()).tokens?.accessToken}`
			const restOperation = post({
				apiName: 'myHttpApi',
				path: 'todo',
				options: {
					headers: {
						Authorization: token,
					},
					body: newTodo,
				},
			})
			await restOperation.response
			mutate('todo')
		} catch (error) {
			console.error(error)
			mutate('todo', (prevTodos = []) =>
				prevTodos.filter(
					(todo: { id: string }) => todo.id !== optimisticTodo.id,
				),
			)
		}
	}

	const putTodo = async (
		id: string,
		updatedTodo: { title: string; content: string },
	) => {
		mutate(
			'todo',
			(prevTodos = []) =>
				prevTodos.map((todo: { id: string }) =>
					todo.id === id ? { ...todo, ...updatedTodo } : todo,
				),
			false,
		)

		try {
			const token = `Bearer ${(await fetchAuthSession()).tokens?.accessToken}`
			const restOperation = put({
				apiName: 'myHttpApi',
				path: `todo/${id}`,
				options: {
					headers: {
						Authorization: token,
					},
					body: updatedTodo,
				},
			})
			await restOperation.response
			mutate('todo')
		} catch (error) {
			console.error(error)
		}
	}

	const deleteTodo = async (id: string) => {
		mutate(
			'todo',
			(prevTodos = []) =>
				prevTodos.filter((todo: { id: string }) => todo.id !== id),
			false,
		)

		try {
			const token = `Bearer ${(await fetchAuthSession()).tokens?.accessToken}`
			const restOperation = del({
				apiName: 'myHttpApi',
				path: `todo/${id}`,
				options: {
					headers: {
						Authorization: token,
					},
				},
			})
			await restOperation.response
			mutate('todo')
		} catch (error) {
			console.error(error)
		}
	}

	return { todos, error, isLoading, postTodo, putTodo, deleteTodo }
}
