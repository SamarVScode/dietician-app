# Dietician App

## Project Structure
- /dashboard  → React Admin Web App
- /mobile     → React Native Expo Mobile App
- /functions  → Firebase Cloud Functions
- /shared     → Shared types and constants

## Getting Started

### Dashboard
cd dashboard && npm install && npm run dev

### Mobile
cd mobile && npm install && npx expo start

### Functions
cd functions && npm install && npm run serve

## Environment Setup
Copy .env.example to .env in each folder
Fill in your Firebase project credentials
Add Anthropic API key in functions/.env

## Build Android APK
cd mobile
npm run build:apk
Download APK from Expo dashboard
