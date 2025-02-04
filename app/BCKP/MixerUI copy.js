"use client";

import { useState } from "react";
import { Button } from "@mui/material";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import Timeline from "./components/Timeline";

export default function MixerUI() {
  const [videos, setVideos] = useState([]);
  const [timelineVideos, setTimelineVideos] = useState([]);
  const [folderPath, setFolderPath] = useState("");
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [videoURLs, setVideoURLs] = useState({});

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
      setTimelineVideos((prev) => [...prev, { name: videoName, x: 50, width: 150 }]);
    }
  };

  return (
    <div className="flex h-screen p-4 bg-gray-100 font-mono text-gray-700">
      {/* Left Side - Browser & Thumbnail */}
      <div className="w-1/4 flex flex-col">
        {/* File Browser Panel */}
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col relative mb-4">
          <img src="/nite-labs-black.png" alt="Nite Labs Logo" className="w-32 h-auto mx-auto mb-6 block" />
          <Button
            variant="contained"
            style={{ backgroundColor: "#333", color: "white" }}
            onClick={openFileBrowser}
          >
            Select a Folder
          </Button>
          {folderPath && <p className="mt-2 text-xs text-gray-600 break-all">Full Path: {folderPath}</p>}
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
              <video className="w-full h-full object-contain" src={videoURLs[hoveredVideo]} muted autoPlay />
            ) : (
              <div className="w-full h-full bg-black"></div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Component */}
      <div className="flex-1" onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
        <Timeline timelineVideos={timelineVideos} setTimelineVideos={setTimelineVideos} />
      </div>
    </div>
  );
}
