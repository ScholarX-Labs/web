import DigitalPetalsShader from "@/components/ui/digital-petals-shader";

export default function DemoOne() {
  return  <div className="app-container">
      <DigitalPetalsShader />
      <div className="overlay-content">
        <h1 className="title">Digital Petals</h1>
        <p className="description">An Interactive WebGL Shader</p>
      </div>
    </div>
}
