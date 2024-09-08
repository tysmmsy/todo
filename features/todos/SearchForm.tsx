import { Box, Button, MenuItem, TextField } from '@mui/material'
import { useState } from 'react'

interface SearchFormProps {
	onSearch: (searchField: 'title' | 'content', query: string) => void
	onFetchAll: () => void
}

const SearchForm = ({ onSearch, onFetchAll }: SearchFormProps) => {
	const [searchField, setSearchField] = useState<'title' | 'content'>('content')
	const [query, setQuery] = useState<string>('')

	const handleSearch = () => {
		if (query.trim() === '') {
			onFetchAll()
		} else {
			onSearch(searchField, query)
		}
	}

	return (
		<Box
			sx={{
				display: 'flex',
				gap: 2,
				justifyContent: 'center',
				width: '100%',
				maxWidth: '800px',
				margin: '0 auto',
			}}
		>
			<TextField
				select
				label='search target'
				value={searchField}
				onChange={(e) => setSearchField(e.target.value as 'title' | 'content')}
				size='small'
				sx={{ width: '130px', height: '40px' }}
			>
				<MenuItem value='content'>content</MenuItem>
				<MenuItem value='title'>title</MenuItem>
			</TextField>
			<TextField
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				size='small'
				sx={{ flexGrow: 1, height: '40px' }}
			/>
			<Button
				variant='contained'
				size='small'
				onClick={handleSearch}
				sx={{
					backgroundColor: '#000',
					color: '#fff',
					'&:hover': { backgroundColor: '#333' },
					padding: '4px 8px',
					height: '40px',
				}}
			>
				Search
			</Button>
		</Box>
	)
}

export default SearchForm
