import { defineFunction } from '@aws-amplify/backend'

export const listTodoFunction = defineFunction({
	name: 'listTodoFn',
	entry: './handler.ts',
	memoryMB: 256,
	timeoutSeconds: 25,
})
