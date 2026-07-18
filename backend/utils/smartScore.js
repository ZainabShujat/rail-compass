// smartScore.js
export const calculateSmartScore = (train, weights = {}, preferredClass = 'All') => {
  // Extract train properties. They should have: durMins, daytime, base price, and type.
  const baseWeights = {
    duration: parseFloat(weights.weightDuration) || 0.35,
    daytime: parseFloat(weights.weightDaytime) || 0.25,
    budget: parseFloat(weights.weightBudget) || 0.20,
    reliability: parseFloat(weights.weightReliability) || 0.10,
    comfort: parseFloat(weights.weightComfort) || 0.05,
    food: parseFloat(weights.weightFood) || 0.05
  };

  const totalWeight = Object.values(baseWeights).reduce((a, b) => a + b, 0);

  // Derive ratings based on Train Type
  const typeMetrics = getMetricsForType(train.type || 'Express');
  
  // Calculate Budget
  let budgetPrice = 0;
  if (preferredClass !== 'All' && train.prices && train.prices[preferredClass]) {
    budgetPrice = train.prices[preferredClass];
  } else if (train.prices) {
    budgetPrice = Object.values(train.prices)[0] || 500;
  } else {
    budgetPrice = 500; // default
  }

  return {
    ...train,
    metrics: typeMetrics,
    budgetPrice
  };
};

export const getMetricsForType = (type) => {
  const t = type.toLowerCase();
  if (t.includes('vande bharat') || t.includes('tejas')) return { reliabilityRating: 9.5, comfortRating: 9.5, foodRating: 9.0 };
  if (t.includes('rajdhani')) return { reliabilityRating: 9.5, comfortRating: 9.0, foodRating: 8.5 };
  if (t.includes('shatabdi')) return { reliabilityRating: 9.2, comfortRating: 8.5, foodRating: 8.0 };
  if (t.includes('sf') || t.includes('superfast')) return { reliabilityRating: 8.8, comfortRating: 8.8, foodRating: 7.0 };
  if (t.includes('mail')) return { reliabilityRating: 8.8, comfortRating: 8.8, foodRating: 7.0 };
  if (t.includes('pass')) return { reliabilityRating: 6.0, comfortRating: 5.0, foodRating: 3.0 };
  if (t.includes('memu') || t.includes('demu') || t.includes('emu')) return { reliabilityRating: 8.0, comfortRating: 4.0, foodRating: 2.0 };
  return { reliabilityRating: 7.5, comfortRating: 8.2, foodRating: 6.0 }; // Express default
};

