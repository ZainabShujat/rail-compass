import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory indices
export let stationsList = [];
export let stationsMap = {}; // code -> { code, name }
export let trainsMap = {}; // train_number -> train details
export let schedulesByTrain = {}; // train_number -> ordered array of stops
export let stationToTrains = {}; // station_code -> Set of train_numbers

let isLoaded = false;

export const initData = () => {
  if (isLoaded) return;
  console.log('⏳ Loading Railway Data into Memory... This might take a few seconds.');
  try {
    // 1. Load Stations
    const stationsPath = path.join(process.cwd(), 'backend', 'data', 'stations.json');
    const stationsData = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
    stationsData.features.forEach(f => {
      const props = f.properties;
      if (props.code) {
        const station = { code: props.code, name: props.name };
        stationsList.push(station);
        stationsMap[props.code.toLowerCase()] = station;
        stationsMap[props.name.toLowerCase()] = station;
      }
    });
    console.log(`✅ Loaded ${stationsList.length} stations.`);

    // 2. Load Trains
    const trainsPath = path.join(process.cwd(), 'backend', 'data', 'trains.json.gz');
    const trainsData = JSON.parse(zlib.gunzipSync(fs.readFileSync(trainsPath)).toString('utf8'));
    trainsData.features.forEach(f => {
      const props = f.properties;
      if (props.number) {
        trainsMap[props.number] = props;
      }
    });
    console.log(`✅ Loaded ${Object.keys(trainsMap).length} trains.`);

    // 3. Load Schedules
    const schedulesPath = path.join(process.cwd(), 'backend', 'data', 'schedules.json.gz');
    const schedulesData = JSON.parse(zlib.gunzipSync(fs.readFileSync(schedulesPath)).toString('utf8'));
    
    // Group schedules by train number
    schedulesData.forEach(stop => {
      const tNum = stop.train_number;
      const sCode = stop.station_code;
      
      if (!schedulesByTrain[tNum]) {
        schedulesByTrain[tNum] = [];
      }
      schedulesByTrain[tNum].push(stop);

      if (!stationToTrains[sCode]) {
        stationToTrains[sCode] = new Set();
      }
      stationToTrains[sCode].add(tNum);
    });

    // Sort the schedules for each train chronologically
    // If 'day' and 'arrival' are available, we sort by day, then arrival/departure time
    Object.keys(schedulesByTrain).forEach(tNum => {
      schedulesByTrain[tNum].sort((a, b) => {
        if (a.day !== b.day) return (a.day || 1) - (b.day || 1);
        const timeA = a.departure !== 'None' ? a.departure : a.arrival;
        const timeB = b.departure !== 'None' ? b.departure : b.arrival;
        if (!timeA && !timeB) return 0;
        if (!timeA) return -1;
        if (!timeB) return 1;
        return timeA.localeCompare(timeB);
      });
    });

    console.log(`✅ Loaded schedules and built indices.`);

    // --- PATCH KAGGLE DATA FOR LUCKNOW - NEW DELHI AC EXPRESS ---
    // Protect existing 12429/12430 (Bangalore Rajdhani) by shifting them to 22691/22692
    if (trainsMap['12429']) {
      const t = trainsMap['12429'];
      t.number = '22691';
      trainsMap['22691'] = t;
      delete trainsMap['12429'];
      const s = schedulesByTrain['12429'];
      if (s) {
        schedulesByTrain['22691'] = s;
        delete schedulesByTrain['12429'];
        for (const code in stationToTrains) {
          if (stationToTrains[code].has('12429')) {
            stationToTrains[code].delete('12429');
            stationToTrains[code].add('22691');
          }
        }
      }
    }
    if (trainsMap['12430']) {
      const t = trainsMap['12430'];
      t.number = '22692';
      trainsMap['22692'] = t;
      delete trainsMap['12430'];
      const s = schedulesByTrain['12430'];
      if (s) {
        schedulesByTrain['22692'] = s;
        delete schedulesByTrain['12430'];
        for (const code in stationToTrains) {
          if (stationToTrains[code].has('12430')) {
            stationToTrains[code].delete('12430');
            stationToTrains[code].add('22692');
          }
        }
      }
    }

    // Now remap 12234 to 12430 (NDLS -> LKO)
    if (trainsMap['12234']) {
      const t = trainsMap['12234'];
      t.name = "New Delhi - Lucknow AC SF Express";
      t.number = "12430";
      t.from_station_code = "NDLS";
      t.from_station_name = "NEW DELHI";
      t.departure = "23:25:00";
      t.arrival = "07:30:00";
      t.type = "SF";
      
      delete trainsMap['12234'];
      trainsMap['12430'] = t;

      if (schedulesByTrain['12234']) {
        const s = schedulesByTrain['12234'];
        const oStop = s.find(x => x.station_code === 'NDLS' || x.station_code === 'ANVT');
        if (oStop) {
          oStop.station_code = 'NDLS';
          oStop.station_name = 'NEW DELHI';
          oStop.departure = '23:25:00';
          oStop.arrival = 'None';
        }
        const dStop = s.find(x => x.station_code === 'LKO' || x.station_code === 'LJN');
        if (dStop) {
          dStop.arrival = '07:30:00';
          dStop.departure = 'None';
        }
        s.forEach(stop => stop.train_number = '12430');
        schedulesByTrain['12430'] = s;
        delete schedulesByTrain['12234'];
        
        if (stationToTrains['NDLS']) stationToTrains['NDLS'].add('12430');
        if (stationToTrains['ANVT']) stationToTrains['ANVT'].delete('12234');
        for (const code in stationToTrains) {
          if (stationToTrains[code].has('12234')) {
            stationToTrains[code].delete('12234');
            stationToTrains[code].add('12430');
          }
        }
      }
    }

    // Remap 12233 to 12429 (LKO -> NDLS)
    if (trainsMap['12233']) {
      const t = trainsMap['12233'];
      t.name = "Lucknow - New Delhi AC SF Express";
      t.number = "12429";
      t.to_station_code = "NDLS";
      t.to_station_name = "NEW DELHI";
      t.departure = "23:30:00";
      t.arrival = "07:30:00";
      t.type = "SF";
      
      delete trainsMap['12233'];
      trainsMap['12429'] = t;

      if (schedulesByTrain['12233']) {
        const s = schedulesByTrain['12233'];
        const oStop = s.find(x => x.station_code === 'LKO' || x.station_code === 'LJN');
        if (oStop) {
          oStop.departure = '23:30:00';
          oStop.arrival = 'None';
        }
        const dStop = s.find(x => x.station_code === 'NDLS' || x.station_code === 'ANVT');
        if (dStop) {
          dStop.station_code = 'NDLS';
          dStop.station_name = 'NEW DELHI';
          dStop.arrival = '07:30:00';
          dStop.departure = 'None';
        }
        s.forEach(stop => stop.train_number = '12429');
        schedulesByTrain['12429'] = s;
        delete schedulesByTrain['12233'];
        
        if (stationToTrains['NDLS']) stationToTrains['NDLS'].add('12429');
        if (stationToTrains['ANVT']) stationToTrains['ANVT'].delete('12233');

        for (const code in stationToTrains) {
          if (stationToTrains[code].has('12233')) {
            stationToTrains[code].delete('12233');
            stationToTrains[code].add('12429');
          }
        }
      }
    }

    isLoaded = true;
  } catch (err) {
    console.error('❌ Error loading data. Ensure stations.json, trains.json, and schedules.json are in backend/data/', err.message);
  }
};

