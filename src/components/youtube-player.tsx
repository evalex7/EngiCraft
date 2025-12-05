
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";

type YoutubePlayerProps = {
  videoId: string;
  startTime?: number;
  onEnded?: () => void;
};

// Function to parse time string (e.g., "1m30s", "90s", "90") into seconds
const parseTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  let totalSeconds = 0;
  const minutesMatch = timeStr.match(/(\d+)\s*m/);
  const secondsMatch = timeStr.match(/(\d+)\s*s/);
  
  if (minutesMatch) {
    totalSeconds += parseInt(minutesMatch[1], 10) * 60;
  }
  
  // Regex to capture seconds that are not preceded by minutes
  const secondsOnlyMatch = timeStr.match(/(?<!m\s*)(\d+)\s*s/);
  const numberOnlyMatch = timeStr.match(/^\d+$/);

  if (secondsOnlyMatch) {
    totalSeconds += parseInt(secondsOnlyMatch[1], 10);
  } else if (numberOnlyMatch && !minutesMatch) {
    totalSeconds += parseInt(numberOnlyMatch[0], 10);
  } else if (minutesMatch && secondsMatch) {
    // handles "1m30s" case where seconds are after minutes
    const secondsPart = timeStr.split('m')[1] || '';
    const secMatch = secondsPart.match(/(\d+)/);
    if(secMatch) totalSeconds += parseInt(secMatch[1], 10);
  }


  return totalSeconds;
};

export function YoutubePlayer({ videoId, startTime = 0, onEnded }: YoutubePlayerProps) {
  const [timestamp, setTimestamp] = useState(startTime);
  const [timeInput, setTimeInput] = useState("");
  const [playerKey, setPlayerKey] = useState(`${videoId}-${startTime}`); // Key to force re-render iframe

  const videoSrc = `https://www.youtube.com/embed/${videoId}?start=${timestamp}&autoplay=1&rel=0`;

  const handleJumpToTime = () => {
    const newTime = parseTime(timeInput);
    setTimestamp(newTime);
    setPlayerKey(`${videoId}-${newTime}-${Date.now()}`); // Ensure key is unique
  };
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleJumpToTime();
    }
  };


  useEffect(() => {
    setTimestamp(startTime);
    setPlayerKey(`${videoId}-${startTime}`);
  }, [videoId, startTime]);

  return (
    <div className="space-y-2 rounded-lg border p-4 bg-muted/30 relative">
      {onEnded && (
         <Button variant="ghost" size="icon" onClick={onEnded} className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-secondary text-secondary-foreground z-10">
            <X className="h-4 w-4" />
            <span className="sr-only">Закрити плеєр</span>
        </Button>
      )}
      <div className="aspect-video w-full overflow-hidden rounded-md border">
        <iframe
          key={playerKey}
          width="100%"
          height="100%"
          src={videoSrc}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      <div className="flex w-full max-w-sm items-center space-x-2 pt-2">
        <Input
          type="text"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Перейти до часу (напр. 1m30s)"
        />
        <Button type="button" onClick={handleJumpToTime} size="icon">
          <Send className="h-4 w-4" />
          <span className="sr-only">Перейти</span>
        </Button>
      </div>
    </div>
  );
}
