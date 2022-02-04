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

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Flex, Form, TextField, Button } from '@adobe/react-spectrum';
import { _ } from 'core-js';

function MQConfigManager({ onUpdateConfig, initialConnectionString, initialTopicName }) {
  const [connectionString, setConnectionString] = useState(initialConnectionString);
  const [topicName, setTopicName] = useState(initialTopicName);

  return (
    <Form
      onSubmit={async (event) => {
        event.preventDefault();

        onUpdateConfig && (await onUpdateConfig(connectionString, topicName));
      }}>
      <Flex alignItems="center" direction="column" justifyContent="center" gap="size-100">
        <TextField
          value={connectionString}
          onChange={(value) => {
            setConnectionString(value);
          }}
          label="Connection String"
          placeholder="Connection String"
          minWidth="size-5000"
        />
        <TextField
          value={topicName}
          onChange={(value) => {
            setTopicName(value);
          }}
          label="Topic Name"
          excludeFromTabOrder="label"
          placeholder="Topic Name"
          minWidth="size-5000"
        />
        <Button type="submit" variant="cta" marginTop="size-200" >
          Save Configuration
        </Button>
      </Flex>
    </Form>
  );
}

MQConfigManager.propTypes = {
  onUpdateConfig: PropTypes.func
};

export { MQConfigManager };