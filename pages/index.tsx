import styles from '@/styles/Home.module.css'
import { Inter } from 'next/font/google'
import Head from 'next/head'

import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { Button } from '@mui/material'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
	return (
		<Authenticator>
			{({ signOut }) => (
				<>
					<Head>
						<title>Todo App</title>
					</Head>
					<main className={`${styles.main} ${inter.className}`}>
						<Button variant='contained' onClick={signOut}>
							サインアウト
						</Button>
					</main>
				</>
			)}
		</Authenticator>
	)
}
