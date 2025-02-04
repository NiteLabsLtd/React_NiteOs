"use client";

import { useState, useEffect, useRef } from "react";

export default function InteractionPanel({ selectedVideo }) {
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

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

  // Style for the column headers in the options grid.
  const headerStyle = {
    backgroundColor: "#f0f0f0",
    padding: "5px",
    borderRadius: "4px",
    textAlign: "center",
    marginBottom: "5px"
  };

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
          <strong>File Name:</strong> {selectedVideo.name}
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
          <button>Kick</button>
          <button>Compass</button>
          <button>2 bars</button>
          <button>3 Bars</button>
        </div>
        {/* Frequency Column */}
        <div>
          <h4 style={headerStyle}>Frequency</h4>
          <button>None</button>
          <button>Low</button>
          <button>Mid</button>
          <button>High</button>
        </div>
        {/* Falloff Column */}
        <div>
          <h4 style={headerStyle}>Falloff</h4>
          <button>Flash</button>
          <button>.5 sec</button>
          <button>1 sec</button>
          {/* Fourth row left intentionally blank */}
        </div>
        {/* Blending Column */}
        <div>
          <h4 style={headerStyle}>Blending</h4>
          <button>Addition</button>
          <button>Substract</button>
          <button>Multiply</button>
          <button>Divide</button>
        </div>
      </div>
    </div>
  );
}
