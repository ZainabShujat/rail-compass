import { initData, schedulesByTrain } from './dataLoader.js';

initData();

let hasPlatform = false;
let sampleWithPlatform = null;

for (const tNum in schedulesByTrain) {
  const schedule = schedulesByTrain[tNum];
  for (const stop of schedule) {
    if (stop.platform !== undefined || stop.pf !== undefined) {
      hasPlatform = true;
      sampleWithPlatform = stop;
      break;
    }
  }
  if (hasPlatform) break;
}

console.log('Has platform data?', hasPlatform);
if (hasPlatform) console.log('Sample:', sampleWithPlatform);
