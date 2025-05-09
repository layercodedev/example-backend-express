import express from 'express';
import { onRequestPost as onRequestAgent } from './agent';
import { onRequestPost as onRequestAuthorize } from './authorize';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());
app.post('/agent', onRequestAgent);
app.use(cors())
app.post('/authorize', onRequestAuthorize);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
