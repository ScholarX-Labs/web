import WarpDriveShader from "@/components/ui/warp-drive-shader";

export default function DemoOne() {
  return <div className="app-container">
      <WarpDriveShader />
      <div className="overlay-content">
        <h1 className="title">Warp Drive</h1>
        <p className="description">An Interactive WebGL Shader</p>
      </div>
    </div>
}
