# Change This

**Change This** is a powerful Chrome Extension designed for developers and testers. It allows you to intercept web requests and perform dynamic string replacements in URLs before they are sent. 

This is particularly useful for:
- Redirecting production API calls to a local development server.
- Testing different environments without changing code.
- Debugging URL routing issues.

## Features

- 🔄 **Pattern Matching**: Replace specific parts of a URL using simple string matching.
- 🚀 **Seamless Redirection**: Requests are modified on-the-fly using `declarativeNetRequest`.
- ⚡ **Lightweight**: Minimal performance impact.

## Installation

### From Source (Developer Mode)

1. Clone the repository:
   ```bash
   git clone https://github.com/trueartisans/change-this.git
   cd change-this
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Load into Chrome:
   - Open specific url `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the `dist` folder generated in step 3.

## Usage

1. Click the extension icon in your browser toolbar.
2. Enter the **Target String** you want to find in URLs (e.g., `api.production.com`).
3. Enter the **Replacement String** (e.g., `localhost:3000`).
4. Toggle the switch to **Enable** the extension.
5. All matching requests will now be redirected automatically!

## Technologies Used

- **React 19** - UI Component library
- **TypeScript** - Type safety
- **Vite** - Build tool and bundler
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI primitives
- **Chrome Extension Manifest V3** - Modern extension architecture

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
