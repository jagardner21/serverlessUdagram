'use strict'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda"

const AWS = require('aws-sdk')
const uuid = require('uuid')

const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log("Processing event: ", event)
  
  const parsedBody = JSON.parse(event.body)
  const itemId = uuid.v4()

  const newItem = {
    id: itemId,
    ...parsedBody
  }

  await docClient.put({
    TableName: groupsTable,
    Item: newItem
  }).promise()

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': "*",
      'Access-Control-Allow-Methods': "OPTIONS,POST,GET",
      'Access-Control-Allow-Headers': "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
    },
    body: JSON.stringify({
      newItem
    })
  }
}