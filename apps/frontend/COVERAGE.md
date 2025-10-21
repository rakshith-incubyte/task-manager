# Code Coverage

This project uses Vitest with V8 coverage provider for code coverage reporting.

## Installation

First, install the coverage provider:

```bash
pnpm add -D @vitest/coverage-v8
```

## Running Coverage

### Generate Coverage Report

```bash
pnpm test:coverage
```

This will:
- Run all tests
- Generate coverage reports in multiple formats
- Display coverage summary in the terminal

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- **HTML Report**: `coverage/index.html` - Open in browser for interactive view
- **LCOV Report**: `coverage/lcov.info` - For CI/CD integration
- **JSON Report**: `coverage/coverage-final.json` - For programmatic access
- **Text Report**: Displayed in terminal

### View HTML Report

```bash
# Open the HTML report in your default browser
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

## Coverage Thresholds

The project enforces the following minimum coverage thresholds:

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

Tests will fail if coverage falls below these thresholds.

## What's Covered

Coverage includes:
- `app/**/*.{ts,tsx}` - All application code
- `components/**/*.{ts,tsx}` - All components
- `lib/**/*.{ts,tsx}` - All utility libraries

## What's Excluded

Coverage excludes:
- Test files (`**/*.test.{ts,tsx}`)
- Test directories (`**/__tests__/**`)
- Configuration files (`*.config.ts`)
- Build output (`dist/`, `.next/`)
- Node modules

## CI/CD Integration

The LCOV report (`coverage/lcov.info`) can be used with:
- **Codecov**: Upload coverage reports
- **Coveralls**: Track coverage over time
- **SonarQube**: Code quality analysis

Example GitHub Actions:

```yaml
- name: Run tests with coverage
  run: pnpm test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Tips

1. **Focus on critical paths**: Aim for 100% coverage on business logic
2. **Test edge cases**: Ensure branches are covered
3. **Ignore generated code**: Use coverage exclusions wisely
4. **Review HTML report**: Identify uncovered lines visually
5. **Track trends**: Monitor coverage over time

## Troubleshooting

### Coverage not generating?

Make sure `@vitest/coverage-v8` is installed:
```bash
pnpm add -D @vitest/coverage-v8
```

### Low coverage warnings?

Check the HTML report to see which files need more tests:
```bash
open coverage/index.html
```

### Coverage directory not in .gitignore?

The `coverage/` directory is already excluded in `.gitignore`.
