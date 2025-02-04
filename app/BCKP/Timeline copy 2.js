import { useState, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Rnd } from "react-rnd";

export default function Timeline({ timelineVideos, setTimelineVideos }) {
  const { setNodeRef } = useDroppable({ id: "timeline" });
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const scrollContainerRef = useRef(null);
  const timelineWidth = 1000;
  const timeInterval = 50;
  const playheadSpeed = 2;
  const rowHeight = 40;

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + timeInterval / 1000);
        setPlayheadPosition((elapsedTime / 120) * timelineWidth);
      }, timeInterval);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, elapsedTime]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Delete" && selectedVideo) {
        setTimelineVideos((prev) => prev.filter((video) => video.name !== selectedVideo));
        setSelectedVideo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVideo, setTimelineVideos]);

  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
    const ms = String(Math.floor((seconds % 1) * 100)).padStart(2, '0');
    return `${hrs}:${mins}:${secs}:${ms}`;
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const videoName = event.dataTransfer.getData("videoName");
    if (videoName) {
      setTimelineVideos((prev) => {
        const lastVideo = prev[prev.length - 1];
        const newX = lastVideo ? lastVideo.x + lastVideo.width + 10 : 50;
        return [...prev, { name: videoName, x: newX, width: 150 }];
      });
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      className="relative bg-white p-4 w-3/4 h-80 border-t flex flex-col justify-between overflow-hidden mx-auto"
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
    >
      {/* Timer Display */}
      <div className="text-center text-lg font-bold text-gray-700 mb-2">
        Time Elapsed: {formatTime(elapsedTime)}
      </div>

      {/* Scrollable Timeline Container */}
      <div 
        className="relative flex-1 overflow-x-auto overflow-y-hidden"
        ref={scrollContainerRef} 
        style={{ whiteSpace: "nowrap" }}
      >
        {/* Time Ruler */}
        <div className="absolute top-0 left-0 h-6 bg-gray-400 flex text-black text-xs p-1 time-ruler" style={{ width: `${timelineWidth}px` }}>
          {[...Array(13)].map((_, i) => (
            <div key={i} className="w-80 text-center border-r border-gray-600">
              {i === 0 ? "0s" : i < 6 ? `${i * 10}s` : `${Math.floor(i / 6)}m ${i % 6 * 10}s`}
            </div>
          ))}
        </div>
        
        {/* Playhead */}
        <div
          className="absolute top-6 bottom-6 w-1 bg-orange-500 cursor-pointer"
          style={{ left: `${playheadPosition}px` }}
        />
        
        {/* Timeline Videos */}
        <div className="mt-6 relative h-full timeline-area" style={{ width: `${timelineWidth}px` }}>
          {timelineVideos.map((video, index) => (
            <Rnd
              key={index}
              default={{
                x: video.x,
                y: 20 + index * rowHeight,
                width: video.width,
                height: 30,
              }}
              bounds="parent"
              dragAxis="x"
              enableResizing={{ left: true, right: true }}
              onClick={() => setSelectedVideo(video.name)}
              className={`absolute bg-gray-600 text-white text-xs p-1 rounded cursor-pointer shadow-md ${selectedVideo === video.name ? 'border-2 border-red-500' : ''}`}
            >
              {video.name}
            </Rnd>
          ))}
        </div>
      </div>
      
      {/* Playback Controls at the Bottom */}
      <div className="flex justify-center gap-4 p-2 bg-gray-300 text-black text-sm">
        <button onClick={() => setIsPlaying(true)}>▶ Play</button>
        <button onClick={() => setIsPlaying(false)}>⏸ Pause</button>
        <button onClick={() => { setIsPlaying(false); setPlayheadPosition(0); setElapsedTime(0); }}>⏹ Stop</button>
      </div>
    </div>
  );
}
