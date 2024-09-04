import { defineFunction } from '@aws-amplify/backend'

export const deleteTodoFunction = defineFunction({
	name: 'deleteTodoFn',
	entry: './handler.ts',
	memoryMB: 256,
	timeoutSeconds: 25,
})
