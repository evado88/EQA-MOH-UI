# Trails Data Calibration UI - Vite + React Project

A fast, modern React setup powered by Vite for blazing‑fast development
and optimized builds.

## Project Structure (Example)

    project/
        public/
        src/
            assets/
            auth/
            components/
            context/
            navigation/
            pages/
            App.css    
            App.jsx
            main.jsx
        index.html
        package.json
        vite.config.js
        README.md

## Prerequisites

-   Node.js 16+
-   npm (comes bundled with Node.js)
-   Git (optional)

## 1. Installing Dependencies

Install all project dependencies using npm:

### UNIX & Windows

    npm install

This installs all packages listed in `package.json`.

## 2. Running the Development Server

Start the Vite development server:

### UNIX & Windows

    npm run dev

Your development server will be available at: http://localhost:5173\
(or whichever port Vite assigns)

## 3. Building the Project for Production

To generate optimized build files:

### UNIX & Windows

    npm run build

The compiled files will appear in the `dist/` folder.

## 4. Previewing the Production Build

To locally preview the production build:

### UNIX & Windows

    npm run preview

## 5. Adding New Dependencies

### Install a regular dependency:

    npm install package-name

### Install a development dependency:

    npm install package-name --save-dev

## 6. Updating Dependencies

To update packages to their latest allowed versions (per package.json):

    npm update

## Notes

-   Vite automatically handles Hot Module Replacement (HMR) during
    development.
-   Use environment variables by creating a `.env` or `.env.local` file.
-   Avoid directly modifying files inside `node_modules`.
-   For deploying, use the contents of the `dist/` folder after running
    `npm run build`.
