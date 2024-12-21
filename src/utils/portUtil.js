import { exec } from 'child_process';
import logger from '@config/logger';

export const killProcessOnPort = (port) => {
  return new Promise((resolve) => {
    const command =
      process.platform === 'win32' ? `netstat -ano | findstr :${port}` : `lsof -i :${port}`;
    exec(command, (error, stdout) => {
      // If there's an error or no output, it means no process is using the port
      if (error || !stdout) {
        logger.info(`No process found using port ${port}`);
        return resolve();
      }
      try {
        const lines = stdout.split('\n');
        const line = lines[0];
        let pid;
        if (process.platform === 'win32') {
          pid = line.match(/\s+(\d+)\s*$/)?.[1];
        } else {
          pid = line.split(/\s+/)[2];
        }
        if (pid) {
          const killCommand =
            process.platform === 'win32' ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
          exec(killCommand, (killError) => {
            if (killError) {
              logger.info(`Process ${pid} already terminated or not found`);
            } else {
              logger.info(`Successfully killed process ${pid} on port ${port}`);
            }
            resolve();
          });
        } else {
          logger.info(`No PID found for port ${port}`);
          resolve();
        }
      } catch (parseError) {
        logger.info(`No active process found on port ${port}`);
        resolve();
      }
    });
  });
};
