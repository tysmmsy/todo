import { defineFunction } from '@aws-amplify/backend'

export const putTodoFunction = defineFunction({
	name: 'putTodoFn',
	entry: './handler.ts',
	memoryMB: 256,
	timeoutSeconds: 25,
})
