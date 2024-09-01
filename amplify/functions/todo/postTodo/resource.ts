import { defineFunction } from '@aws-amplify/backend'

export const postTodoFunction = defineFunction({
	name: 'postTodoFn',
	entry: './handler.ts',
	memoryMB: 256,
	timeoutSeconds: 25,
})
