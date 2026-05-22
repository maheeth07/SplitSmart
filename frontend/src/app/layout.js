import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import SimulationController from "../components/SimulationController";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SplitSmart | Smart Expense Splitter & Debt Minimizer",
  description: "Effortlessly log group expenses, split shared bills, and simplify complex circular debts using our advanced greedy debt minimization algorithm.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col`}>
        <AuthProvider>
          {/* Toast Notification Config */}
          <Toaster 
            position="top-center" 
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0f172a',
                color: '#fff',
                borderRadius: '1rem',
                fontSize: '0.875rem',
                padding: '0.75rem 1.25rem',
                border: '1px solid #1e293b'
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff'
                }
              },
              error: {
                iconTheme: {
                  primary: '#f43f5e',
                  secondary: '#fff'
                }
              }
            }}
          />
          {/* Main Top Header Navigation */}
          <Navbar />
          {/* Floating Edge-Case Simulation Hub */}
          <SimulationController />
          {/* Viewport Content */}
          <main className="flex-grow flex flex-col pt-4">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
