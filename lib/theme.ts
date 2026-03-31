import { createTheme, type PaletteMode } from '@mui/material'

export const getTheme = (mode: PaletteMode) =>
	createTheme({
		palette: {
			mode,
			...(mode === 'light'
				? {
						// Light mode
						primary: {
							main: '#1976d2',
						},
						background: {
							default: '#f5f5f5',
							paper: '#ffffff',
						},
						text: {
							primary: '#1a1a1a',
							secondary: '#666666',
						},
					}
				: {
						// Dark mode
						primary: {
							main: '#90caf9',
						},
						background: {
							default: '#121212',
							paper: '#1e1e1e',
						},
						text: {
							primary: '#ffffff',
							secondary: '#b0b0b0',
						},
					}),
		},
		components: {
			MuiCssBaseline: {
				styleOverrides: {
					body: {
						transition: 'background-color 0.3s ease, color 0.3s ease',
					},
				},
			},
		},
	})
