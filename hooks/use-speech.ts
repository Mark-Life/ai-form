import { useCallback, useRef, useState } from "react";

export const useSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSpeech = useCallback(async (text: string) => {
    if (!text.trim()) {
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsLoading(true);
    setIsPlaying(false);

    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to generate speech: ${response.status} ${errorText}`
        );
      }

      const audioBlob = await response.blob();

      if (audioBlob.size === 0) {
        throw new Error("Empty audio blob received");
      }

      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);

      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, []);

  const stopSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  return {
    playSpeech,
    stopSpeech,
    isPlaying,
    isLoading,
  };
};
