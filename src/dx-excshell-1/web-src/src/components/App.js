/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import actions from '../config.json';

import React, { useState, useEffect } from 'react';
import ErrorBoundary from 'react-error-boundary';
import { Provider, defaultTheme, View, Flex, ProgressCircle, Heading } from '@adobe/react-spectrum';
import PropTypes from 'prop-types';
import { MQConfigManager } from './MQConfigManager';
import '@spectrum-web-components/toast/sp-toast.js';

// error handler on UI rendering failure
function onError(e, componentStack) {}

// component to show if UI fails rendering
function fallbackComponent({ componentStack, error }) {
  return (
    <>
      <h1>Error</h1>
      <pre>{componentStack + '\n' + error.message}</pre>
    </>
  );
}

function App({ ims }) {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionString, setConnectionString] = useState('');
  const [topicName, setTopicName] = useState('');

  // Helper function to post message to the Message Queue
  const sendmessage = async (inputMessage) => {
    let operation = "sendMessage";
    let message = inputMessage;
    const res = await fetch(actions['message-queue-connector'], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gw-ims-org-id': ims.org,
        authorization: `Bearer ${ims.token}`
      },
      body: JSON.stringify({
        operation,
        message
      })
    });
  
    return await res;
  };

  const sendSampleMessage = async () => {
    let sample = 'Sample message created on: ' + (new Date().toISOString());
    console.log(sample);
    let result = await sendmessage(sample);
    if(result.status == '200') {
      showToast(true);
    }
    else {
      showToast(false);
    }
  };

  const saveConfig = async (connectorConfig) => {
    let operation = "saveConfig";
    const res = await fetch(actions['message-queue-connector'], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gw-ims-org-id': ims.org,
        authorization: `Bearer ${ims.token}`
      },
      body: JSON.stringify({    
        operation,
        connectorConfig
      })
    });
    
    console.log("Save config result: " + res.status);
    return res.status == 204;
  };

  // Helper function to fetch config from the Message Queue action
  const getConfig = async () => {
    let operation = "getConfig";
    const res = await fetch(actions['message-queue-connector'], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gw-ims-org-id': ims.org,
        authorization: `Bearer ${ims.token}`
      },
      body: JSON.stringify({
        operation
      })
    });
  
    return res.json();
  };

  const onUpdateConfig = async (connectionString, topicName) => {
    setConnectionString(connectionString);
    setTopicName(topicName);
    
    let result = await saveConfig({connectionString, topicName}); 
    if(result) {
      showToast(true);
      console.log("Config saved successfully");
    }
    else {
      showToast(false);
      console.log("Failed to save config");
    }
  };

  const showToast = async (isSuccess) => {
    let id = isSuccess ? "success-toast" : "error-toast";
    document.getElementById(id).open = "true";
  }

  // Show the loading indicator while fetching config
  useEffect(() => {
    (async () => {
      const { connectorConfig }  = await getConfig();      
      console.log("connectorConfig:  " + JSON.stringify(connectorConfig))

      let resultJson = JSON.parse(connectorConfig);
      if (resultJson && resultJson.connectionString) {
        setConnectionString(resultJson.connectionString);
        console.log("connectionString: " + resultJson.connectionString);
      }
      if (resultJson && resultJson.topicName) {
        setTopicName(resultJson.topicName);
        console.log("topicName: " + resultJson.topicName);
      }
      setIsLoading(false);
    })();
  }, []);

  return (
    <ErrorBoundary onError={onError} FallbackComponent={fallbackComponent}>    
      <Provider theme={defaultTheme} colorScheme={`light`} alignItems="center" justifyContent="center">
        <Flex direction="column" alignItems="center">
          <Heading level={1}>Configure Azure Service Bus</Heading>

          <View elementType="main" minHeight="75vh" alignItems="center">
            {isLoading ? (
              <ProgressCircle size="L" aria-label="Loading…" isIndeterminate />
            ) : (
              <>
                <View height="size-800" marginY="0" width="100vw">
                  <MQConfigManager onUpdateConfig={onUpdateConfig}
                    initialConnectionString={connectionString}
                    initialTopicName={topicName} />
                </View>
              </>
            )}
          </View>
          <Flex direction="column" alignItems="center">
            <sp-toast id="success-toast" variant="positive" timeout="2" flex-alignSelf="center" alignItems="center">
              Operation successful
            </sp-toast>
            <sp-toast id="error-toast" variant="negative" timeout="2" flex-alignSelf="center" >
              Operation failed
            </sp-toast>
          </Flex>
        </Flex>
      </Provider>
    </ErrorBoundary>
  );
}

App.propTypes = {
  ims: PropTypes.object
};

export default App;