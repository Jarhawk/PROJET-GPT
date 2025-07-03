// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    const { message = "Une erreur est survenue. Merci de réessayer." } =
      this.props;
    if (this.state.hasError) {
      return <div className="p-4 text-red-500">{message}</div>;
    }
    return this.props.children;
  }
}
