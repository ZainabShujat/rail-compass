import { initData } from './backend/utils/dataLoader.js';

async function testMemory() {
  console.log('Initial memory:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
  const start = Date.now();
  initData();
  const end = Date.now();
  console.log('After initData:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
  console.log('Time taken:', end - start, 'ms');
}

testMemory();
