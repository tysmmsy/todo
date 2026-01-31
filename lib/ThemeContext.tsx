'use client'

import { type PaletteMode, ThemeProvider } from '@mui/material'
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'
import { getTheme } from './theme'

interface ThemeContextType {
	mode: PaletteMode
	toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useThemeMode() {
	const context = useContext(ThemeContext)
	if (!context) {
		throw new Error('useThemeMode must be used within a ThemeModeProvider')
	}
	return context
}

interface ThemeModeProviderProps {
	children: ReactNode
}

export function ThemeModeProvider({ children }: ThemeModeProviderProps) {
	const [mode, setMode] = useState<PaletteMode>('light')

	useEffect(() => {
		const savedMode = localStorage.getItem('theme-mode') as PaletteMode | null
		if (savedMode) {
			setMode(savedMode)
		} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			setMode('dark')
		}
	}, [])

	const toggleTheme = () => {
		setMode((prevMode) => {
			const newMode = prevMode === 'light' ? 'dark' : 'light'
			localStorage.setItem('theme-mode', newMode)
			return newMode
		})
	}

	const theme = useMemo(() => getTheme(mode), [mode])

	const contextValue = useMemo(() => ({ mode, toggleTheme }), [mode])

	return (
		<ThemeContext.Provider value={contextValue}>
			<ThemeProvider theme={theme}>{children}</ThemeProvider>
		</ThemeContext.Provider>
	)
}
