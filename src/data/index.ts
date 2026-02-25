import { db } from "../config/db";
import { exit } from "node:process";

const clearData = async () => {
  try {
    await db.sync({ force: true });
    console.log("Data cleared");
    exit(0);
  } catch (error) {
    exit(1);
  }
};

if (process.argv[2] === "--clear") {
  clearData();
}
