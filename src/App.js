import React, { useRef, useState } from "react";
import "./App.css";
import axios from "axios";

const API_URL = "https://detect.roboflow.com";
const API_KEY = "TJO7w2X6cISM1vh26Vgd";
const MODEL_FIRE_ID = "fire-dji3l/2";
const MODEL_EARTH_ID = "earthquake-dataset-oxnyc/1";
const MODEL_PEOPLE_ID = "people-detection-thermal/3";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [fireDetected, setFireDetected] = useState(false);
  const [earthquakeDetected, setEarthquakeDetected] = useState(false);
  const [detectionType, setDetectionType] = useState("fire");

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Camera access denied:", err));
  };

  const detectHazard = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("file", blob);

      const modelId = detectionType === "fire" ? MODEL_FIRE_ID : MODEL_EARTH_ID;
      
      try {
        const response = await axios.post(
          `${API_URL}/${modelId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${API_KEY}`,
            },
            params: {
              api_key: API_KEY,
            },
          }
        );

        const predictions = response.data.predictions || [];
        console.log("Detection results:", predictions);

        if (detectionType === "fire") {
          setFireDetected(predictions.length > 0);
          setEarthquakeDetected(false);
        } else {
          setEarthquakeDetected(predictions.length > 0);
          setFireDetected(false);
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        predictions.forEach((prediction) => {
          const { x, y, width, height, class: label } = prediction;
          context.strokeStyle = detectionType === "fire" ? "red" : "blue";
          context.lineWidth = 3;
          context.strokeRect(x - width / 2, y - height / 2, width, height);
          context.fillStyle = detectionType === "fire" ? "red" : "blue";
          context.font = "18px Arial";
          context.fillText(label, x, y - 10);
        });
      } catch (error) {
        console.error("Error detecting hazard:", error);
      }
    }, "image/jpeg");
  };

  return (
    <div className="App">
      <h1>{detectionType === "fire" ? "Live Fire Detection" : "Live Earthquake Detection"}</h1>
      <video ref={videoRef} autoPlay playsInline muted></video>
      <canvas ref={canvasRef}></canvas>
      <button onClick={startCamera}>Start Camera</button>
      <button onClick={detectHazard}>Detect {detectionType === "fire" ? "Fire" : "Earthquake"}</button>
      <button onClick={() => setDetectionType(detectionType === "fire" ? "earthquake" : "fire")}>
        Switch to {detectionType === "fire" ? "Earthquake" : "Fire"} Detection
      </button>
      <p className={fireDetected ? "fire" : earthquakeDetected ? "earthquake" : "safe"}>
        {fireDetected ? "🔥 Fire Detected!" : earthquakeDetected ? "🌍 Earthquake Detected!" : "✅ No Hazard"}
      </p>
    </div>
  );
}

export default App;
