"use client";

import React, { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";

const FrequencyAnalyzer = () => {
  const canvasRef = useRef(null);
  const draggableRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const gainRef = useRef(2); // overall visualization gain
  const eqNodesRef = useRef({ low: null, mid: null, high: null });

  // State variables
  const [gain, setGain] = useState(2);
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selection, setSelection] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // EQ state (in dB)
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    const options = { audio: true };

    const createStream = (stream) => {
      // Create a gain node for the incoming stream.
      const inputPoint = audioContext.createGain();
      const audioInput = audioContext.createMediaStreamSource(stream);
      audioInput.connect(inputPoint);

      // Create three EQ filters:
      const lowFilter = audioContext.createBiquadFilter();
      lowFilter.type = "lowshelf";
      lowFilter.frequency.value = 200;
      lowFilter.gain.value = eqLow;

      const midFilter = audioContext.createBiquadFilter();
      midFilter.type = "peaking";
      midFilter.frequency.value = 1000;
      midFilter.Q.value = 1;
      midFilter.gain.value = eqMid;

      const highFilter = audioContext.createBiquadFilter();
      highFilter.type = "highshelf";
      highFilter.frequency.value = 3000;
      highFilter.gain.value = eqHigh;

      // Save EQ filter nodes for later adjustment.
      eqNodesRef.current = { low: lowFilter, mid: midFilter, high: highFilter };

      // Connect the chain: input -> low -> mid -> high.
      inputPoint.connect(lowFilter);
      lowFilter.connect(midFilter);
      midFilter.connect(highFilter);

      // Connect to the analyser.
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 2048;
      highFilter.connect(analyserNode);

      // Visualization: use 64 frequency bins.
      const bufferLength = 64;
      const frequencyDataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameIdRef.current = requestAnimationFrame(draw);
        analyserNode.getByteFrequencyData(frequencyDataArray);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const canvasCtx = canvas.getContext("2d");

        // Clear canvas with a white background.
        canvasCtx.fillStyle = "white";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the frequency data as a black line.
        const scale = gainRef.current;
        canvasCtx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
          const x = (i / (bufferLength - 1)) * canvas.width;
          const y = canvas.height - Math.min(frequencyDataArray[i] * scale, canvas.height);
          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }
        }
        canvasCtx.strokeStyle = "black";
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();

        // Draw the selection rectangle (dark gray) if a selection exists.
        if (selection) {
          const startX = Math.min(selection.startX, selection.endX);
          const endX = Math.max(selection.startX, selection.endX);
          const width = endX - startX;
          canvasCtx.fillStyle = "darkgray";
          canvasCtx.fillRect(startX, 0, width, canvas.height);
        }
      };
      draw();
    };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(options)
        .then(createStream)
        .catch((err) => {
          console.error("Error accessing audio stream:", err);
        });
    } else {
      console.error("getUserMedia is not supported in this browser.");
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }
    };
  }, [isActive, eqLow, eqMid, eqHigh]); // re-run if EQ values change

  // Activation button handler.
  const handleActivate = () => {
    setIsActive(true);
  };

  // Overall gain handler.
  const handleGainChange = (e) => {
    const newGain = parseFloat(e.target.value);
    setGain(newGain);
    gainRef.current = newGain;
  };

  // EQ slider handlers.
  const handleEqLowChange = (e) => {
    const newVal = parseFloat(e.target.value);
    setEqLow(newVal);
    if (eqNodesRef.current.low) {
      eqNodesRef.current.low.gain.value = newVal;
    }
  };

  const handleEqMidChange = (e) => {
    const newVal = parseFloat(e.target.value);
    setEqMid(newVal);
    if (eqNodesRef.current.mid) {
      eqNodesRef.current.mid.gain.value = newVal;
    }
  };

  const handleEqHighChange = (e) => {
    const newVal = parseFloat(e.target.value);
    setEqHigh(newVal);
    if (eqNodesRef.current.high) {
      eqNodesRef.current.high.gain.value = newVal;
    }
  };

  // Canvas selection event handlers.
  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    setSelection({ startX, endX: startX });
    setIsSelecting(true);
  };

  const handleMouseMove = (e) => {
    if (!isSelecting || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    setSelection((prev) => prev ? { startX: prev.startX, endX: currentX } : null);
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  return (
    <Draggable
      nodeRef={draggableRef}
      handle=".draggable-header"
      onStart={() => setIsDragging(true)}
      onStop={() => setIsDragging(false)}
    >
      <div
        ref={draggableRef}
        style={{
          position: "absolute",
          zIndex: 1000,
          backgroundColor: "white",
          padding: "8px",
          borderRadius: "4px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          width: "320px",
          cursor: "default"
        }}
      >
        <div
          className="draggable-header"
          style={{
            backgroundColor: isDragging ? "black" : "lightgray",
            padding: "4px",
            borderRadius: "4px 4px 0 0",
            color: "white",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "8px",
            cursor: "move"
          }}
        >
          Incoming Audio Frequency
          {!isActive && (
            <button
              onClick={handleActivate}
              style={{
                position: "absolute",
                right: "4px",
                top: "4px",
                padding: "2px 4px",
                fontSize: "10px",
                backgroundColor: "darkgray",
                color: "white",
                border: "none",
                cursor: "pointer"
              }}
            >
              Activate
            </button>
          )}
        </div>
        <canvas
          ref={canvasRef}
          width={300}
          height={100}
          style={{ display: "block", margin: "0 auto", border: "1px solid #ccc" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div style={{ marginTop: "8px", textAlign: "center" }}>
          <label htmlFor="gain-slider" style={{ marginRight: "8px" }}>Gain:</label>
          <input
            id="gain-slider"
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={gain}
            onChange={handleGainChange}
          />
          <span style={{ marginLeft: "8px" }}>{gain.toFixed(1)}</span>
        </div>
        <div style={{ marginTop: "8px", textAlign: "center" }}>
          <div>
            <label htmlFor="eq-low" style={{ marginRight: "8px" }}>Low EQ:</label>
            <input
              id="eq-low"
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={eqLow}
              onChange={handleEqLowChange}
            />
            <span style={{ marginLeft: "8px" }}>{eqLow.toFixed(1)}</span>
          </div>
          <div>
            <label htmlFor="eq-mid" style={{ marginRight: "8px" }}>Mid EQ:</label>
            <input
              id="eq-mid"
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={eqMid}
              onChange={handleEqMidChange}
            />
            <span style={{ marginLeft: "8px" }}>{eqMid.toFixed(1)}</span>
          </div>
          <div>
            <label htmlFor="eq-high" style={{ marginRight: "8px" }}>High EQ:</label>
            <input
              id="eq-high"
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={eqHigh}
              onChange={handleEqHighChange}
            />
            <span style={{ marginLeft: "8px" }}>{eqHigh.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default FrequencyAnalyzer;
