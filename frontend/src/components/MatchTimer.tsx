import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { eventsApi } from '../utils/api';

interface TimerData {
  fixture_id: number;
  current_half: number;
  current_minute: number;
  is_paused: boolean;
  half_start_time: string | null;
}

interface MatchTimerProps {
  fixtureId: number;
  hasLineups: boolean;
  onTimerUpdate?: (minute: number, half: number) => void;
}

const MatchTimer: React.FC<MatchTimerProps> = ({ fixtureId, hasLineups, onTimerUpdate }) => {
  const [timer, setTimer] = useState<TimerData | null>(null);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimer();
    const interval = setInterval(fetchTimer, 1000); // Update every second
    return () => clearInterval(interval);
  }, [fixtureId]);

  useEffect(() => {
    if (timer && onTimerUpdate) {
      onTimerUpdate(currentMinute, timer.current_half);
    }
  }, [currentMinute, timer?.current_half, onTimerUpdate]);

  const fetchTimer = async () => {
    try {
      const timerData = await eventsApi.getTimer(fixtureId);
      setTimer(timerData);

      // Calculate current minute if timer is running
      if (timerData.current_half > 0 && timerData.current_half < 3 && timerData.half_start_time && !timerData.is_paused) {
        const startTime = new Date(timerData.half_start_time + 'Z'); // Add Z for UTC
        const now = new Date();
        const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
        // Soccer minutes start from 1, not 0 (00:26 should be minute 1)
        setCurrentMinute(Math.max(1, elapsedMinutes + 1));
      } else {
        setCurrentMinute(Math.max(1, timerData.current_minute || 1));
      }
    } catch (error) {
      console.error('Error fetching timer:', error);
    }
  };

  const startHalf = async (half: number) => {
    setLoading(true);
    try {
      await eventsApi.startHalf(fixtureId, half);
      fetchTimer();
    } catch (error: any) {
      console.error('Error starting half:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to start half';
      alert(`Error starting half: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const endHalf = async () => {
    setLoading(true);
    try {
      await eventsApi.endHalf(fixtureId);
      fetchTimer();
    } catch (error: any) {
      console.error('Error ending half:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to end half';
      alert(`Error ending half: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };


  const getDisplayTime = () => {
    if (!timer || timer.current_half === 0 || timer.current_half === 3 || timer.current_half === -1) {
      return "00:00";
    }

    // Only show live time if timer is actually running
    if (timer.is_paused || !timer.half_start_time) {
      return "00:00";
    }

    // Calculate elapsed seconds from half start time
    const startTime = new Date(timer.half_start_time + 'Z');
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    const displayMinute = Math.floor(elapsedSeconds / 60);
    const displaySeconds = elapsedSeconds % 60;

    return `${displayMinute.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
  };

  const getHalfText = () => {
    if (!timer) return "Not Started";

    switch (timer.current_half) {
      case 0:
        return "Not Started";
      case -1:
        return "Half Time";
      case 1:
        return "1st Half";
      case 2:
        return "2nd Half";
      case 3:
        return "Full Time";
      default:
        return "Not Started";
    }
  };

  const getButtonState = () => {
    // If no lineups are set, disable the start button
    if (!hasLineups) {
      return {
        text: "Set Lineups First",
        action: () => {},
        className: "btn-disabled",
        disabled: true
      };
    }

    if (!timer) return { text: "Start 1st Half", action: () => startHalf(1), className: "btn-success", disabled: false };

    switch (timer.current_half) {
      case 0:
        return { text: "Start 1st Half", action: () => startHalf(1), className: "btn-success", disabled: false };
      case -1:
        // Halftime state - show "Start 2nd Half"
        return { text: "Start 2nd Half", action: () => startHalf(2), className: "btn-success", disabled: false };
      case 1:
        return { text: "End 1st Half", action: endHalf, className: "btn-danger", disabled: false };
      case 2:
        return { text: "End 2nd Half", action: endHalf, className: "btn-danger", disabled: false };
      case 3:
        return { text: "FT", action: () => {}, className: "btn-disabled", disabled: true };
      default:
        return { text: "Start 1st Half", action: () => startHalf(1), className: "btn-success", disabled: false };
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ClockIcon className="h-6 w-6 text-soccer-green" />
          <div>
            <div className="text-2xl font-bold text-gray-900 font-mono">
              {getDisplayTime()}
            </div>
            <div className="text-sm text-gray-600">
              {getHalfText()}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {(() => {
            const buttonState = getButtonState();
            return (
              <button
                onClick={buttonState.action}
                disabled={loading || buttonState.disabled}
                className={`${buttonState.className} flex items-center text-sm`}
              >
                {buttonState.text.includes('Start') && <PlayIcon className="h-4 w-4 mr-1" />}
                {buttonState.text.includes('End') && <PauseIcon className="h-4 w-4 mr-1" />}
                {buttonState.text}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default MatchTimer;