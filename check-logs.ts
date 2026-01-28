import { connectDatabase } from './src/config/database';
import { Log } from './src/models/Log';

(async () => {
  await connectDatabase();
  const logCount = await Log.countDocuments();
  console.log('Total logs in database:', logCount);
  if (logCount > 0) {
    console.log('Recent logs:');
    const recentLogs = await Log.find().sort({ timestamp: -1 }).limit(5);
    recentLogs.forEach(log => {
      console.log('- ', log.message, 'at', log.timestamp);
    });
  }
  process.exit(0);
})();