import logo from "@/assets/logo-mamastock.png";

export default function MamaLogo({ width = 200, className = "animate-fade-in" }) {
  return (
    <img
      src={logo}
      alt="Logo MamaStock"
      width={width}
      className={`drop-shadow-[0_0_20px_rgba(255,210,0,0.8)] ${className}`}
    />
  );
}
