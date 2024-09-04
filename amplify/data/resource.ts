import { type ClientSchema, a } from '@aws-amplify/backend'

const schema = a.schema({
	/** TODOテーブル */
	Todo: a.customType({
		id: a.string().required(),
		title: a.string(),
		content: a.string().required(),
		owner: a.string().required(),
		createdAt: a.datetime().required(),
		updatedAt: a.datetime().required(),
	}),

	/** TODO登録 返却用の型 */
	ResponsePostTodo: a.customType({
		id: a.string().required(),
		title: a.string().required(),
		content: a.string().required(),
		createdAt: a.datetime().required(),
		updatedAt: a.datetime().required(),
	}),
})

export type Schema = ClientSchema<typeof schema>
