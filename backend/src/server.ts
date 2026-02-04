import app from './app';

console.log('SMTP CHECK →', {
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS ? 'OK' : 'MISSING',
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`🚀 FLEETMASTER PRO ONLINE - Puerto: ${port}`);
});