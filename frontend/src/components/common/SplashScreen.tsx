import "./SplashScreen.css";

export default function SplashScreen() {
  return (
    <div className="splash">
      <div className="splash__ring" />
      <div className="splash__mark">
        <span className="splash__mark-text">AK</span>
      </div>
      <h1 className="splash__title">AK Textiles</h1>
      <p className="splash__tagline">Fabrics &amp; Fashion, delivered</p>
    </div>
  );
}
