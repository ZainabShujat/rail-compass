import {
  stationsList,
  stationsMap,
  trainsMap,
  schedulesByTrain,
  stationToTrains,
  getStationCodes
} from '../utils/dataLoader.js';
import { rankTrains } from '../utils/smartScore.js';

// Helper to convert time string "HH:MM:SS" to minutes
const timeToMins = (timeStr) => {
  if (!timeStr || timeStr === 'None') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h * 60) + m;
};

// Calculate total duration in minutes
const calculateDurationMins = (startDay, startTime, endDay, endTime) => {
  const sDay = startDay || 1;
  const eDay = endDay || 1;
  const sTime = timeToMins(startTime);
  const eTime = timeToMins(endTime);

  let totalMins = (eDay - sDay) * 24 * 60;
  totalMins += (eTime - sTime);
  
  return totalMins > 0 ? totalMins : 0;
};

// Calculate daytime hours (08:00 to 20:00) consumed
const calculateDaytimeHours = (startDay, startTime, endDay, endTime) => {
  const sDay = startDay || 1;
  const eDay = endDay || 1;
  const sTimeHour = timeToMins(startTime) / 60;
  const eTimeHour = timeToMins(endTime) / 60;

  const dep = ((sDay - 1) * 24) + sTimeHour;
  const arr = ((eDay - 1) * 24) + eTimeHour;

  let daytimeHours = 0;
  // Check overlapping with every possible day
  for (let d = 0; d <= Math.max(sDay, eDay) + 1; d++) {
    const startDayTime = (d * 24) + 8; // 8 AM
    const endDayTime = (d * 24) + 20; // 8 PM
    
    const overlapStart = Math.max(dep, startDayTime);
    const overlapEnd = Math.min(arr, endDayTime);
    
    if (overlapStart < overlapEnd) {
      daytimeHours += (overlapEnd - overlapStart);
    }
  }
  return daytimeHours;
};

const formatDuration = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const getDummyPrices = (durMins, trainType, trainDetails) => {
  let prices = {};
  
  // Approximate distance based on duration (assuming 65 km/h average speed)
  const avgSpeed = 65;
  const approxDistance = Math.max(50, (durMins / 60) * avgSpeed);

  // Define which classes exist on this train
  const availableClasses = [];
  if (trainDetails) {
    if (Number(trainDetails.sleeper) > 0) availableClasses.push('SL');
    if (Number(trainDetails.third_ac) > 0) availableClasses.push('3AC');
    if (Number(trainDetails.second_ac) > 0) availableClasses.push('2AC');
    if (Number(trainDetails.first_ac) > 0) availableClasses.push('1AC');
    if (Number(trainDetails.chair_car) > 0) availableClasses.push('CC');
    // Datasets sometimes mix EC, CC in the classes string
    if (trainDetails.classes && trainDetails.classes.includes('EC')) availableClasses.push('EC');
    if (trainDetails.classes && trainDetails.classes.includes('CC') && !availableClasses.includes('CC')) availableClasses.push('CC');
  } else {
    // Fallback
    availableClasses.push('SL', '3AC', '2AC');
  }

  // Approximate IRCTC per-km base rates
  const baseRate = { 'SL': 0.65, '3AC': 1.65, '2AC': 2.45, '1AC': 3.60, 'CC': 1.45, 'EC': 2.90 };
  const resCharge = { 'SL': 20, '3AC': 40, '2AC': 50, '1AC': 60, 'CC': 40, 'EC': 60 };
  const sfCharge = { 'SL': 30, '3AC': 45, '2AC': 45, '1AC': 75, 'CC': 45, 'EC': 75 };
  
  // Premium trains have higher base multipliers and mandatory catering in some classes
  const isPremium = ['Rajdhani', 'Shatabdi', 'Vande Bharat', 'Tejas'].includes(trainType);
  const isSuperfast = isPremium || trainType === 'Superfast';
  const premiumMultiplier = isPremium ? 1.35 : 1.0;
  
  // Approximate catering (optional in real life, but often bundled in premium)
  const cateringCharge = { 'SL': 0, '3AC': 150, '2AC': 150, '1AC': 250, 'CC': 150, 'EC': 250 };

  for (let cls of availableClasses) {
    if (!baseRate[cls]) continue;
    let fare = approxDistance * baseRate[cls] * premiumMultiplier;
    fare += resCharge[cls];
    if (isSuperfast) fare += sfCharge[cls];
    if (isPremium) fare += cateringCharge[cls];
    
    // 5% GST on AC Classes
    if (cls !== 'SL') {
      fare = fare * 1.05;
    }
    
    // Round to nearest 5 rupees
    prices[cls] = Math.ceil(fare / 5) * 5;
    
    // Minimum fare caps
    if (cls === 'SL' && prices[cls] < 120) prices[cls] = 120;
    if (cls === '3AC' && prices[cls] < 450) prices[cls] = 450;
    if (cls === '2AC' && prices[cls] < 700) prices[cls] = 700;
    if (cls === '1AC' && prices[cls] < 1200) prices[cls] = 1200;
    if (cls === 'CC' && prices[cls] < 350) prices[cls] = 350;
    if (cls === 'EC' && prices[cls] < 700) prices[cls] = 700;
  }

  return prices;
};

