# Convortex - Document Conversion & Digital Signature Tool

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-blue)](https://convortex.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.13-38B2AC)](https://tailwindcss.com/)

A modern web application for file conversion, image resizing, digital signature creation, and document management. Built with Next.js 15, TypeScript, and client-side processing for privacy and speed.

🌐 **Live Demo**: [https://convortex.vercel.app/](https://convortex.vercel.app/)

## 🌟 Features

### 📁 File Management
- **Upload & Organize**: Upload multiple file types with drag-and-drop support
- **Dashboard**: View, search, filter, and manage all your files
- **File Preview**: Preview images and documents before processing
- **Download**: Download processed files individually

### 🖼️ Image Processing
- **Resize Images**: Change dimensions while maintaining aspect ratio
- **Format Conversion**: Convert between JPG, PNG, WebP, GIF, BMP formats
- **Quality Control**: Adjust compression and quality settings
- **Batch Processing**: Process multiple images simultaneously

### ✍️ Digital Signatures
- **Canvas Drawing**: Create signatures with mouse or touch
- **Customization**: Choose pen color, size, and style
- **Export**: Save signatures as PNG images
- **Storage**: Store multiple signatures for reuse

### 🔄 File Conversion
- **PDF Operations**: Add watermarks, password protection, merge/split PDFs
- **Document Conversion**: Convert between various document formats
- **Image Conversion**: Transform images between different formats
- **Batch Conversion**: Process multiple files at once

### 👤 User Management
- **Local Authentication**: Secure login system with localStorage
- **Demo Account**: Try the app with a pre-configured demo account
- **User Profiles**: Manage personal information and file statistics
- **Session Management**: Automatic session handling

## 🚀 Technology Stack

### Frontend Framework
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript development
- **React 19** - Modern React with concurrent features

### Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **Geist Fonts** - Modern typography from Google Fonts
- **Heroicons** - Beautiful, consistent icon library
- **Framer Motion** - Smooth animations and transitions

### File Processing
- **PDF-lib** - Client-side PDF manipulation
- **Canvas API** - Image processing and resizing
- **FileReader API** - File upload and base64 conversion

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Turbopack** - Fast development bundler
- **Service Worker** - Offline functionality and caching

## 📱 Responsive Design

Fully responsive design optimized for all devices:
- **Mobile First**: Touch-friendly interfaces with proper touch targets
- **Tablet Support**: Optimized layouts for tablet screens
- **Desktop Experience**: Full-featured desktop interface
- **Cross-browser**: Compatible with all modern browsers

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/CodewithEvilxd/Convortex-.git
   cd Convortex-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Account
Use these credentials to try the application:
- **Email**: `demo@convert.com`
- **Password**: `demo123`

## 📁 Project Structure

```
Convortex-/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (main)/                   # Main application routes
│   │   │   ├── convert/              # File conversion page
│   │   │   ├── resize/               # Image resizing page
│   │   │   ├── signature/            # Signature creation page
│   │   │   ├── upload/               # File upload page
│   │   │   ├── dashboard/            # User dashboard
│   │   │   ├── layout.tsx            # Main layout with auth
│   │   │   └── page.tsx              # Redirect to dashboard
│   │   ├── api/                      # API routes
│   │   │   └── pdf/                  # PDF processing endpoints
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page redirect
│   ├── components/                   # Reusable components
│   │   ├── Auth/                     # Authentication components
│   │   │   ├── Auth.tsx              # Main auth component
│   │   │   ├── SignInForm.tsx        # Login form
│   │   │   └── SignUpForm.tsx        # Registration form
│   │   ├── Header.tsx                # Navigation header
│   │   ├── Footer.tsx                # Site footer
│   │   └── ui/                       # UI components
│   │       └── theme-provider.tsx    # Theme context
│   ├── context/                      # React contexts
│   │   ├── AuthContext.tsx           # Authentication state
│   │   └── FileContext.tsx           # File management state
│   ├── hooks/                        # Custom React hooks
│   │   └── mobile.ts                 # Mobile detection hook
│   ├── lib/                          # Utility libraries
│   │   └── utils.ts                  # General utilities
│   └── utils/                        # Application utilities
│       ├── authUtils.ts              # Authentication helpers
│       ├── conversionUtils.ts        # File conversion functions
│       └── fileUtils.ts              # File handling utilities
├── public/                           # Static assets
│   ├── sw.js                        # Service worker
│   ├── manifest.json                 # PWA manifest
│   ├── icon.png                      # App icon
│   └── *.svg                         # UI icons
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind CSS config
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```

## 🎯 Usage Guide

### Getting Started
1. **Sign In**: Use the demo account or create your own
2. **Upload Files**: Drag and drop files or click to browse
3. **Process Files**: Use various tools to convert, resize, or sign documents
4. **Manage Files**: View all files in your dashboard

### File Upload
- Supports images (JPG, PNG, GIF, WebP, BMP, SVG)
- Supports documents (PDF, DOCX, XLSX, TXT)
- Maximum file size: 50MB per file
- Multiple file upload supported

### Image Resizing
1. Select an image from your dashboard
2. Adjust width and height
3. Choose to maintain aspect ratio
4. Preview changes in real-time
5. Apply resize and download

### Digital Signatures
1. Go to the Signature page
2. Draw your signature on the canvas
3. Customize pen color and size
4. Name your signature
5. Save as PNG image

### File Conversion
1. Select files from your dashboard
2. Choose conversion type (PDF operations, format conversion, etc.)
3. Configure options (quality, format, etc.)
4. Process files individually or in batches
5. Download converted files

## 🔧 Configuration

### Environment Variables
The application uses localStorage for data persistence, so no environment variables are required for basic functionality.

### Service Worker
The app includes a service worker for:
- Offline file access
- Improved performance through caching
- Background sync capabilities

### Build Configuration
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on push
3. No additional configuration needed

### Other Platforms
The app can be deployed to any Node.js hosting platform:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Make your changes
4. Test thoroughly on different devices
5. Commit with descriptive messages
6. Push to your branch
7. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing code style and patterns
- Test on multiple browsers and devices
- Ensure responsive design works properly
- Add proper error handling

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [PDF-lib](https://pdf-lib.js.org/) - PDF manipulation
- [Heroicons](https://heroicons.com/) - Icon library
- [Geist Font](https://fonts.google.com/) - Typography

## 📞 Support

For questions or issues:
- Check the existing issues on GitHub
- Create a new issue with detailed information
- Ensure you're using the latest version

---

**Convortex** - Simple, fast, and secure file processing for everyone. 🌟
