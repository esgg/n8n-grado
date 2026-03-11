function statusValue(check) {
  return String(check?.output ?? "unknown").trim().toLowerCase();
}

function indicatorName(check) {
  const indicator = check?.assessesIndicator ?? {};
  return String(indicator?.["@id"] ?? "unknown").split("/").pop();
}

function escapeHtml(text) {
  text = String(text ?? "");
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function makeAnchor(text) {
  return String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/\//g, "-")
    .replace(/\./g, "")
    .replace(/:/g, "");
}

function rowColor(output) {
  output = String(output ?? "").trim().toLowerCase();
  if (output === "true") return "#d4edda";
  if (output === "false") return "#f8d7da";
  return "#fff3cd";
}

function buildMarkdown(data) {
  const name = data?.name ?? "Software Quality Assessment";
  const description = data?.description ?? "";
  const dateCreated = data?.dateCreated ?? "unknown";
  const assessed = data?.assessedSoftware ?? {};
  const softwareName = assessed?.name ?? "unknown";
  const softwareUrl = assessed?.url ?? "";
  const checks = Array.isArray(data?.checks) ? data.checks : [];

  const counts = {};
  for (const check of checks) {
    const key = statusValue(check);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const byIndicator = {};
  for (const check of checks) {
    const ind = indicatorName(check);
    if (!byIndicator[ind]) byIndicator[ind] = [];
    byIndicator[ind].push(check);
  }

  const md = [];

  md.push(`# ${name}\n`);
  if (description) md.push(`${description}\n`);

  md.push("## General Information\n");
  md.push(`- **Software:** ${softwareName}`);
  if (softwareUrl) md.push(`- **Repository:** ${softwareUrl}`);
  md.push(`- **Assessment date:** ${dateCreated}`);
  md.push(`- **Total checks:** ${checks.length}\n`);

  md.push("## Summary\n");
  md.push(`- **Passed (\`true\`)**: ${counts["true"] ?? 0}`);
  md.push(`- **Failed (\`false\`)**: ${counts["false"] ?? 0}`);
  md.push(`- **Errors (\`error\`)**: ${counts["error"] ?? 0}\n`);

  md.push("## Results Table\n");
  md.push("<table>");
  md.push("  <thead>");
  md.push("    <tr>");
  md.push("      <th>Test ID</th>");
  md.push("      <th>Test Name</th>");
  md.push("      <th>Result</th>");
  md.push("    </tr>");
  md.push("  </thead>");
  md.push("  <tbody>");

  for (const check of checks) {
    const testId = escapeHtml(check?.test_id ?? "");
    const testName = escapeHtml(check?.test_name ?? "");
    const output = statusValue(check);
    const outputHtml = escapeHtml(output);
    const ind = indicatorName(check);
    const detailAnchor = makeAnchor(`${ind}-${check?.test_id ?? ""}`);

    md.push(`    <tr style="background-color: ${rowColor(output)};">`);
    md.push(`      <td>${testId}</td>`);
    md.push(`      <td>${testName}</td>`);
    md.push(`      <td><a href="#${detailAnchor}">${outputHtml}</a></td>`);
    md.push("    </tr>");
  }

  md.push("  </tbody>");
  md.push("</table>\n");

  md.push("## Detailed Results by Indicator\n");

  for (const ind of Object.keys(byIndicator).sort()) {
    md.push(`### ${ind}\n`);

    for (const check of byIndicator[ind]) {
      const detailAnchor = makeAnchor(`${ind}-${check?.test_id ?? ""}`);
      md.push(`<a id="${detailAnchor}"></a>`);
      md.push(`#### ${check?.test_name ?? "Unnamed test"}\n`);
      md.push(`- **Test ID:** ${check?.test_id ?? ""}`);
      md.push(`- **Result:** ${statusValue(check)}`);
      md.push(`- **Process:** ${check?.process ?? "N/A"}`);
      md.push(`- **Evidence:** ${check?.evidence ?? "N/A"}`);
      md.push(`- **Suggestions:** ${check?.suggestions ?? "N/A"}\n`);
    }
  }

  return md.join("\n");
}

// Read binary file safely from previous node
const buffer = await this.helpers.getBinaryDataBuffer(0, "data");
const fileText = buffer.toString("utf8");

// Optional debug: uncomment next line to inspect first chars in execution data
// return [{ json: { preview: fileText.slice(0, 200) } }];

let data;
try {
  data = JSON.parse(fileText);
} catch (error) {
  throw new Error(
    "The input file is not valid JSON. First 200 chars: " + fileText.slice(0, 200)
  );
}

const markdown = buildMarkdown(data);
const markdownBase64 = Buffer.from(markdown, "utf8").toString("base64");

return [
  {
    json: {
      fileName: "report.md",
    },
    binary: {
      data: {
        data: markdownBase64,
        fileName: "report.md",
        mimeType: "text/markdown",
      },
    },
  },
];