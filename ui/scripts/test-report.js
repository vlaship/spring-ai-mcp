#!/usr/bin/env node

/**
 * Test Report Generator
 * Generates comprehensive test reports and handles notifications
 */

const fs = require('fs');
const path = require('path');

class TestReporter {
  constructor() {
    this.resultsPath = path.join(__dirname, '../test-results/results.json');
    this.coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');
    this.junitPath = path.join(__dirname, '../test-results/junit.xml');
  }

  async generateReport() {
    console.log('🧪 Generating Test Report...\n');

    const testResults = this.loadTestResults();
    const coverageResults = this.loadCoverageResults();

    this.printTestSummary(testResults);
    this.printCoverageSummary(coverageResults);
    this.printRecommendations(testResults, coverageResults);

    return {
      success: testResults?.success && this.checkCoverageThresholds(coverageResults),
      testResults,
      coverageResults
    };
  }

  loadTestResults() {
    try {
      if (fs.existsSync(this.resultsPath)) {
        return JSON.parse(fs.readFileSync(this.resultsPath, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️  Could not load test results:', error.message);
    }
    return null;
  }

  loadCoverageResults() {
    try {
      if (fs.existsSync(this.coveragePath)) {
        return JSON.parse(fs.readFileSync(this.coveragePath, 'utf8'));
      }
      
      // Try alternative coverage file location
      const altCoveragePath = path.join(__dirname, '../coverage/coverage-final.json');
      if (fs.existsSync(altCoveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(altCoveragePath, 'utf8'));
        // Convert to summary format
        return this.convertCoverageToSummary(coverageData);
      }
    } catch (error) {
      console.warn('⚠️  Could not load coverage results:', error.message);
    }
    return null;
  }

  convertCoverageToSummary(coverageData) {
    const summary = { total: { lines: { pct: 0, covered: 0, total: 0 }, functions: { pct: 0, covered: 0, total: 0 }, branches: { pct: 0, covered: 0, total: 0 }, statements: { pct: 0, covered: 0, total: 0 } } };
    
    let totalLines = 0, coveredLines = 0;
    let totalFunctions = 0, coveredFunctions = 0;
    let totalBranches = 0, coveredBranches = 0;
    let totalStatements = 0, coveredStatements = 0;
    
    Object.entries(coverageData).forEach(([file, data]) => {
      if (file.includes('node_modules') || file.includes('test')) return;
      
      const fileLines = Object.keys(data.statementMap).length;
      const fileCoveredLines = Object.values(data.s).filter(count => count > 0).length;
      
      const fileFunctions = Object.keys(data.fnMap).length;
      const fileCoveredFunctions = Object.values(data.f).filter(count => count > 0).length;
      
      const fileBranches = Object.keys(data.branchMap).length;
      const fileCoveredBranches = Object.values(data.b).flat().filter(count => count > 0).length;
      
      totalLines += fileLines;
      coveredLines += fileCoveredLines;
      totalFunctions += fileFunctions;
      coveredFunctions += fileCoveredFunctions;
      totalStatements += fileLines; // Using lines as statements approximation
      coveredStatements += fileCoveredLines;
      totalBranches += fileBranches;
      coveredBranches += Math.min(fileCoveredBranches, fileBranches);
      
      // Add file-level data
      const shortFile = file.replace(/^.*[\\\/]src[\\\/]/, 'src/');
      summary[shortFile] = {
        lines: { pct: fileLines > 0 ? Math.round((fileCoveredLines / fileLines) * 100) : 0, covered: fileCoveredLines, total: fileLines },
        functions: { pct: fileFunctions > 0 ? Math.round((fileCoveredFunctions / fileFunctions) * 100) : 0, covered: fileCoveredFunctions, total: fileFunctions },
        branches: { pct: fileBranches > 0 ? Math.round((Math.min(fileCoveredBranches, fileBranches) / fileBranches) * 100) : 0, covered: Math.min(fileCoveredBranches, fileBranches), total: fileBranches },
        statements: { pct: fileLines > 0 ? Math.round((fileCoveredLines / fileLines) * 100) : 0, covered: fileCoveredLines, total: fileLines }
      };
    });
    
    summary.total = {
      lines: { pct: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0, covered: coveredLines, total: totalLines },
      functions: { pct: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0, covered: coveredFunctions, total: totalFunctions },
      branches: { pct: totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 0, covered: coveredBranches, total: totalBranches },
      statements: { pct: totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0, covered: coveredStatements, total: totalStatements }
    };
    
    return summary;
  }

  printTestSummary(results) {
    if (!results) {
      console.log('❌ No test results available\n');
      return;
    }

    const { numTotalTests, numPassedTests, numFailedTests, success } = results;
    const icon = success ? '✅' : '❌';
    
    console.log(`${icon} Test Summary:`);
    console.log(`   Total Tests: ${numTotalTests}`);
    console.log(`   Passed: ${numPassedTests}`);
    console.log(`   Failed: ${numFailedTests}`);
    console.log(`   Success Rate: ${((numPassedTests / numTotalTests) * 100).toFixed(1)}%\n`);

    if (results.testResults) {
      this.printTestBreakdown(results.testResults);
    }
  }

  printTestBreakdown(testResults) {
    const breakdown = {
      unit: { passed: 0, failed: 0 },
      integration: { passed: 0, failed: 0 },
      properties: { passed: 0, failed: 0 }
    };

    testResults.forEach(suite => {
      const suitePath = suite.name || '';
      let category = 'unit';
      
      if (suitePath.includes('integration')) category = 'integration';
      else if (suitePath.includes('properties')) category = 'properties';

      if (suite.result?.state === 'pass') {
        breakdown[category].passed++;
      } else {
        breakdown[category].failed++;
      }
    });

    console.log('📊 Test Breakdown by Type:');
    Object.entries(breakdown).forEach(([type, counts]) => {
      const total = counts.passed + counts.failed;
      if (total > 0) {
        const rate = ((counts.passed / total) * 100).toFixed(1);
        console.log(`   ${type.charAt(0).toUpperCase() + type.slice(1)}: ${counts.passed}/${total} (${rate}%)`);
      }
    });
    console.log();
  }

  printCoverageSummary(coverage) {
    if (!coverage) {
      console.log('❌ No coverage results available\n');
      return;
    }

    const { lines, functions, branches, statements } = coverage.total;
    
    console.log('📈 Coverage Summary:');
    console.log(`   Lines: ${lines.pct}% (${lines.covered}/${lines.total})`);
    console.log(`   Functions: ${functions.pct}% (${functions.covered}/${functions.total})`);
    console.log(`   Branches: ${branches.pct}% (${branches.covered}/${branches.total})`);
    console.log(`   Statements: ${statements.pct}% (${statements.covered}/${statements.total})\n`);

    this.printCoverageByFile(coverage);
  }

  printCoverageByFile(coverage) {
    const files = Object.entries(coverage)
      .filter(([key]) => key !== 'total')
      .sort(([, a], [, b]) => a.lines.pct - b.lines.pct);

    if (files.length > 0) {
      console.log('📁 Coverage by File (lowest first):');
      files.slice(0, 5).forEach(([file, data]) => {
        const shortFile = file.replace(process.cwd(), '').replace(/^\//, '');
        console.log(`   ${shortFile}: ${data.lines.pct}%`);
      });
      console.log();
    }
  }

  checkCoverageThresholds(coverage) {
    if (!coverage) return false;

    const thresholds = {
      lines: 90,
      functions: 90,
      branches: 90,
      statements: 90
    };

    const { lines, functions, branches, statements } = coverage.total;
    const results = {
      lines: lines.pct >= thresholds.lines,
      functions: functions.pct >= thresholds.functions,
      branches: branches.pct >= thresholds.branches,
      statements: statements.pct >= thresholds.statements
    };

    return Object.values(results).every(Boolean);
  }

  printRecommendations(testResults, coverageResults) {
    console.log('💡 Recommendations:');

    if (testResults && !testResults.success) {
      console.log('   • Fix failing tests before merging');
    }

    if (coverageResults) {
      const { lines, functions, branches, statements } = coverageResults.total;
      
      if (lines.pct < 90) {
        console.log(`   • Increase line coverage (currently ${lines.pct}%, target: 90%)`);
      }
      if (functions.pct < 90) {
        console.log(`   • Add tests for uncovered functions (currently ${functions.pct}%, target: 90%)`);
      }
      if (branches.pct < 90) {
        console.log(`   • Test more conditional branches (currently ${branches.pct}%, target: 90%)`);
      }
    }

    console.log('   • Run `npm run test:coverage` for detailed coverage report');
    console.log('   • Run `npm run test:ui` for interactive test debugging\n');
  }

  async sendNotification(results) {
    // In a real environment, this could send notifications to Slack, email, etc.
    if (process.env.CI && !results.success) {
      console.log('🚨 CI Failure Notification: Tests failed or coverage below threshold');
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const reporter = new TestReporter();
  
  try {
    const results = await reporter.generateReport();
    await reporter.sendNotification(results);
    
    if (!results.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error generating test report:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TestReporter;