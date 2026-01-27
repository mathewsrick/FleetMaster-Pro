// backend/src/server.ts
import dotenv from 'dotenv';
dotenv.config({
  path: '../.env'
});

import app from './app';

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`🚀 FLEETMASTER PRO ONLINE - Puerto: ${port}`);
});