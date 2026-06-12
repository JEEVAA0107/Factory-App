# Factory Flow Lite (Factory-App)

Factory Flow Lite is a comprehensive, mobile-ready factory management application designed to streamline operations, track inventory, assign production tasks, monitor worker productivity, and generate performance reports. 

Built using a modern web tech stack and packaged for mobile devices, it provides factory managers with real-time insight into their production lines.

## 🚀 Key Features

- **Dashboard**: High-level real-time indicators for today's production, active workers, inventory status, and pending orders.
- **Production Tracking**: Monitor active production runs, assign workers, update task progress, and manage production stages.
- **Inventory & Stock Management**: Real-time tracking of raw materials and finished goods, with easy-to-use forms for stock updates.
- **Order Control**: Manage incoming orders, track delivery dates, and link orders directly to production runs.
- **Worker Management**: Track worker attendance, register new employees, and monitor active task assignments.
- **Reports & Analytics**: Graphical insights and statistics on production efficiency, inventory consumption, and order completion rates.
- **Cross-Platform**: Run on the web or bundle as a native mobile application using Capacitor.

## 🛠️ Tech Stack

- **Frontend Core**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, CSS Variables, Shadcn UI Components
- **Routing & State**: React Router DOM, TanStack React Query
- **Database/Backend**: Firebase Integration (Auth, Firestore, etc.)
- **Mobile Packaging**: Capacitor CLI & Android SDK integration

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JEEVAA0107/Factory-App.git
   cd Factory-App
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   - Create a `.env` file in the root directory.
   - Use [.env.example](.env.example) as a template and fill in your Firebase configuration keys.

4. Start the local development server:
   ```bash
   npm run dev
   ```

## 📱 Mobile Build (Android)

To open or run the native Android project:

1. Build the production web files:
   ```bash
   npm run build
   ```

2. Copy the build outputs to the Android platform:
   ```bash
   npx cap sync
   ```

3. Open the Android project in Android Studio:
   ```bash
   npx cap open android
   ```