export const rankTrains = (trainsList, weights, preferredClass) => {
  if (!trainsList || trainsList.length === 0) return [];

  // Parse incoming weights from query
  const baseWeights = {
    duration: weights?.weightDuration !== undefined ? parseFloat(weights.weightDuration) : 0.35,
    daytime: weights?.weightDaytime !== undefined ? parseFloat(weights.weightDaytime) : 0.25,
    budget: weights?.weightBudget !== undefined ? parseFloat(weights.weightBudget) : 0.20,
    reliability: weights?.weightReliability !== undefined ? parseFloat(weights.weightReliability) : 0.10,
    comfort: weights?.weightComfort !== undefined ? parseFloat(weights.weightComfort) : 0.05,
    food: weights?.weightFood !== undefined ? parseFloat(weights.weightFood) : 0.05
  };

  // Check if they are exactly the defaults
  const isStandardWeights = 
    Math.abs(baseWeights.duration - 0.35) < 0.01 &&
    Math.abs(baseWeights.daytime - 0.25) < 0.01 &&
    Math.abs(baseWeights.budget - 0.20) < 0.01 &&
    Math.abs(baseWeights.reliability - 0.10) < 0.01 &&
    Math.abs(baseWeights.comfort - 0.05) < 0.01 &&
    Math.abs(baseWeights.food - 0.05) < 0.01;

  const totalWeight = Object.values(baseWeights).reduce((a, b) => a + b, 0) || 1;

  // Apply base score calculations
  let processed = trainsList.map(t => calculateSmartScore(t, weights, preferredClass));

  // Determine min/max for normalization
  const minDur = Math.min(...processed.map(t => t.durMins));
  const maxDur = Math.max(...processed.map(t => t.durMins));
  
  const minDaytime = Math.min(...processed.map(t => t.daytime));
  const maxDaytime = Math.max(...processed.map(t => t.daytime));
  
  const minPrice = Math.min(...processed.map(t => t.budgetPrice));
  const maxPrice = Math.max(...processed.map(t => t.budgetPrice));

  processed = processed.map(t => {
    const durationScore = maxDur === minDur ? 100 : 100 - (((t.durMins - minDur) / (maxDur - minDur)) * 100);
    const daytimeScore = maxDaytime === minDaytime ? 100 : 100 - (((t.daytime - minDaytime) / (maxDaytime - minDaytime)) * 100);
    const budgetScore = maxPrice === minPrice ? 100 : 100 - (((t.budgetPrice - minPrice) / (maxPrice - minPrice)) * 100);
    
    const reliabilityScore = t.metrics.reliabilityRating * 10;
    const comfortScore = t.metrics.comfortRating * 10;
    const foodScore = t.metrics.foodRating === "NA" ? 50 : (t.metrics.foodRating * 10); // Safe fallback if NA

    let finalScore = 0;
    let isUnorthodox = false;
    let matchReason = "Solid all-around option";

    // Unorthodox Arrival Penalty (1 AM to 6 AM)
    if (t.arrivalTime) {
      const [arrH] = t.arrivalTime.split(':').map(Number);
      if (arrH >= 1 && arrH < 6) {
        isUnorthodox = true;
      }
    }

    if (!isStandardWeights) {
      // CUSTOM USER PREFERENCES MODE
      finalScore = 
        (durationScore * (baseWeights.duration / totalWeight)) +
        (daytimeScore * (baseWeights.daytime / totalWeight)) +
        (budgetScore * (baseWeights.budget / totalWeight)) +
        (reliabilityScore * (baseWeights.reliability / totalWeight)) +
        (comfortScore * (baseWeights.comfort / totalWeight)) +
        (foodScore * (baseWeights.food / totalWeight));
      
      if (isUnorthodox && t.durMins <= 10 * 60) {
        finalScore -= 15;
      }

      if (durationScore > 90) matchReason = "Fastest route available";
      else if (daytimeScore > 90) matchReason = "Saves your daytime hours";
      else if (budgetScore > 90) matchReason = `Best value for money`;
      else if (baseWeights.duration >= 0.5) matchReason = "Matched to Duration Preference";
      else if (baseWeights.budget >= 0.5) matchReason = "Matched to Budget Preference";
      else matchReason = "Matched to Custom Preferences";

    } else {
      // STANDARD PATH (Default AI Algorithm)
      if (t.durMins <= 10 * 60) {
        // --- SHORT JOURNEY (< 10 hours) ---

        let isOvernightNoPantryNeeded = false;
        if (t.departureTime && t.arrivalTime) {
          const [depH] = t.departureTime.split(':').map(Number);
          const [arrH] = t.arrivalTime.split(':').map(Number);
          // Departs late night (>= 21:00 or <= 3:00) and arrives morning (<= 11:00)
          if ((depH >= 21 || depH <= 3) && arrH <= 11) {
            isOvernightNoPantryNeeded = true;
          }
        }

        if (isOvernightNoPantryNeeded) {
          // Redistribute 5% food weight to comfort (makes it 10%)
          finalScore = 
            (durationScore * 0.35) +
            (daytimeScore * 0.25) +
            (budgetScore * 0.20) +
            (reliabilityScore * 0.10) +
            (comfortScore * 0.10);

          t.metrics.foodRating = "NA";
        } else {
          finalScore = 
            (durationScore * 0.35) +
            (daytimeScore * 0.25) +
            (budgetScore * 0.20) +
            (reliabilityScore * 0.10) +
            (comfortScore * 0.05) +
            (foodScore * 0.05);
        }

        if (isUnorthodox) {
          finalScore -= 15;
        }

        if (durationScore > 90) matchReason = "Fastest route available";
        else if (daytimeScore > 90) matchReason = "Saves your daytime hours";
        else if (budgetScore > 90) matchReason = `Best value for money`;
        else if (finalScore > 85) matchReason = "Top Rail Compass Recommendation";

      } else {
        // --- LONG JOURNEY (> 10 hours) ---
        // We drop the daytime score and orthodox arrival entirely. 
        // Prioritize Duration, Budget, Comfort, and Food
        finalScore = 
          (durationScore * 0.35) +
          (comfortScore * 0.25) +
          (budgetScore * 0.15) +
          (foodScore * 0.15) +
          (reliabilityScore * 0.10);

        // Premium Train Bonus
        const isPremium = ['Rajdhani', 'Shatabdi', 'Tejas', 'Vande Bharat'].includes(t.type);
        if (isPremium) {
          finalScore += 18; // Heavy bonus for Premium long-haul
        }

        if (isPremium && finalScore > 90) matchReason = "Premium Long-Haul Experience";
        else if (durationScore > 90) matchReason = "Fastest long-haul option";
        else if (comfortScore > 90) matchReason = "Maximum Comfort for Long Journey";
        else if (budgetScore > 90) matchReason = `Best long-haul value`;
        else if (finalScore > 85) matchReason = "Top Rail Compass Recommendation";
      }
    }

    return {
      ...t,
      aiScore: Math.max(0, Math.round(finalScore)),
      matchReason,
      isUnorthodox
    };
  });

  processed.sort((a, b) => b.aiScore - a.aiScore);
  return processed;
};
