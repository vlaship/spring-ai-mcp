# Test Execution and Reporting Guide

This document describes the comprehensive testing framework for the Pooch Palace UI application, including execution strategies, reporting capabilities, and continuous integration setup.

## Test Types

The testing framework supports three main types of tests:

### Unit Tests (`tests/unit/`)
- Test individual functions, classes, and modules in isolation
- Focus on specific examples and edge cases
- Fast execution and immediate feedback
- Located in `tests/unit/` directory

### Integration Tests (`tests/integration/`)
- Test complete user workflows and component interactions
- Validate end-to-end functionality
- Use realistic data and scenarios
- Located in `tests/integration/` directory

### Property-Based Tests (`tests/properties/`)
- Test universal properties across randomized inputs
- Verify correctness properties from the design document
- Run minimum 100 iterations per property (configurable via `FAST_CHECK_NUM_RUNS`)
- Located in `tests/properties/` directory

## Test Execution Commands

### Basic Commands

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration  
npm run test:properties

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Interactive test UI
npm run test:ui
```

### Advanced Commands

```bash
# Run tests with comprehensive reporting
npm run test:report

# CI-optimized test execution
npm run test:ci
npm run test:report:ci

# Custom test runner with options
npm run test:run unit integration --coverage
npm run test:run:ci
npm run test:run:parallel
```

### Test Runner Options

The custom test runner (`scripts/run-tests.js`) supports various options:

```bash
# Run specific test types
node scripts/run-tests.js unit integration properties

# CI mode with strict settings
node scripts/run-tests.js --ci --coverage --bail

# Parallel execution (faster but less detailed output)
node scripts/run-tests.js --parallel

# Coverage reporting
node scripts/run-tests.js --coverage
```

## Coverage Requirements

The testing framework enforces strict coverage thresholds:

### Global Thresholds
- Lines: 90%
- Functions: 90%
- Branches: 90%
- Statements: 90%

### Critical Component Thresholds
- `src/state.ts`: 95% (all metrics)
- `src/chat-service.ts`: 95% (all metrics)
- `src/dom.ts`: 90% (all metrics)

### Coverage Reports

Coverage reports are generated in multiple formats:
- **HTML**: `coverage/index.html` - Interactive web report
- **JSON**: `coverage/coverage-final.json` - Machine-readable data
- **LCOV**: `coverage/lcov.info` - For external tools (Codecov, etc.)
- **Text**: Console output during test execution

## Test Reporting

### Local Reporting

The test reporter (`scripts/test-report.js`) provides:
- Test execution summary with pass/fail counts
- Coverage breakdown by file and metric
- Test type breakdown (unit/integration/properties)
- Actionable recommendations for improvement
- Links to detailed reports

### CI Reporting

In continuous integration environments:
- JUnit XML reports for test result integration
- JSON reports for programmatic analysis
- Coverage reports uploaded to Codecov
- Automated PR comments with test results
- Failure notifications and exit codes

## Continuous Integration

### GitHub Actions Integration

The CI pipeline (`/.github/workflows/ci.yml`) includes:

1. **Test Execution**: Runs all test types with coverage
2. **Artifact Upload**: Preserves test results and coverage reports
3. **Coverage Upload**: Sends coverage data to Codecov
4. **PR Comments**: Posts test results directly on pull requests
5. **Failure Handling**: Proper exit codes and notifications

### CI Configuration

Key CI features:
- **Fail Fast**: Stops on first test failure (`bail: 1`)
- **Retry Logic**: Retries failed tests up to 2 times
- **Timeout Handling**: 15-second timeout for CI environments
- **Parallel Execution**: Matrix builds for different components
- **Artifact Retention**: 30-day retention for test results

## Property-Based Testing

### Configuration

Property-based tests use Fast-Check with specific configuration:
- **Iterations**: Minimum 100 runs per property (set via `FAST_CHECK_NUM_RUNS`)
- **Shrinking**: Automatic reduction to minimal failing examples
- **Deterministic**: Reproducible test runs with seed values
- **Integration**: Seamless integration with Vitest test runner

### Property Validation

Each property test validates specific correctness properties from the design document:
- Tagged with format: `**Feature: ui-testing, Property {number}: {property_text}**`
- References specific requirements: `**Validates: Requirements X.Y**`
- Implements universal quantification: "For any valid input..."

## Environment Configuration

### Development Environment

```bash
# Install dependencies
npm install

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# View interactive test UI
npm run test:ui
```

### CI Environment

Environment variables automatically detected:
- `CI=true`: Enables CI-specific configurations
- `FAST_CHECK_NUM_RUNS`: Controls property test iterations
- Coverage thresholds enforced automatically

### Local CI Simulation

```bash
# Simulate CI environment locally
CI=true npm run test:ci

# Run with CI reporting
npm run test:report:ci
```

## Troubleshooting

### Common Issues

1. **Coverage Threshold Failures**
   - Check `coverage/index.html` for detailed file-by-file analysis
   - Focus on uncovered lines and branches
   - Add targeted unit tests for missing coverage

2. **Property Test Failures**
   - Review shrunk counterexamples in test output
   - Verify property logic against requirements
   - Check input generators for edge cases

3. **Integration Test Flakiness**
   - Ensure proper test isolation and cleanup
   - Check for timing-dependent assertions
   - Verify mock configurations

### Debug Commands

```bash
# Run single test file
npx vitest tests/unit/state-manager.test.ts

# Run with debug output
DEBUG=* npm test

# Generate detailed coverage
npm run test:coverage -- --reporter=verbose

# Run property tests with more iterations
FAST_CHECK_NUM_RUNS=1000 npm run test:properties
```

## Best Practices

### Test Organization
- Co-locate unit tests with source files when possible
- Use descriptive test names that explain the scenario
- Group related tests in describe blocks
- Keep tests focused and independent

### Coverage Strategy
- Aim for high coverage but focus on meaningful tests
- Test error paths and edge cases explicitly
- Use property-based tests for comprehensive input coverage
- Don't sacrifice test quality for coverage metrics

### CI Integration
- Keep test execution time reasonable (< 5 minutes)
- Use parallel execution for independent test suites
- Provide clear failure messages and debugging information
- Maintain test stability and reduce flakiness

## Integration with Development Workflow

### Pre-commit Hooks
Consider adding pre-commit hooks to run tests:
```bash
# Example pre-commit hook
npm run test:unit && npm run lint
```

### IDE Integration
Most IDEs support Vitest integration:
- VS Code: Vitest extension for inline test results
- IntelliJ: Built-in Vitest support
- Vim/Neovim: Various Vitest plugins available

### Continuous Development
- Use `npm run test:watch` during development
- Run `npm run test:coverage` before committing
- Check `npm run test:report` for comprehensive analysis