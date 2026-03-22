# Blog Frontend

[![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.17-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A sophisticated blogging platform built with Next.js 16, featuring advanced MDX support, interactive visualizations (Excalidraw, Three.js, Chemistry), and comprehensive developer experience.

## ✨ Key Features

### 📝 Content Management

- **Advanced MDX** with type-safe processing via Contentlayer2
- **9 Categories**: Computer Science, Mathematics, Robotics, Chemistry, Music, Photography, Motor Control, Social, Tactile
- **Smart Search**: Kbar command palette with full-text search
- **Auto-Generated**: TOC, reading time, code highlighting, math rendering

### 🎨 Interactive Tools

- **🎨 Excalidraw**: Whiteboard drawing with export support
- **🧪 Chemistry**: 3D molecular visualization with 3Dmol.js
- **🎭 3D Graphics**: Three.js with URDF support for robotics
- **🎵 Music**: Notation display with Tone.js integration

### ⚡ Performance

- **⚡ Turbopack**: 5x faster builds than Webpack
- **🔄 Offline Support**: Service Worker with caching
- **📊 Bundle Analysis**: Built-in analyzer
- **🌙 Image Optimization**: AVIF/WebP with lazy loading

### 🌙 Theme & UX

- **🌙 Dark/Light**: System preference detection with smooth transitions
- **📱 Responsive**: Mobile-first with touch optimization
- **♿ Accessibility**: ARIA labels, keyboard navigation, reduced motion support
- **🌍 Internationalization**: i18next with automatic language detection

## 📚 Documentation

For comprehensive documentation, see the main project docs: **[Complete Documentation](../docs/)**

### Key Documents

- **[Frontend Architecture](../docs/development/concepts/frontend-architecture.md)** - Next.js project structure and architecture
- **[Refine Integration](../docs/development/guides/frontend-development/refine-integration.md)** - Refine framework integration guide
- **[Frontend Testing](../docs/development/guides/testing/frontend-testing.md)** - Testing strategies and coverage

### User Guides

- **[Content Management](../docs/guides/content-management.md)** - Creating and managing posts
- **[Writing Guide](../docs/guides/writing-guide.md)** - Markdown and component usage
- **[Admin Panel](../docs/guides/admin-panel.md)** - User and comment management

### Operations

- **[Performance Monitoring](../docs/development/operations/performance-monitoring.md)** - Frontend performance metrics
- **[Security Guide](../docs/development/operations/security-guide.md)** - Security best practices

---

## 🚀 Quick Start

### Requirements

- Node.js 18+
- pnpm 10.24.0+

### Installation

```bash
git clone https://github.com/zhengbiyong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

pnpm install
pnpm dev
# Open http://localhost:3000
```

## 📁 Tech Stack

### Core

- **Framework**: Next.js 16.0.10 (App Router + Turbopack)
- **Language**: TypeScript 5.9.3 (strict mode)
- **Styling**: Tailwind CSS 4.1.17
- **Animation**: Framer Motion 12.23.25 + GSAP

### Content

- **MDX**: Contentlayer2 0.5.8 with extensive plugin ecosystem
- **Search**: Pliny 0.4.1 with Kbar integration
- **Math**: KaTeX with remark-math
- **Syntax**: Prism Plus for code highlighting

### Visualizations

- **Excalidraw**: 0.18.0 for whiteboard drawing
- **3D**: Three.js 0.181.2 with @tresjs/core
- **Chemistry**: 3Dmol.js 2.1.0 for molecular visualization
- **Audio**: Tone.js 15.1.22 for audio synthesis

### Development

- **Testing**: Vitest 4.0.15 with React Testing Library
- **Documentation**: Storybook 10.1.9 for component showcase
- **Analytics**: Sentry 10.30.0 + Umami
- **Linting**: ESLint + Prettier with pre-commit hooks

## 🎯 Interactive Components

### Excalidraw

- Full whiteboard drawing tool at `/excalidraw`
- Export to PNG, SVG, JSON
- LocalStorage persistence
- Mobile-responsive design

### 3D Visualizations

- Multiple Three.js viewers
- URDF loader for robotics models
- Interactive controls with animations
- @tresjs/core for simplified usage

### Chemistry Tools

- Molecular structure visualization
- Support for PDB, SDF, XYZ, MOL formats
- mhchem integration for chemical formulas
- Auto-rotation and theme-aware rendering

### Music Features

- Music notation display (MusicXML)
- Audio synthesis with Tone.js
- Fullscreen music sheet viewer
- Interactive audio components

## 📊 Analytics & Monitoring

- **Error Tracking**: Sentry with performance monitoring
- **Visitor Analytics**: Umami with custom tracking
- **Article Analytics**: Reading time and engagement metrics
- **Bundle Analysis**: Built-in analyzer with `pnpm analyze`

## 🔧 Configuration

```bash
# Development
pnpm dev

# Build
pnpm build

# Analyze bundle
pnpm analyze

# Test
pnpm test

# Storybook
pnpm storybook
```

## 📝 Content Creation

### Add Blog Post

```bash
cd data/blog/[category]
touch new-post.mdx
```

```yaml
---
title: 'Your Post Title'
date: '2025-01-15'
summary: 'Brief description'
tags: ['tag1', 'tag2']
draft: false
---
```

### Use Interactive Features

```mdx
# Excalidraw drawing

import { ExcalidrawEmbed } from '@/components/Excalidraw/ExcalidrawEmbed'
<ExcalidrawEmbed id="drawing-id" />

# 3D Model

import { ThreeViewer } from '@/components/ThreeViewer'
<ThreeViewer modelPath="/models/robot.urdf" />

# Chemistry Structure

import { MoleculeViewer } from '@/components/chemistry/MoleculeViewer'
<MoleculeViewer structure="C1=CC=C" style="sphere" />
```

## 🎯 Component Development

### View Components

```bash
# Storybook
pnpm storybook
# Open http://localhost:6006
```

### Testing

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

## 🌟 Status

- **Version**: 2.3.0
- **Next.js**: 16.0.10 with Turbopack
- **Status**: Active development

### ✅ Implemented

- Multi-layout blog posts
- Tag system with auto-generated pages
- Advanced search with Kbar
- Excalidraw whiteboard integration
- Three.js 3D visualizations
- Chemistry molecular visualization
- Music notation display
- Dark/light theme support
- Comprehensive testing setup
- Storybook documentation
- Service Worker for offline support

### 📄 Know

- E2E tests: Setup available but not yet written
- PWA manifest: Service Worker active, needs manifest enhancement
- Performance monitoring: Configured but needs custom metrics implementation

## 🚀 Deployment

```bash
# Build
pnpm build

# Static export
EXPORT=1 pnpm build

# Deploy
rsync -avz out/ user@server:/path/to/deploy
```

## 📄 Support

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Tailwind CSS 4](https://tailwindcss.com/docs)
- [Contentlayer](https://contentlayer.dev/)
- [Framer Motion](https://www.framer.com/motion)
- [Excalidraw](https://excalidraw.com/)

---

<p align="center">
  <sub>Built with ❤️ by Zhengbi Yong</sub>
</p>
