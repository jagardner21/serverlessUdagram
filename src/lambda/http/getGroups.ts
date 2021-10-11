"use strict"

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

const AWS = require("aws-sdk")

const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log("Processing event: ", event)
    
    let nextKey
    let limit
    
    try {
        nextKey = parseNextKeyParameter(event)
        limit = parseLimitParameter(event) || 20
    } catch (e){
        console.log("Failed to parse query parameters: ", e.message)
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
        body: JSON.stringify({
            error: "Invalid paramters."
        })
        }
    }
    
    const scanParams = {
        TableName: groupsTable,
        Limit: limit,
        ExclusiveStartKey: nextKey
    }
    console.log("Scan params: ", scanParams)
    
    const result = await docClient.scan(scanParams).promise()
    
    const items = result.Items
    
    console.log("Result: ", result)
    
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
            items, 
            nextKey: encodeNextKey(result.LastEvaluatedKey)
        })
    };
};

function parseNextKeyParameter(event){
    const nextKeyString = getQueryParameter(event, "nextKey")
    if(!nextKeyString){
        return undefined
    }
    
    const uriDecoded = decodeURIComponent(nextKeyString)
    return JSON.parse(uriDecoded)
}

function parseLimitParameter(event){
    const limitString = getQueryParameter(event, "limit")
    if(!limitString){
        return undefined
    }
    
    const limit = parseInt(limitString, 10)
    if(limit <= 0){
        throw new Error("Limit should be positive")
    }
    
    return limit
}

function getQueryParameter(event, name) {
  const queryParams = event.queryStringParameters
  if (!queryParams) {
    return undefined
  }

  return queryParams[name]
}

function encodeNextKey(lastEvaluatedKey) {
  if (!lastEvaluatedKey) {
    return null
  }
  
  return encodeURIComponent(JSON.stringify(lastEvaluatedKey))
}