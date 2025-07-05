# Publishing Guide

This document explains how to publish the `@kodeglot/node-python-eid-reader` package to npm.

## Pre-publishing Checklist

Before publishing, ensure:

1. ✅ **Code is complete and tested**
   - All functionality works as expected
   - Examples are working
   - TypeScript declarations are generated

2. ✅ **Package.json is properly configured**
   - Name: `@kodeglot/node-python-eid-reader`
   - Version: `1.0.0`
   - Main entry point: `dist/index.js`
   - Types: `dist/index.d.ts`
   - Files array includes only necessary files
   - Organization scope: `@kodeglot`

3. ✅ **Documentation is complete**
   - README.md is comprehensive
   - API documentation is clear
   - Examples are provided
   - Troubleshooting section is included

4. ✅ **Build is successful**
   - TypeScript compilation works
   - All files are in `dist/` directory

## Publishing Steps

### 1. Login to npm (if not already logged in)
```bash
npm login
```

### 2. Build the package
```bash
npm run build
```

### 3. Test the package locally (optional)
```bash
npm pack
npm install ./kodeglot-node-python-eid-reader-1.0.0.tgz
```

### 4. Publish to npm
```bash
npm publish
```

### 5. Verify the package
```bash
npm view @kodeglot/node-python-eid-reader
```

## Post-publishing

1. **Create a GitHub release** with the same version number
2. **Update the repository** with any final changes
3. **Test the published package** in a clean environment:
   ```bash
   npm install @kodeglot/node-python-eid-reader
   ```

## Version Management

For future updates:

1. **Patch version** (1.0.1): Bug fixes
2. **Minor version** (1.1.0): New features, backward compatible
3. **Major version** (2.0.0): Breaking changes

Update version in `package.json` before publishing.

## Package Contents

The published package includes:
- `dist/` - Compiled JavaScript and TypeScript declarations
- `README.md` - Documentation
- `LICENSE` - MIT License
- `examples/` - Usage examples

## Distribution

The package will be available:
- **npm**: `npm install @kodeglot/node-python-eid-reader`
- **GitHub**: Source code and releases

## Support

After publishing:
1. Monitor npm downloads and GitHub issues
2. Respond to user questions and bug reports
3. Plan future updates based on feedback 