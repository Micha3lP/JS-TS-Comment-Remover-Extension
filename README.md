# Remove Comments

A Visual Studio Code extension that removes all comments from TypeScript and JavaScript files.

## Features

- Remove comments from the current open file
- Remove comments from multiple selected files in the Explorer
- Supports TypeScript (.ts, .tsx) and JavaScript (.js, .jsx) files
- Preserves code formatting and structure
- Uses TypeScript's scanner for accurate comment detection

## Installation

1. Download the `.vsix` file from the releases
2. In VS Code, go to Extensions > Install from VSIX...
3. Select the downloaded file

Alternatively, you can package it yourself:

```bash
npm install
npm run compile
vsce package
```

Then install the generated `.vsix` file.

## Usage

### Remove Comments from Current File

- Right-click in an open TypeScript or JavaScript file
- Select "Remove Comments" from the context menu

### Remove Comments from Selected Files

- Select one or more TypeScript/JavaScript files in the Explorer
- Right-click and select "Remove Comments"

The extension will process the files and remove all single-line (`//`) and multi-line (`/* */`) comments, preserving the code structure and formatting.

## Requirements

- Visual Studio Code 1.74.0 or higher

## Development

To develop this extension:

1. Clone the repository
2. Run `npm install`
3. Open in VS Code
4. Press F5 to launch extension development host

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.