export const getTrains = async (req, res) => {
  try {
    const { origin, destination, date, preferredClass } = req.query;
    
    const originCodes = getStationCodes(origin);
    const destCodes = getStationCodes(destination);

    if (originCodes.length === 0 || destCodes.length === 0) {
      return res.json([]);
    }

    // Create a unique set of train numbers that pass through at least one origin code
    const candidateTrains = new Set();
    for (const oCode of originCodes) {
      const trains = stationToTrains[oCode];
      if (trains) {
        for (const t of trains) {
          candidateTrains.add(t);
        }
      }
    }

    let results = [];

    // Iterate through the candidates and check for valid pairings
    for (const tNum of candidateTrains) {
      const schedule = schedulesByTrain[tNum];
      if (!schedule) continue;

      // Find all indices of origin and destination codes for this train
      const oIndices = [];
      const dIndices = [];
      
      schedule.forEach((s, idx) => {
        if (originCodes.includes(s.station_code)) oIndices.push({ idx, code: s.station_code });
        if (destCodes.includes(s.station_code)) dIndices.push({ idx, code: s.station_code });
      });

      if (oIndices.length === 0 || dIndices.length === 0) continue;

      // Find a valid pair where origin comes before destination
      let bestPair = null;
      for (const o of oIndices) {
        for (const d of dIndices) {
          if (o.idx < d.idx) {
            if (!bestPair || (d.idx - o.idx < bestPair.d.idx - bestPair.o.idx)) {
              // Pick the one with shortest path between nodes if a train hits multiple stations in the city
              bestPair = { o, d };
            }
          }
        }
      }

      if (bestPair) {
        const oStop = schedule[bestPair.o.idx];
        const dStop = schedule[bestPair.d.idx];
        const actualOriginCode = bestPair.o.code;
        const actualDestCode = bestPair.d.code;
        const trainDetails = trainsMap[tNum];

        // Some stops have 'None' for departure if they are terminating, etc.
        const depTime = oStop.departure !== 'None' ? oStop.departure : oStop.arrival;
        const arrTime = dStop.arrival !== 'None' ? dStop.arrival : dStop.departure;

        if (!depTime || !arrTime || depTime === 'None' || arrTime === 'None') continue;

        const durMins = calculateDurationMins(oStop.day, depTime, dStop.day, arrTime);
        const daytime = calculateDaytimeHours(oStop.day, depTime, dStop.day, arrTime);

        // Determine type based on name or fallback
        let trainType = trainDetails?.type || 'Express';
        if (trainDetails?.name) {
          const tname = trainDetails.name.toLowerCase();
          if (tname.includes('vande bharat')) trainType = 'Vande Bharat';
          else if (tname.includes('rajdhani')) trainType = 'Rajdhani';
          else if (tname.includes('shatabdi')) trainType = 'Shatabdi';
          else if (tname.includes('tejas')) trainType = 'Tejas';
          else if (tname.includes('sf') || tname.includes('superfast')) trainType = 'Superfast';
          else if (tname.includes('mail')) trainType = 'Mail';
        }

        results.push({
          _id: tNum,
          trainNumber: tNum,
          trainName: trainDetails?.name || oStop.train_name,
          departureStation: stationsMap[actualOriginCode]?.name || actualOriginCode,
          arrivalStation: stationsMap[actualDestCode]?.name || actualDestCode,
          departureTime: depTime.substring(0, 5), // "12:30"
          arrivalTime: arrTime.substring(0, 5),
          durMins,
          daytime,
          duration: formatDuration(durMins),
          type: trainType,
          prices: getDummyPrices(durMins, trainType, trainDetails),
          availableSeats: Math.floor(Math.random() * 200) + 10,
          isDedicatedRoute: (bestPair.o.idx === 0 && bestPair.d.idx === schedule.length - 1)
        });
      }
    }

    // Rank the results
    const rankedTrains = rankTrains(results, req.query, preferredClass);

    res.json(rankedTrains);
  } catch (error) {
    console.error("Error fetching trains:", error);
    res.status(500).json({ message: 'Server error fetching trains' });
  }
};

export const getTrainById = async (req, res) => {
  try {
    const tNum = req.params.id;
    let train = trainsMap[tNum];
    const schedule = schedulesByTrain[tNum];
    
    if (!train) {
      if (schedule && schedule.length > 0) {
        train = {
          number: tNum,
          name: schedule[0].train_name || 'Unknown Train',
          type: 'Express',
          zone: 'Unknown',
          first_ac: 0,
          second_ac: 1,
          third_ac: 1,
          sleeper: 1,
          chair_car: 0,
          first_class: 0,
          duration_h: 0,
          duration_m: 0,
          distance: 0
        };
      } else {
        return res.status(404).json({ message: 'Train not found' });
      }
    }
    res.json({ ...train, schedule });
  } catch (error) {
    console.error("Error fetching train by id:", error);
    res.status(500).json({ message: 'Server error fetching train' });
  }
};
