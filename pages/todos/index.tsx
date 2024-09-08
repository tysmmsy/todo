import { useTodos } from '@/api/useTodos'
import SearchForm from '@/features/todos/SearchForm'
import TodoForm from '@/features/todos/TodoForm'
import TodoList from '@/features/todos/TodoList'
import PageContainer from '@/layout/PageContainer'
import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

interface Todo {
	id: string
	title: string
	content: string
}

const Todos = function Page() {
	const {
		todos: initialTodos,
		error,
		isLoading,
		postTodo,
		putTodo,
		deleteTodo,
		searchTodo,
	} = useTodos()
	const [todos, setTodos] = useState<Todo[]>(initialTodos || [])

	useEffect(() => {
		if (initialTodos) {
			setTodos(initialTodos)
		}
	}, [initialTodos])

	const [editedTodos, setEditedTodos] = useState<{
		[key: string]: { title: string; content: string }
	}>({})

	const handleUpdateTodo = (todo: Todo) => {
		const updatedTodo = {
			...todo,
			title: editedTodos[todo.id]?.title || todo.title,
			content: editedTodos[todo.id]?.content || todo.content,
		}

		setTodos((prevTodos) =>
			prevTodos.map((t) => (t.id === todo.id ? updatedTodo : t)),
		)

		putTodo(todo.id, updatedTodo)

		setEditedTodos((prevState) => ({
			...prevState,
			[todo.id]: { title: '', content: '' },
		}))
	}

	const handleDeleteTodo = (id: string) => {
		setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id))
		deleteTodo(id)
	}

	const handleEditChange = (
		id: string,
		field: 'title' | 'content',
		value: string,
	) => {
		setEditedTodos((prevState) => ({
			...prevState,
			[id]: {
				...prevState[id],
				[field]: value,
			},
		}))
	}

	const handleSearch = async (
		searchField: 'title' | 'content',
		query: string,
	) => {
		const searchResults = await searchTodo(searchField, query)
		setTodos(searchResults)
	}

	const handleFetchAll = () => {
		setTodos(initialTodos || [])
	}

	if (isLoading) return <Typography>Loading...</Typography>
	if (error) return <Typography>Error: {error.message}</Typography>

	return (
		<PageContainer title='Todo'>
			<Box
				sx={{
					width: '100%',
					paddingTop: '150px',
					maxWidth: 'auto',
					margin: '0 auto',
					mb: 6,
				}}
			>
				<TodoForm postTodo={postTodo} />
			</Box>

			<Box sx={{ mb: 2 }}>
				<SearchForm onSearch={handleSearch} onFetchAll={handleFetchAll} />
			</Box>

			<Box
				sx={{
					width: '100%',
					maxWidth: 'auto',
					overflowY: 'auto',
					maxHeight: '60vh',
					mt: 4,
					margin: '0 auto',
					minWidth: todos.length === 0 ? '485px' : 'auto',
				}}
			>
				<TodoList
					todos={todos}
					editedTodos={editedTodos}
					handleEditChange={handleEditChange}
					handleUpdateTodo={handleUpdateTodo}
					handleDeleteTodo={handleDeleteTodo}
				/>
			</Box>
		</PageContainer>
	)
}

export default Todos
