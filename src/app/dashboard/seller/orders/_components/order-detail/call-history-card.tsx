'use client';

import { useTranslations } from 'next-intl';
import { PhoneCall, CheckCircle, Phone, Clock3, XCircle, Play, Pause, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { UserRole } from '@/lib/db/models/user';
import { useState, useRef, useEffect, useCallback } from 'react';
import { getAccessToken } from '@/app/actions/cookie';
import { toast } from 'sonner';

interface CallHistoryCardProps {
  order: any;
  formatDate: (date: Date | string) => string;
  userRole?: UserRole;
}

export default function CallHistoryCard({ order, formatDate, userRole }: CallHistoryCardProps) {
  const t = useTranslations('orders');
  
  // Audio player state
  const [playingRecording, setPlayingRecording] = useState<string | null>(null);
  const [loadingRecording, setLoadingRecording] = useState<string | null>(null);
  const [downloadingRecording, setDownloadingRecording] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [isSeekingMap, setIsSeekingMap] = useState<Map<string, boolean>>(new Map());
  const [loadedRecording, setLoadedRecording] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Check if user is admin or moderator
  const isAdminOrModerator = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;

  const getCallStatusConfig = (status: string) => {
    const configs = {
      answered: { label: t('callStatuses.answered'), className: 'border-primary bg-primary/10', icon: CheckCircle },
      unreached: { label: t('callStatuses.unreached'), className: 'border-muted-foreground bg-muted/10', icon: Phone },
      busy: { label: t('callStatuses.busy'), className: 'border-muted-foreground bg-muted/10', icon: Clock3 },
      invalid: { label: t('callStatuses.invalid'), className: 'border-destructive bg-destructive/10', icon: XCircle },
    };
    return configs[status as keyof typeof configs] || configs.unreached;
  };

  // Helper function to update buffered progress
  const updateBufferedProgress = (audio: HTMLAudioElement) => {
    try {
      if (audio.buffered && audio.buffered.length > 0) {
        // Get the end time of the last buffered range
        const bufferedEndTime = audio.buffered.end(audio.buffered.length - 1);
        setBufferedEnd(bufferedEndTime);
      }
    } catch (error) {
      // Buffered ranges might not be available yet
      console.debug('Buffered ranges not available:', error);
    }
  };

  // Audio player functions
  const handlePlayRecording = async (recordingId: string) => {
    if (!isAdminOrModerator) return;
    
    try {
      // If this recording is already loaded but paused, just resume
      if (loadedRecording === recordingId && audioRef.current) {
        audioRef.current.play().catch(console.error);
        setPlayingRecording(recordingId);
        setLoadingRecording(null);
        return;
      }
      
      setLoadingRecording(recordingId);
      
      // Stop currently playing audio if different recording
      if (audioRef.current && loadedRecording !== recordingId) {
        audioRef.current.pause();
        audioRef.current = null;
        setLoadedRecording(null);
      }
      
      // If clicking the same recording that's playing, stop it
      if (playingRecording === recordingId) {
        setPlayingRecording(null);
        setLoadingRecording(null);
        setCurrentTime(0);
        setDuration(0);
        setBufferedEnd(0);
        setLoadedRecording(null);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        return;
      }

      const jwt = await getAccessToken();
      if(!jwt) return toast("Unauthorized")

      
      // Fetch the recording
      const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/orders/recording/${order._id}/${recordingId}`,{
        headers:{
          "authorization":`Bearer ${jwt}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recording');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setLoadedRecording(recordingId);
      
      // Audio event listeners
      audio.addEventListener('loadedmetadata', () => {
        // Only set duration if it's finite
        if (isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
      });
      
      audio.addEventListener('loadeddata', () => {
        setLoadingRecording(null);
        setPlayingRecording(recordingId);
        audio.play().catch(console.error);
      });
      
      audio.addEventListener('timeupdate', () => {
        if (!isSeekingMap.get(recordingId) && isFinite(audio.currentTime)) {
          setCurrentTime(audio.currentTime);
        }
        // Update buffered progress
        updateBufferedProgress(audio);
      });
      
      audio.addEventListener('progress', () => {
        updateBufferedProgress(audio);
      });
      
      audio.addEventListener('ended', () => {
        setPlayingRecording(null);
        setCurrentTime(0);
        setDuration(0);
        setBufferedEnd(0);
        setLoadedRecording(null);
        URL.revokeObjectURL(audioUrl);
      });
      
      audio.addEventListener('error', () => {
        setLoadingRecording(null);
        setPlayingRecording(null);
        setCurrentTime(0);
        setDuration(0);
        setBufferedEnd(0);
        setLoadedRecording(null);
        URL.revokeObjectURL(audioUrl);
      });
      
    } catch (error) {
      console.error('Error playing recording:', error);
      setLoadingRecording(null);
      setPlayingRecording(null);
      toast.error("Failed to play recording");
    }
  };

  const handlePauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingRecording(null);
      // Keep loadedRecording and other states for resume functionality
    }
  };

  const handleSeekChange = (recordingId: string, value: number[]) => {
    const newTime = value[0];
    
    // Validate the time value before setting
    if (isNaN(newTime) || !isFinite(newTime)) return;
    
    setCurrentTime(newTime);
    
    if (audioRef.current) {
      try {
        // Get the effective duration - either from audio element or stored recording
        const effectiveDuration = isFinite(audioRef.current.duration) 
          ? audioRef.current.duration 
          : order.callAttempts?.find((attempt: any) => attempt.recording?.recordingId === recordingId)?.recording?.duration || 0;
        
        if (effectiveDuration > 0) {
          const clampedTime = Math.max(0, Math.min(newTime, effectiveDuration));
          
          // Simply try to seek - browser will handle buffering
          audioRef.current.currentTime = clampedTime;
        }
      } catch (error) {
        console.warn('Cannot seek in this audio:', error);
      }
    }
  };

  const handleSeekStart = (recordingId: string) => {
    setIsSeekingMap(prev => new Map(prev).set(recordingId, true));
  };

  const handleSeekEnd = (recordingId: string) => {
    setIsSeekingMap(prev => new Map(prev).set(recordingId, false));
  };

  const handleDownloadRecording = async (recordingId: string) => {
    if (!isAdminOrModerator) return;
    
    try {
      setDownloadingRecording(recordingId);
      
      const jwt = await getAccessToken();
      if (!jwt) {
        setDownloadingRecording(null);
        return toast("Unauthorized");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/orders/recording/${order._id}/${recordingId}?download=true`, {
        headers: {
          "authorization": `Bearer ${jwt}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recording');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-recording-${order.orderId}-${recordingId}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setDownloadingRecording(null);
      toast.success("Recording downloaded successfully");
    } catch (error) {
      console.error('Error downloading recording:', error);
      setDownloadingRecording(null);
      toast.error("Failed to download recording");
    }
  };

  const formatDuration = (seconds: number) => {
    // Handle infinite or NaN values
    if (!isFinite(seconds) || isNaN(seconds)) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Reset all states
      setPlayingRecording(null);
      setLoadedRecording(null);
      setCurrentTime(0);
      setDuration(0);
      setBufferedEnd(0);
    };
  }, []);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <PhoneCall className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">{t('callHistory.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {t('callHistory.totalAttempts')}
          </p>
          <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <PhoneCall className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{order.totalCallAttempts || 0}</p>
          </div>
        </div>
        
        {order.lastCallAttempt && (
          <>
            <Separator />
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t('callHistory.lastAttempt')}
                </p>
                <p className="text-sm sm:text-base">
                  {formatDate(order.lastCallAttempt)}
                </p>
              </div>
              
              {order.lastCallStatus && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {t('callHistory.lastStatus')}
                  </p>
                  <Badge variant="outline" className={`${getCallStatusConfig(order.lastCallStatus).className} p-2 text-sm`}>
                    {getCallStatusConfig(order.lastCallStatus).label}
                  </Badge>
                </div>
              )}
            </div>
          </>
        )}
        
        <Separator />
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {t('callHistory.attemptDetails')}
          </p>
          {order.callAttempts && order.callAttempts.length > 0 ? (
            <ScrollArea className="h-auto">
              <div className="space-y-3">
                {order.callAttempts.map((attempt: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="font-medium text-xs">#{attempt.attemptNumber}</Badge>
                        <span className="font-mono text-xs sm:text-sm truncate">{attempt.phoneNumber}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={`text-xs ${getCallStatusConfig(attempt.status).className}`}>
                        {getCallStatusConfig(attempt.status).label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(attempt.attemptDate), 'MM/dd HH:mm')}
                      </span>
                    </div>
                    
                    {/* Recording Section - Only for Admin/Moderator */}
                    {attempt.recording && isAdminOrModerator && (
                      <div className="mt-3 p-3 bg-background/60 rounded border border-primary/20">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground">Call Recording</span>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => 
                                playingRecording === attempt.recording.recordingId 
                                  ? handlePauseRecording()
                                  : handlePlayRecording(attempt.recording.recordingId)
                              }
                              disabled={loadingRecording === attempt.recording.recordingId}
                              className="h-8 w-8 p-0"
                            >
                              {loadingRecording === attempt.recording.recordingId ? (
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : playingRecording === attempt.recording.recordingId ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadRecording(attempt.recording.recordingId)}
                              disabled={downloadingRecording === attempt.recording.recordingId}
                              className="h-8 w-8 p-0"
                            >
                              {downloadingRecording === attempt.recording.recordingId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Audio Progress Bar - Show when loaded (playing or paused) */}
                        {loadedRecording === attempt.recording.recordingId && (
                          <div className="mb-3 space-y-2">
                            {/* Buffered Progress Background */}
                            <div className="relative">
                              {/* Background track */}
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                {/* Buffered progress */}
                                {bufferedEnd > 0 && (
                                  <div 
                                    className="h-full bg-muted-foreground/30 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${Math.min(100, (bufferedEnd / (isFinite(duration) && duration > 0 ? duration : attempt.recording.duration)) * 100)}%` 
                                    }}
                                  />
                                )}
                              </div>
                              {/* Main Slider */}
                              <div className="absolute inset-0">
                                <Slider
                                  value={[currentTime]}
                                  max={isFinite(duration) && duration > 0 ? duration : attempt.recording.duration}
                                  step={0.1}
                                  onValueChange={(value) => handleSeekChange(attempt.recording.recordingId, value)}
                                  onPointerDown={() => handleSeekStart(attempt.recording.recordingId)}
                                  onPointerUp={() => handleSeekEnd(attempt.recording.recordingId)}
                                  className="w-full"
                                />
                              </div>
                            </div>
                            
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{formatDuration(currentTime)}</span>
                              <span>
                                {isFinite(duration) && duration > 0 
                                  ? formatDuration(duration) 
                                  : formatDuration(attempt.recording.duration)
                                }
                              </span>
                            </div>
                            
                            {/* Status indicator */}
                            <div className="flex items-center justify-center">
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                {playingRecording === attempt.recording.recordingId ? (
                                  <>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    <span>Playing</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                                    <span>Paused</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Duration: {formatDuration(attempt.recording.duration)}</span>
                          <span>Size: {formatFileSize(attempt.recording.fileSize)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Recorded: {format(new Date(attempt.recording.recordedAt), 'MM/dd HH:mm')}
                        </div>
                      </div>
                    )}
                    
                    {/* Notes Section */}
                    {attempt.notes && (
                      <div className="mt-2 p-2 bg-background/40 rounded border">
                        <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                        <p className="text-xs">{attempt.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <PhoneCall className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('callHistory.noAttempts')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}