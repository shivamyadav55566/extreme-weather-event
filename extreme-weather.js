const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/extreme_weather_db';

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB ✓');

    const eventSchema = new mongoose.Schema({
      eventType: { type: String, required: true },
      location: {
        country: String,
        state: String,
        city: String,
        coordinates: { lat: Number, lon: Number }
      },
      eventDate: { type: Date, required: true },
      durationHours: Number,
      severity: { type: String, enum: ['Low','Moderate','High','Extreme'], default: 'Moderate' },
      measurements: {
        temperatureC: Number,
        windKmph: Number,
        rainfallMm: Number,
        pressurehPa: Number
      },
      casualties: { injured: { type: Number, default: 0 }, fatalities: { type: Number, default: 0 } },
      economicLossUSD: Number,
      description: String,
      reportedBy: String,
      createdAt: { type: Date, default: Date.now }
    });

    const Event = mongoose.model('ExtremeWeatherEvent', eventSchema);

    const sampleEvents = [
      {
        eventType: 'Heatwave',
        location: { country: 'India', state: 'Rajasthan', city: 'Jaisalmer', coordinates: { lat: 26.9157, lon: 70.9083 } },
        eventDate: new Date('2025-05-22T10:00:00Z'),
        durationHours: 96,
        severity: 'Extreme',
        measurements: { temperatureC: 49.2, windKmph: 12 },
        casualties: { injured: 15, fatalities: 3 },
        economicLossUSD: 1200000,
        description: 'Prolonged extreme temperatures causing health emergencies, crop damage and power outages.',
        reportedBy: 'District Meteorological Office'
      },
      {
        eventType: 'Flash Flood',
        location: { country: 'Nepal', state: 'Province No. 1', city: 'Sunsari', coordinates: { lat: 26.6810, lon: 87.2205 } },
        eventDate: new Date('2024-08-11T02:30:00Z'),
        durationHours: 12,
        severity: 'High',
        measurements: { rainfallMm: 210 },
        casualties: { injured: 40, fatalities: 6 },
        economicLossUSD: 450000,
        description: 'Intense rains caused river overflow and sudden flash floods across low-lying villages.',
        reportedBy: 'Local Disaster Management'
      },
      {
        eventType: 'Cyclone',
        location: { country: 'Bangladesh', state: 'Chittagong', city: 'Cox\'s Bazar', coordinates: { lat: 21.4272, lon: 92.0058 } },
        eventDate: new Date('2023-11-05T18:00:00Z'),
        durationHours: 30,
        severity: 'Extreme',
        measurements: { windKmph: 160, pressurehPa: 950, rainfallMm: 320 },
        casualties: { injured: 120, fatalities: 28 },
        economicLossUSD: 8000000,
        description: 'Severe cyclone with storm surge and widespread infrastructure damage.',
        reportedBy: 'National Weather Center'
      }
    ];

    const existingCount = await Event.countDocuments();
    if (existingCount === 0) {
      console.log('Inserting sample events...');
      const inserted = await Event.insertMany(sampleEvents);
      console.log(`Inserted ${inserted.length} events.`);
    } else {
      console.log(`Collection already has ${existingCount} documents — skipping insertion.`);
    }

    console.log('\nRecent High/Extreme events (most recent first):');
    const recentEvents = await Event.find({ severity: { $in: ['High', 'Extreme'] } })
      .sort({ eventDate: -1 })
      .limit(10)
      .lean()
      .exec();

    recentEvents.forEach((e, i) => {
      console.log(`\n#${i+1} ${e.eventType} on ${new Date(e.eventDate).toISOString()}`);
      console.log(`   Location: ${e.location.city || '-'}, ${e.location.state || '-'}, ${e.location.country || '-'}`);
      console.log(`   Severity: ${e.severity}, Temp: ${e.measurements?.temperatureC ?? 'N/A'}°C, Rain(mm): ${e.measurements?.rainfallMm ?? 'N/A'}`);
      console.log(`   Casualties (inj/fatal): ${e.casualties.injured}/${e.casualties.fatalities}`);
      console.log(`   Reported by: ${e.reportedBy}`);
      console.log(`   Desc: ${e.description?.slice(0, 140)}${e.description && e.description.length > 140 ? '...' : ''}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB. Done ✅');
  } catch (err) {
    console.error('Error:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

main();
