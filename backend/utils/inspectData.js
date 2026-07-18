import { initData, trainsMap, schedulesByTrain, stationsList } from './dataLoader.js';

initData();

const firstTrainKey = Object.keys(trainsMap)[0];
const firstTrain = trainsMap[firstTrainKey];
console.log('Train Properties:', Object.keys(firstTrain));
console.log('Example Train:', firstTrain);

const firstSchedule = schedulesByTrain[firstTrainKey];
console.log('\nSchedule Properties:', firstSchedule && firstSchedule.length > 0 ? Object.keys(firstSchedule[0]) : 'None');
console.log('Example Schedule Stop:', firstSchedule && firstSchedule.length > 0 ? firstSchedule[0] : 'None');
