import {
	DocumentHeadTags,
	type DocumentHeadTagsProps,
	documentGetInitialProps,
} from '@mui/material-nextjs/v13-pagesRouter'
import {
	type DocumentContext,
	Head,
	Html,
	Main,
	NextScript,
} from 'next/document'

export default function Document(props: DocumentHeadTagsProps) {
	return (
		<Html lang='ja'>
			<Head />
			<DocumentHeadTags {...props} />
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	)
}

Document.getInitialProps = async (ctx: DocumentContext) => {
	const finalProps = await documentGetInitialProps(ctx)
	return finalProps
}
