import defaultLogo from "@/assets/logo-mamastock.png";
import { useTheme } from "@/context/ThemeProvider";

export default function MamaLogo({ width = 200, className = "animate-fade-in" }) {
  const { logo } = useTheme();
  return (
    <img
      src={logo || defaultLogo}
      alt="Logo MamaStock"
      width={width}
      className={`drop-shadow-[0_0_20px_rgba(255,210,0,0.8)] ${className}`}
    />
  );
}
