"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Volume2, List, Sparkles, Loader2, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface VaniLivePodProps {
  posts: Post[];
  isOpen: boolean;
  onClose: () => void;
}

export default function VaniLivePod({ posts, isOpen, onClose }: VaniLivePodProps) {
  const { lang, t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentPost = posts[currentIndex];

  const playCurrent = async () => {
    if (!currentPost) return;
    setLoading(true);
    setPlaying(false);

    // Stop existing
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const text = `${currentPost.title}. ${currentPost.summary}`;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      const data = await res.json();

      if (data.audio) {
        const audio = new Audio(`data:${data.mimeType || "audio/wav"};base64,${data.audio}`);
        audio.onended = () => {
          if (currentIndex < posts.length - 1) {
            setCurrentIndex(prev => prev + 1);
          } else {
            setPlaying(false);
          }
        };
        audioRef.current = audio;
        audio.play();
        setPlaying(true);
      }
    } catch (error) {
      console.error("TTS failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !audioRef.current && !loading) {
       // Auto play first one when opened
       playCurrent();
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && audioRef.current) {
        playCurrent();
    }
  }, [currentIndex]);

  const togglePlay = () => {
    if (!audioRef.current) {
        playCurrent();
        return;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-xl"
    >
      <div className="bg-black text-white border-2 border-primary shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Progress Bar (Fake for now) */}
        <div className="h-1 bg-white/10 w-full">
            <motion.div 
                className="h-full bg-primary" 
                animate={{ width: playing ? "100%" : "0%" }}
                transition={{ duration: 60, ease: "linear" }}
            />
        </div>

        <div className="p-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/20 shrink-0 border border-primary/30 flex items-center justify-center relative overflow-hidden group">
             {currentPost?.imageUrl ? (
               <img src={currentPost.imageUrl} className="w-full h-full object-cover opacity-60" alt="" />
             ) : (
               <Sparkles className="w-6 h-6 text-primary" />
             )}
             {playing && (
                 <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                    {[1,2,3].map(i => (
                        <motion.div 
                            key={i}
                            animate={{ height: [4, 12, 4] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1 bg-primary"
                        />
                    ))}
                 </div>
             )}
          </div>

          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] font-inter font-black uppercase tracking-widest text-primary animate-pulse">Vani Live AI</span>
                <span className="text-[8px] font-inter opacity-40 uppercase tracking-widest">Article {currentIndex + 1}/{posts.length}</span>
             </div>
             <h4 className="text-xs font-newsreader font-bold truncate">
                {lang === 'hi' ? currentPost?.titleHi || currentPost?.title : currentPost?.title}
             </h4>
             <p className="text-[10px] font-inter opacity-40 truncate">
                {currentPost?.author} &bull; Newsreader Mode
             </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
             <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                className="hover:text-primary transition-colors"
                disabled={currentIndex === 0}
             >
                <SkipBack className="w-5 h-5" />
             </button>
             
             <button 
                onClick={togglePlay}
                className="w-10 h-10 bg-white text-black flex items-center justify-center hover:bg-primary hover:text-white transition-all"
             >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
             </button>

             <button 
                onClick={() => setCurrentIndex(prev => Math.min(posts.length - 1, prev + 1))}
                className="hover:text-primary transition-colors"
                disabled={currentIndex === posts.length - 1}
             >
                <SkipForward className="w-5 h-5" />
             </button>

             <div className="w-px h-8 bg-white/10 mx-1" />

             <button 
                onClick={onClose}
                className="hover:text-red-500 transition-colors"
             >
                <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Playlist Toggle */}
        <button 
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="w-full py-1.5 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-[8px] font-inter font-black uppercase tracking-widest transition-colors"
        >
            <List className="w-3 h-3" /> {showPlaylist ? "Hide Playlist" : "Show Playlist"}
        </button>

        <AnimatePresence>
            {showPlaylist && (
                <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white/5"
                >
                    <div className="p-2 max-h-48 overflow-y-auto">
                        {posts.map((post, i) => (
                            <button 
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={cn(
                                    "w-full p-3 flex items-center gap-3 text-left transition-colors border-l-2",
                                    currentIndex === i ? "bg-primary/10 border-primary" : "hover:bg-white/5 border-transparent"
                                )}
                            >
                                <span className={cn("text-[10px] font-inter font-bold", currentIndex === i ? "text-primary" : "opacity-30")}>
                                    {String(i + 1).padStart(2, '0')}
                                0</span>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-[10px] font-inter font-bold truncate", currentIndex === i ? "text-white" : "text-white/60")}>
                                        {lang === 'hi' ? post.titleHi || post.title : post.title}
                                    </p>
                                    <p className="text-[8px] font-inter opacity-40 uppercase tracking-tighter">
                                        {post.category} &bull; {post.readingTimeMin} min read
                                    </p>
                                </div>
                                {currentIndex === i && playing && <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 bg-primary rounded-full" />}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
