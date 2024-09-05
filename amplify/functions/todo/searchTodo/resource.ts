import { defineFunction } from '@aws-amplify/backend'

export const searchTodoFunction = defineFunction({
	name: 'searchTodoFn',
	entry: './handler.ts',
	memoryMB: 256,
	timeoutSeconds: 25,
})
