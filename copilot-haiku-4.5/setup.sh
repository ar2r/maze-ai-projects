#!/bin/bash

# Quick setup script for Maze Runner

echo "🎮 Maze Runner - Setup"
echo ""

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
else
  echo "Dependencies already installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Commands:"
echo "  npm run dev     - Start development server (http://localhost:5173)"
echo "  npm run build   - Build for production"
echo "  npm run preview - Preview production build"
echo "  npm run test    - Run unit tests"
echo ""
echo "Debug Tips:"
echo "  - Add ?debug to URL to enable debug overlay"
echo "  - Press ~ to toggle debug overlay"
echo "  - Press P to pause game"
echo "  - Check browser console for logs"
echo ""
