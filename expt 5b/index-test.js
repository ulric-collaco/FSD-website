require("dotenv").config();

const mongoose = require("mongoose");
const connectToMongo = require("./config/db");
const User = require("./models/User");

function listStages(plan, accumulator = []) {
  if (!plan || typeof plan !== "object") {
    return accumulator;
  }

  if (plan.stage) {
    accumulator.push(plan.stage);
  }

  if (plan.inputStage) {
    listStages(plan.inputStage, accumulator);
  }

  if (Array.isArray(plan.inputStages)) {
    plan.inputStages.forEach((entry) => listStages(entry, accumulator));
  }

  if (plan.queryPlan) {
    listStages(plan.queryPlan, accumulator);
  }

  if (plan.winningPlan) {
    listStages(plan.winningPlan, accumulator);
  }

  return accumulator;
}

function printExplainSummary(title, explainResult) {
  const executionStats = explainResult.executionStats || {};
  const winningPlan = explainResult.queryPlanner ? explainResult.queryPlanner.winningPlan : null;
  const stageSummary = Array.from(new Set(listStages(winningPlan))).join(" -> ");

  console.log("\n----------------------------------------");
  console.log(title);
  console.log("Stage Path:", stageSummary || "Not available");
  console.log("Keys Examined:", executionStats.totalKeysExamined);
  console.log("Documents Examined:", executionStats.totalDocsExamined);
  console.log("Execution Time (ms):", executionStats.executionTimeMillis);
}

function pickHobbies(index) {
  const hobbyGroups = [
    ["coding", "gaming"],
    ["music", "travel"],
    ["reading", "photography"],
    ["sports", "cooking"]
  ];

  return hobbyGroups[index % hobbyGroups.length];
}

async function seedSampleData() {
  const count = await User.countDocuments();

  if (count >= 40) {
    console.log("Sample data already present. Skipping seed.");
    return;
  }

  const batchId = Date.now();
  const users = [];

  for (let i = 0; i < 40; i += 1) {
    users.push({
      name: `User ${i}`,
      email: `user_${batchId}_${i}@test.com`,
      age: 18 + (i % 30),
      hobbies: pickHobbies(i),
      bio: `I build backend systems using Node.js and MongoDB. Sample user ${i}.`,
      userId: `UID-${batchId}-${i}`,
      createdAt: new Date(Date.now() - i * 60 * 60 * 1000)
    });
  }

  await User.insertMany(users, { ordered: false });
  console.log("Inserted sample documents:", users.length);
}

async function runIndexTests() {
  await connectToMongo();
  await User.createIndexes();
  await seedSampleData();

  const sampleUser = await User.findOne().lean();

  if (!sampleUser) {
    throw new Error("No documents found for index tests.");
  }

  const explainName = await User.find({ name: sampleUser.name }).explain("executionStats");
  printExplainSummary("1) Single field index test on name", explainName);

  const explainAgeOnly = await User.find({ age: sampleUser.age }).explain("executionStats");
  printExplainSummary("2) Age-only query against compound index", explainAgeOnly);

  const explainEmailAndAge = await User.find({
    email: sampleUser.email,
    age: sampleUser.age
  }).explain("executionStats");
  printExplainSummary("3) Compound index test on email + age", explainEmailAndAge);

  const firstHobby = Array.isArray(sampleUser.hobbies) && sampleUser.hobbies.length > 0
    ? sampleUser.hobbies[0]
    : "coding";
  const explainHobby = await User.find({ hobbies: firstHobby }).explain("executionStats");
  printExplainSummary("4) Multikey index test on hobbies", explainHobby);

  const explainText = await User.find({ $text: { $search: "MongoDB backend" } }).explain("executionStats");
  printExplainSummary("5) Text index test on bio", explainText);

  const explainHashed = await User.find({ userId: sampleUser.userId }).explain("executionStats");
  printExplainSummary("6) Hashed index test on userId", explainHashed);

  const allIndexes = await User.collection.indexes();
  console.log("\nAvailable Indexes:");
  allIndexes.forEach((entry) => console.log(`- ${entry.name}:`, entry.key));
}

runIndexTests()
  .then(async () => {
    await mongoose.disconnect();
    console.log("\nIndex tests completed.");
  })
  .catch(async (error) => {
    console.error("Index test failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
