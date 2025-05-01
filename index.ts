import express from "express";
import { onRequestPost } from "./agent";

const app = express();
app.use(express.raw({ type: "application/json" }));
app.use(express.json());
app.post("/agent", onRequestPost);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
