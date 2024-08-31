import { defineFunction } from '@aws-amplify/backend'

export const postTodoFn = defineFunction({
	name: 'postTodoFn',
	entry: './handler.ts',
	memoryMB: 256,
	timeoutSeconds: 25,
})
