"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@mui/material";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import Timeline from "./components/Timeline";

// Interaction Panel Component with Draggable Support
function InteractionPanel({ selectedVideo }) {
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  const handleMouseDown = (e) => {
    // Start dragging and record the offset from the top-left corner.
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
          backgroundColor: "#f0f0f0",
          padding: "5px",
          borderRadius: "4px",
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
          <h4>BPM</h4>
          <button>Kick</button>
          <button>Compass</button>
          <button>2 bars</button>
          <button>3 Bars</button>
        </div>

        {/* Frequency Column */}
        <div>
          <h4>Frequency</h4>
          <button>None</button>
          <button>Low</button>
          <button>Mid</button>
          <button>High</button>
        </div>

        {/* Falloff Column */}
        <div>
          <h4>Falloff</h4>
          <button>Flash</button>
          <button>.5 sec</button>
          <button>1 sec</button>
          {/* Fourth row left intentionally blank */}
        </div>

        {/* Blending Column */}
        <div>
          <h4>Blending</h4>
          <button>Addition</button>
          <button>Substract</button>
          <button>Multiply</button>
          <button>Divide</button>
        </div>
      </div>
    </div>
  );
}

export default function MixerUI() {
  const [videos, setVideos] = useState([]);
  const [timelineVideos, setTimelineVideos] = useState([]);
  const [folderPath, setFolderPath] = useState("");
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [videoURLs, setVideoURLs] = useState({});
  const [selectedTimelineVideo, setSelectedTimelineVideo] = useState(null);

  const openFileBrowser = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      let fullPath = handle.name;
      const files = [];
      const urls = {};

      for await (const entry of handle.values()) {
        if (entry.kind === "file" && entry.name.match(/\.(mp4|mov|avi|mkv)$/i)) {
          const file = await entry.getFile();
          const url = URL.createObjectURL(file);
          files.push({ name: entry.name, url });
          urls[entry.name] = url;
        }
      }
      setVideos(files);
      setVideoURLs(urls);
      setFolderPath(fullPath);
    } catch (error) {
      console.error("Directory selection was canceled or failed.", error);
    }
  };

  const handleDragStart = (event, videoName) => {
    event.dataTransfer.setData("text/plain", videoName);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const videoName = event.dataTransfer.getData("text/plain");
    if (videoName) {
      const newVideo = { name: videoName, x: 50, width: 150 };
      setTimelineVideos((prev) => [...prev, newVideo]);
      // Set the dropped video as the selected video to display in the panel.
      setSelectedTimelineVideo(newVideo);
    }
  };

  return (
    <div className="flex h-screen p-4 bg-gray-100 font-mono text-gray-700 relative">
      {/* Left Side - Browser & Thumbnail */}
      <div className="w-1/4 flex flex-col">
        {/* File Browser Panel */}
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col relative mb-4">
          <img
            src="/nite-labs-black.png"
            alt="Nite Labs Logo"
            className="w-32 h-auto mx-auto mb-6 block"
          />
          <Button
            variant="contained"
            style={{ backgroundColor: "#333", color: "white" }}
            onClick={openFileBrowser}
          >
            Select a Folder
          </Button>
          {folderPath && (
            <p className="mt-2 text-xs text-gray-600 break-all">
              Full Path: {folderPath}
            </p>
          )}
          <div className="flex-1 border p-2 rounded mt-2 overflow-y-auto max-h-64 relative">
            <ScrollArea className="h-full">
              {videos.map((video, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(event) => handleDragStart(event, video.name)}
                  className="p-2 cursor-pointer hover:bg-gray-200 rounded"
                  onMouseEnter={() => setHoveredVideo(video.name)}
                >
                  {video.name}
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>

        {/* Thumbnail Preview Panel */}
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col mt-2 h-80 border relative">
          <h2 className="text-lg font-bold mb-2">Thumbnail Preview</h2>
          <div className="border p-2 rounded flex items-center justify-center bg-gray-100 mx-auto w-full h-64">
            {hoveredVideo ? (
              <video
                className="w-full h-full object-contain"
                src={videoURLs[hoveredVideo]}
                muted
                autoPlay
              />
            ) : (
              <div className="w-full h-full bg-black"></div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Component */}
      <div
        className="flex-1"
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
      >
        <Timeline
          timelineVideos={timelineVideos}
          setTimelineVideos={setTimelineVideos}
          onSelectVideo={setSelectedTimelineVideo} // Timeline should call this when a video is selected
        />
      </div>

      {/* Interaction Panel (Draggable) - shows if a timeline video is selected */}
      {selectedTimelineVideo && (
        <InteractionPanel selectedVideo={selectedTimelineVideo} />
      )}
    </div>
  );
}
