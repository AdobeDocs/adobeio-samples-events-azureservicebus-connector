/*
* <license header>
*/

/**
 * This action sends message to Azure Service Bus
 *
 * Note:
 * You might want to disable authentication and authorization checks against Adobe Identity Management System for a generic action. In that case:
 *   - Remove the require-adobe-auth annotation for this action in the manifest.yml of your application
 *   - Remove the Authorization header from the array passed in checkMissingRequestInputs
 *   - The two steps above imply that every client knowing the URL to this deployed action will be able to invoke it without any authentication and authorization checks against Adobe Identity Management System
 *   - Make sure to validate these changes against your security requirements before deploying the action
 */

const { Core } = require('@adobe/aio-sdk')
const { errorResponse } = require('../utils')
const { ServiceBusClient } = require("@azure/service-bus");
const stateLib = require('@adobe/aio-lib-state');

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  if(params.operation == "saveConfig") {
    logger.info(`Saving config ${params.connectorConfig}`)
    return saveConfig(params.connectorConfig);
  }

  if(params.operation == "getConfig") {
    logger.info(`Getting config`)
    return getConfig();
  }

  if(params.operation == "sendMessage") {
    logger.info(`Sending message ${params.message}`)
    return sendMessage(params.message);
  }

  // Since params is not defined, this must be delivered by I/O Events. Forward the message as is to the MQ.
  logger.info(`Sending message ${JSON.stringify(params)}`)
  return sendMessage(JSON.stringify(params));
}

async function sendMessage(message) {
  
  const logger = Core.Logger('sendMessage', 'info')

  const state = await stateLib.init();
  
  let connectionString = await state.get(`connectionString`);
  if (connectionString?.value) {
    connectionString = connectionString.value;
  }
  else {
    connectionString = '';
  }

  let topicName = await state.get(`topicName`);
  if (topicName?.value) {
    topicName = topicName.value;
  }
  else {
    topicName = '';
  }

  // create a Service Bus client using the connection string to the Service Bus namespace
  const sbClient = new ServiceBusClient(connectionString);
  const sender = sbClient.createSender(topicName);

  try {
    
    // Form message in the expected format
    let servicebusmessage = { body: `${message}` };

    // create a batch object
    let batch = await sender.createMessageBatch(); 

    var batchCreated = await batch.tryAddMessage(servicebusmessage);
    if (!batchCreated) {      
      logger.error("Message too big to fit in a batch")
      return errorResponse(500, 'Message too big to fit in a batch', logger)
    }

    await sender.sendMessages(batch);

    logger.info(`Sent message ${servicebusmessage} to the topic: ${topicName}`);
    await sender.close();

    return {
      statusCode: 200
    };
  }
  catch(error) {
    logger.error(error)
    return errorResponse(500, err, logger)
  }
  finally {
    await sbClient.close();
  }
}


async function saveConfig(connectorConfig) {
   
  const state = await stateLib.init();
  
  // Store the config in the state storage with no expiry time
  await state.put(`connectionString`, connectorConfig.connectionString, { ttl: -1 });
  await state.put(`topicName`, connectorConfig.topicName, { ttl: -1 });

  return {
    statusCode: 204
  };
}

async function getConfig() {

  const state = await stateLib.init();
  
  let connectionString = await state.get(`connectionString`);
  if (connectionString?.value) {
    connectionString = connectionString.value;
  }
  else {
    connectionString = '';
  }

  let topicName = await state.get(`topicName`);
  if (topicName?.value) {
    topicName = topicName.value;
  }
  else {
    topicName = '';
  }

  let body = {};
  body.connectorConfig = JSON.stringify({connectionString, topicName});

  return {
    statusCode: 200,
    body
  };
}

exports.main = main
