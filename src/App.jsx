import Router from "@/router";
import { AuthProvider } from "@/context/AuthContext";
import { HelpProvider } from "@/context/HelpProvider";
import { MultiMamaProvider } from "@/context/MultiMamaContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import { Toaster } from "react-hot-toast";


export default function App() {
  return (
    <AuthProvider>
      <HelpProvider>
        <MultiMamaProvider>
          <ThemeProvider>
            <Toaster position="top-right" />
            <Router />
          </ThemeProvider>
        </MultiMamaProvider>
      </HelpProvider>
    </AuthProvider>
  );
}

