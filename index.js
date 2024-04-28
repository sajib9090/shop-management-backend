import { port } from "./secret.js";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

app.listen(port, async () => {
  console.log(`backend app listening on port ${port}`);
  await connectDB();
});
