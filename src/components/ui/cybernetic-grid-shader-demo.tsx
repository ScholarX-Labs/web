import CyberneticGridShader from "@/components/ui/cybernetic-grid-shader";

export default function DemoOne() {
  return <div className="app-container">
      <CyberneticGridShader />
      <div className="overlay-content">
        <h1 className="title">Cybernetic Grid</h1>
        <p className="description">An Interactive WebGL Shader</p>
      </div>
    </div>
}
