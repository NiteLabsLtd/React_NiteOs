"use client";

import { useState, useEffect, useRef } from "react";

export default function InteractionPanel({ selectedVideo }) {
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  // State to track the selected option for each column.
  const [selectedOptions, setSelectedOptions] = useState({
    bpm: 0,
    frequency: 0,
    falloff: 0,
    blending: 0,
  });

  // Option arrays for each column.
  const bpmOptions = ["Kick", "Compass", "2 bars", "3 Bars"];
  const frequencyOptions = ["None", "Low", "Mid", "High"];
  const falloffOptions = ["Flash", ".5 sec", "1 sec"];
  const blendingOptions = ["Addition", "Substract", "Multiply", "Divide"];

  // Handle the dragging of the panel.
  const handleMouseDown = (e) => {
    setDragging(true);
    setOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPos({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, offset]);

  // Handle option selection for a given column.
  const handleOptionClick = (column, index) => {
    setSelectedOptions((prev) => ({ ...prev, [column]: index }));
  };

  // Use a consistent light gray (#f0f0f0) for header backgrounds.
  const headerStyle = {
    backgroundColor: "#f0f0f0",
    padding: "5px",
    borderRadius: "4px",
    textAlign: "center",
    marginBottom: "5px",
  };

  // Style function for option buttons.
  const optionButtonStyle = (selected) => ({
    display: "block",
    width: "100%",
    marginBottom: "5px",
    backgroundColor: selected ? "#555" : "#fff",
    color: selected ? "#fff" : "#000",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: "pointer",
    padding: "5px",
  });

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        top: pos.y,
        left: pos.x,
        zIndex: 1000,
        width: "400px",
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0px 0px 10px rgba(0,0,0,0.3)",
        padding: "10px",
        top: "60%",
        left: "40%",
      }}
    >
      {/* Drag Handle */}
      <div
        style={{
          cursor: "move",
          marginBottom: "10px",
          backgroundColor: dragging ? "#000" : "#f0f0f0",
          padding: "5px",
          borderRadius: "4px",
          color: dragging ? "#fff" : "#000",
        }}
        onMouseDown={handleMouseDown}
      >
        <strong>Interaction Panel</strong>
      </div>

      {/* File Information */}
      <div>
        <p>
          <strong>File Name:</strong>{" "}
          {selectedVideo && selectedVideo.name ? selectedVideo.name : ""}
        </p>
      </div>

      {/* Options Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
        }}
      >
        {/* BPM Column */}
        <div>
          <h4 style={headerStyle}>BPM</h4>
          {bpmOptions.map((option, index) => (
            <button
              key={option}
              style={optionButtonStyle(selectedOptions.bpm === index)}
              onClick={() => handleOptionClick("bpm", index)}
            >
              {option}
            </button>
          ))}
        </div>
        {/* Frequency Column */}
        <div>
          <h4 style={headerStyle}>Frequency</h4>
          {frequencyOptions.map((option, index) => (
            <button
              key={option}
              style={optionButtonStyle(selectedOptions.frequency === index)}
              onClick={() => handleOptionClick("frequency", index)}
            >
              {option}
            </button>
          ))}
        </div>
        {/* Falloff Column */}
        <div>
          <h4 style={headerStyle}>Falloff</h4>
          {falloffOptions.map((option, index) => (
            <button
              key={option}
              style={optionButtonStyle(selectedOptions.falloff === index)}
              onClick={() => handleOptionClick("falloff", index)}
            >
              {option}
            </button>
          ))}
        </div>
        {/* Blending Column */}
        <div>
          <h4 style={headerStyle}>Blending</h4>
          {blendingOptions.map((option, index) => (
            <button
              key={option}
              style={optionButtonStyle(selectedOptions.blending === index)}
              onClick={() => handleOptionClick("blending", index)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
