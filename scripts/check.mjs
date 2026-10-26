import { readFile } from "node:fs/promises";

const required = ["dist/index.html", "dist/styles.css", "dist/app.js", "dist/knowledge.json", "app/main.py", "app/rag.py", "Dockerfile"];
for (const file of required) await readFile(file);
const knowledge = JSON.parse(await readFile("dist/knowledge.json", "utf8"));
if (knowledge.sources.length !== 7) throw new Error("Expected exactly seven allowlisted sources");
if (knowledge.sources.some(source => !source.url.startsWith("https://www.placidway.com/"))) throw new Error("Unexpected knowledge source");
console.log("Static site check passed: 7 allowlisted sources and required files present.");
