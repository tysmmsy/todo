import { Box, Button, TextField } from '@mui/material'
import { useState } from 'react'

interface TodoFormProps {
	postTodo: (todo: { title: string; content: string }) => void
}

const TodoForm = ({ postTodo }: TodoFormProps) => {
	const [title, setTitle] = useState<string>('')
	const [content, setContent] = useState<string>('')

	const handleAddTodo = () => {
		postTodo({ title, content })
		setTitle('')
		setContent('')
	}

	return (
		<Box>
			<TextField
				label='title'
				value={title}
				variant='outlined'
				size='small'
				onChange={(e) => setTitle(e.target.value)}
				fullWidth
				sx={{
					borderRadius: '8px',
				}}
			/>
			<Box>
				<TextField
					label='content'
					value={content}
					variant='outlined'
					onChange={(e) => setContent(e.target.value)}
					fullWidth
					multiline
					rows={4}
					sx={{
						mt: 2,
						borderRadius: '8px',
					}}
				/>
			</Box>
			<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
				<Button
					variant='contained'
					size='small'
					onClick={handleAddTodo}
					sx={{
						backgroundColor: '#000',
						color: '#fff',
						'&:hover': { backgroundColor: '#333' },
						padding: '8px 16px',
					}}
				>
					add
				</Button>
			</Box>
		</Box>
	)
}

export default TodoForm