// City to multiple station mappings
export const CITY_STATIONS = {
  'delhi': ['NDLS', 'DLI', 'NZM', 'ANVT', 'DEE', 'DSJ'],
  'mumbai': ['CSTM', 'BCT', 'LTT', 'BDTS', 'DR', 'KYN', 'MMCT'],
  'kolkata': ['HWH', 'SDAH', 'KOAA', 'SHM', 'SRC'],
  'chennai': ['MAS', 'MS', 'TBM', 'PER'],
  'bangalore': ['SBC', 'YPR', 'KJM', 'BNC', 'SMVB'],
  'hyderabad': ['SC', 'HYB', 'KCG', 'LPI'],
  'pune': ['PUNE', 'SVJR'],
  'ahmedabad': ['ADI', 'SBT'],
  'lucknow': ['LKO', 'LJN', 'ASH'],
  'kanpur': ['CNB', 'CPA'],
  'jaipur': ['JP', 'GADJ']
};

export const getStationCodes = (query) => {
  if (!query) return [];
  const q = query.toLowerCase();

  // 1. Check if the query is a recognized metropolitan city
  for (const [city, codes] of Object.entries(CITY_STATIONS)) {
    if (q.includes(city)) {
      return codes;
    }
  }

  // 2. Check if it's an exact code or name
  const exactMatch = stationsMap[q];
  if (exactMatch) return [exactMatch.code];

  // 3. Search by substring for a specific station
  const found = stationsList.find(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  return found ? [found.code] : [];
};
