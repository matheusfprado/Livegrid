import { existsSync, readFileSync } from "node:fs";

const path = "BRANCH_README.md";

if (!existsSync(path)) {
  console.error("Missing BRANCH_README.md. Copy BRANCH_README.template.md and describe this branch.");
  process.exit(1);
}

const content = readFileSync(path, "utf8").trim();
const withoutHeadings = content
  .split(/\r?\n/)
  .filter((line) => !line.trim().startsWith("#"))
  .join("\n")
  .trim();

if (withoutHeadings.length < 120) {
  console.error("BRANCH_README.md is too short. Explain summary, changed areas, tests and risks.");
  process.exit(1);
}

const forbiddenPlaceholders = [
  "Describe what this branch changes and why.",
  "Add screenshots, API responses, logs or notes when useful.",
];

const hasPlaceholder = forbiddenPlaceholders.some((placeholder) => content.includes(placeholder));

if (hasPlaceholder) {
  console.error("BRANCH_README.md still contains template placeholder text.");
  process.exit(1);
}
