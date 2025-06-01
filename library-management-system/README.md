<div align="center">
 <h1>📚 Library Management System</h1>
 <img src="https://img.shields.io/badge/Next.js-15.0.2-black"/>
 <img src="https://img.shields.io/badge/TypeScript-5.0.0-blue"/>
 <img src="https://img.shields.io/badge/License-MIT-green"/>
 <img src="https://img.shields.io/badge/Supabase-2.46.0-darkgreen"/>
 <img src="https://img.shields.io/badge/React-18.3.1-61DAFB"/>
</div>

A modern web-based library management system that helps libraries manage their collections and allows users to browse, borrow, and reserve books efficiently. Built with Next.js 15, TypeScript, and Supabase, featuring a clean and responsive UI powered by shadcn/ui components.



## ✨ Features

### 📚 Book Management
- Browse and search books by title, author, or ISBN
- Advanced filtering by categories
- Real-time book availability tracking
- Cover image management system
- Detailed book information pages

### 🔒 Security & Authentication
- Secure email/password authentication via Supabase
- Role-based access control
- Protected routes and API endpoints
- User profile management
- Session handling

### 📖 Borrowing System
- Intuitive book checkout process
- Automated due date management
- Book reservation queue
- Return processing
- Late return notifications
- Borrowing history tracking

### 💻 Modern UI/UX
- Responsive design for all devices
- Dark mode support
- Real-time updates
- Interactive toast notifications
- Loading states and error handling
- Clean and intuitive interface

## 🛠️ Tech Stack

### Frontend
![Next JS](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Backend & Database
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

### Tools & Utilities
- shadcn/ui - UI Components
- React Hook Form - Form handling
- Zod - Schema validation
- date-fns - Date manipulation
- ESLint - Code linting
- Prettier - Code formatting

## 🚀 Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/ChanMeng666/library-management-system.git
cd library-management-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configurations
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
└── ...configuration files
```

## 🤝 Contributing

We welcome contributions to improve the Library Management System! Here's how you can help:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure you follow our coding standards and include appropriate tests.

