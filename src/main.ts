import { info, setFailed } from '@actions/core';
import { start } from './action';

start()
  .then(() => info('Finished!1'))
  .catch(error => setFailed(error.message));
