import Head from 'next/head'

type Props = {
	description?: string
	children: JSX.Element | JSX.Element[]
	title?: string
}

const PageContainer = ({ title, description, children }: Props) => (
	<div>
		<Head>
			<title>{title}</title>
			<meta name='description' content={description} />
		</Head>
		{children}
	</div>
)

export default PageContainer
