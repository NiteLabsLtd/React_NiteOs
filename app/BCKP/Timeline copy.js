import { useState, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Rnd } from "react-rnd";

export default function Timeline({ timelineVideos, setTimelineVideos }) {
  const { setNodeRef } = useDroppable({ id: "timeline" });
  const [videoPositions, setVideoPositions] = useState({});
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const scrollContainerRef = useRef(null);
  const timelineWidth = 1000;
  const timeInterval = 50;
  const playheadSpeed = 2;

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayheadPosition((prev) => (prev < timelineWidth ? prev + playheadSpeed : 0));
        setElapsedTime((prev) => (prev < timelineWidth / playheadSpeed ? prev + timeInterval / 1000 : 0));
      }, timeInterval);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

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

  const handleDragStop = (videoName, position) => {
    setVideoPositions((prev) => ({
      ...prev,
      [videoName]: { ...prev[videoName], x: position.x },
    }));
  };

  const handleResizeStop = (videoName, size) => {
    setVideoPositions((prev) => ({
      ...prev,
      [videoName]: { ...prev[videoName], width: size.width },
    }));
  };

  const handleTimelineClick = (event) => {
    if (!event.target.closest(".video-item") && event.target.classList.contains("timeline-area")) {
      setSelectedVideo(null);
      const rect = event.currentTarget.getBoundingClientRect();
      const newPlayheadPosition = event.clientX - rect.left;
      setPlayheadPosition(newPlayheadPosition);
      setElapsedTime((newPlayheadPosition / timelineWidth) * (timelineWidth / playheadSpeed));
    }
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

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div 
      ref={setNodeRef} 
      className="relative bg-white p-4 w-3/4 h-80 border-t flex flex-col justify-between overflow-hidden mx-auto"
      onDrop={handleDrop} 
      onDragOver={handleDragOver}
      onClick={handleTimelineClick}
    >
      {/* Timer Display */}
      <div className="text-center text-lg font-bold text-gray-700 mb-2">
        Time Elapsed: {elapsedTime.toFixed(1)}s
      </div>

      {/* Scrollable Timeline Container */}
      <div 
        className="relative flex-1 overflow-x-auto overflow-y-hidden"
        ref={scrollContainerRef} 
        style={{ whiteSpace: "nowrap", maxHeight: timelineVideos.length > 3 ? "auto" : "100%" }}
      >
        {/* Time Ruler */}
        <div className="absolute top-0 left-0 h-6 bg-gray-400 flex text-black text-xs p-1" style={{ width: `${timelineWidth}px` }}>
          {[...Array(Math.floor(timelineWidth / playheadSpeed))].map((_, i) => (
            <div key={i} className="w-20 text-center border-r border-gray-600" style={{ left: `${i * playheadSpeed}px` }}>
              {(i * playheadSpeed / 100).toFixed(1)}s
            </div>
          ))}
        </div>
        
        {/* Playhead */}
        <div
          className="absolute top-6 bottom-6 w-1 bg-orange-500 cursor-pointer"
          style={{ left: `${playheadPosition}px` }}
        />
        
        {/* Timeline Videos */}
        <div className="mt-6 relative h-full timeline-area" style={{ width: `${timelineWidth}px`, overflowY: timelineVideos.length > 3 ? "scroll" : "hidden" }}>
          {timelineVideos.map((video, index) => (
            <Rnd
              key={index}
              default={{
                x: video.x,
                y: 20 + index * 35,
                width: video.width,
                height: 30,
              }}
              bounds="parent"
              dragAxis="x"
              enableResizing={{ left: true, right: true }}
              onDragStop={(e, d) => handleDragStop(video.name, d)}
              onResizeStop={(e, direction, ref, delta, position) =>
                handleResizeStop(video.name, { width: ref.offsetWidth, x: position.x })}
              onClick={(e) => { e.stopPropagation(); setSelectedVideo(video.name); }}
              className={`absolute bg-gray-600 text-white text-xs p-1 rounded cursor-pointer shadow-md video-item ${selectedVideo === video.name ? 'border-2 border-red-500' : ''}`}
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
