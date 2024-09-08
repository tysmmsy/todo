import { Box, Button, Checkbox, TextField, Typography } from '@mui/material'

interface TodoListProps {
	todos: { id: string; title: string; content: string }[]
	editedTodos: { [key: string]: { title: string; content: string } }
	handleEditChange: (
		id: string,
		field: 'title' | 'content',
		value: string,
	) => void
	handleUpdateTodo: (todo: {
		id: string
		title: string
		content: string
	}) => void
	handleDeleteTodo: (id: string) => void
}

const TodoList = ({
	todos,
	editedTodos,
	handleEditChange,
	handleUpdateTodo,
	handleDeleteTodo,
}: TodoListProps) => {
	return (
		<Box sx={{ mt: 4 }}>
			{todos.length > 0 ? (
				todos.map((todo) => (
					<Box
						key={todo.id}
						sx={{
							mb: 2,
							display: 'flex',
							alignItems: 'center',
							borderBottom: '1px solid #ddd',
							paddingBottom: '8px',
						}}
					>
						<Checkbox
							color='default'
							onChange={(e) => {
								if (e.target.checked) {
									handleDeleteTodo(todo.id)
								}
							}}
							sx={{ mr: 2 }}
						/>
						<Box sx={{ flexGrow: 1 }}>
							<TextField
								variant='standard'
								value={editedTodos[todo.id]?.title || todo.title}
								onChange={(e) =>
									handleEditChange(todo.id, 'title', e.target.value)
								}
								fullWidth
								sx={{
									mb: 1,
									fontSize: '1rem',
									'& .MuiInput-underline:before': { borderBottom: 'none' },
									'& .MuiInput-underline:after': { borderBottom: 'none' },
								}}
								placeholder='title'
							/>
							<TextField
								variant='standard'
								value={editedTodos[todo.id]?.content || todo.content}
								onChange={(e) =>
									handleEditChange(todo.id, 'content', e.target.value)
								}
								fullWidth
								multiline
								sx={{
									mb: 1,
									fontSize: '1rem',
									'& .MuiInput-underline:before': { borderBottom: 'none' },
									'& .MuiInput-underline:after': { borderBottom: 'none' },
								}}
								placeholder='Content'
							/>
						</Box>
						<Button
							variant='text'
							size='small'
							onClick={() => handleUpdateTodo(todo)}
							sx={{
								ml: 2,
								fontSize: '0.875rem',
								color: '#000',
								'&:hover': {
									backgroundColor: '#f0f0f0',
									color: '#000',
								},
							}}
						>
							Update
						</Button>
					</Box>
				))
			) : (
				<Typography>no Todos. add your first Todo!</Typography>
			)}
		</Box>
	)
}

export default TodoList
