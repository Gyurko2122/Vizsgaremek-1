#!/usr/bin/env node

/**
 * Test Report Generator
 * Generates beautiful HTML report from test results
 *
 * Usage: node src/test/generate-report.js
 */

const fs = require("fs");
const path = require("path");

function generateHTMLReport(testResults) {
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(
    1,
  );
  const failureRate = ((testResults.failed / testResults.total) * 100).toFixed(
    1,
  );

  const html = `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vizsgaremek - Test Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 15px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 48px;
      margin-bottom: 10px;
    }

    .header p {
      font-size: 18px;
      opacity: 0.9;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
      border-bottom: 2px solid #e9ecef;
    }

    .summary-card {
      background: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .summary-card h3 {
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }

    .summary-card .number {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .summary-card.success .number {
      color: #28a745;
    }

    .summary-card.failed .number {
      color: #dc3545;
    }

    .summary-card.total .number {
      color: #667eea;
    }

    .summary-card.rate .number {
      color: #28a745;
    }

    .summary-card p {
      color: #999;
      font-size: 12px;
    }

    .tests-section {
      padding: 40px;
    }

    .tests-section h2 {
      font-size: 28px;
      color: #333;
      margin-bottom: 30px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 15px;
    }

    .test-group {
      margin-bottom: 40px;
    }

    .test-group-title {
      font-size: 20px;
      color: #667eea;
      margin-bottom: 15px;
      padding-left: 10px;
      border-left: 4px solid #667eea;
    }

    .test-item {
      display: flex;
      align-items: center;
      padding: 15px;
      margin-bottom: 10px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #e9ecef;
      transition: all 0.3s ease;
    }

    .test-item:hover {
      background: #e9ecef;
      transform: translateX(5px);
    }

    .test-item.passed {
      border-left-color: #28a745;
      background: #f0f8f5;
    }

    .test-item.failed {
      border-left-color: #dc3545;
      background: #fdf8f8;
    }

    .test-status {
      font-size: 24px;
      margin-right: 15px;
      min-width: 30px;
    }

    .test-info {
      flex: 1;
    }

    .test-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
    }

    .test-details {
      font-size: 12px;
      color: #999;
    }

    .test-time {
      font-size: 11px;
      color: #bbb;
      margin-left: 10px;
    }

    .footer {
      background: #f8f9fa;
      padding: 30px 40px;
      text-align: center;
      color: #999;
      border-top: 1px solid #e9ecef;
    }

    .footer p {
      margin-bottom: 10px;
    }

    .progress-bar {
      width: 100%;
      height: 30px;
      background: #e9ecef;
      border-radius: 15px;
      overflow: hidden;
      margin: 20px 0;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #28a745, #20c997);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      transition: width 0.5s ease;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        border-radius: 0;
      }
    }

    @media (max-width: 768px) {
      .header {
        padding: 40px 20px;
      }
      .header h1 {
        font-size: 32px;
      }
      .tests-section {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Vizsgaremek Test Report</h1>
      <p>Comprehensive Testing Results</p>
    </div>

    <div class="summary">
      <div class="summary-card total">
        <h3>Total Tests</h3>
        <div class="number">${testResults.total}</div>
        <p>Test cases executed</p>
      </div>
      <div class="summary-card success">
        <h3>Passed</h3>
        <div class="number">${testResults.passed}</div>
        <p>Successfully passed</p>
      </div>
      <div class="summary-card failed">
        <h3>Failed</h3>
        <div class="number">${testResults.failed}</div>
        <p>Issues found</p>
      </div>
      <div class="summary-card rate">
        <h3>Success Rate</h3>
        <div class="number">${successRate}%</div>
        <p>Pass rate</p>
      </div>
    </div>

    <div class="tests-section">
      <h2>📋 Test Results</h2>
      
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${successRate}%">
          ${successRate}% Pass Rate
        </div>
      </div>

      ${generateTestGroups(testResults.tests)}
    </div>

    <div class="footer">
      <p><strong>Generated:</strong> ${new Date().toLocaleString("hu-HU")}</p>
      <p>Vizsgaremek Platform Testing Suite</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

function generateTestGroups(tests) {
  const categories = {
    "🔐 Authentication & User Management": [],
    "📦 Product Management": [],
    "🔍 Search Functionality": [],
    "❤️ Favorites System": [],
    "💬 Messaging System": [],
    "⚙️ Admin Features": [],
    "📸 Image Upload & Serving": [],
    "🔒 Security & Middleware": [],
  };

  tests.forEach((test) => {
    for (const category in categories) {
      if (test.name.includes(category.split(" ")[0])) {
        categories[category].push(test);
        break;
      }
    }
  });

  let html = "";
  for (const [category, categoryTests] of Object.entries(categories)) {
    if (categoryTests.length === 0) continue;

    html += `<div class="test-group">
      <div class="test-group-title">${category}</div>`;

    categoryTests.forEach((test) => {
      const icon = test.passed ? "✓" : "✗";
      const className = test.passed ? "passed" : "failed";
      const time = new Date(test.timestamp).toLocaleTimeString("hu-HU");

      html += `
      <div class="test-item ${className}">
        <div class="test-status">${icon}</div>
        <div class="test-info">
          <div class="test-name">${test.name}</div>
          <div class="test-details">${test.details}</div>
        </div>
        <div class="test-time">${time}</div>
      </div>`;
    });

    html += "</div>";
  }

  return html;
}

// Main execution
const reportPath = path.join(__dirname, "test-report.json");

if (!fs.existsSync(reportPath)) {
  console.error(`Test report not found at ${reportPath}`);
  console.log("\nRun tests first with: npm run test:api");
  process.exit(1);
}

const testResults = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
const htmlReport = generateHTMLReport(testResults);
const outputPath = path.join(__dirname, "../../test-report.html");

fs.writeFileSync(outputPath, htmlReport);

console.log("\n✓ Test report generated successfully!");
console.log(`Report saved to: ${outputPath}`);
console.log("\n📊 Summary:");
console.log(`  Total Tests: ${testResults.total}`);
console.log(`  Passed: ${testResults.passed} ✓`);
console.log(`  Failed: ${testResults.failed} ✗`);
console.log(
  `  Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`,
);
console.log(
  "\nOpen the HTML file in your browser to view the detailed report.",
);
