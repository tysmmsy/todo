import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

export const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient())
