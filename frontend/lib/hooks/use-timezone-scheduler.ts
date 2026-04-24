import { useState, useMemo } from 'react';
import { zonedTimeToUtc } from 'date-fns-tz';

/**
 * Custom hook to handle timezone-aware date scheduling.
 * Converts local user selection into a UTC Unix timestamp (u64) for Soroban contracts.
 */
export const useTimeZoneScheduler = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const unixTimestamp = useMemo(() => {
    if (!selectedDate || !selectedTimeZone) return undefined;

    try {
      // Convert the local date/time string in the selected timezone to a UTC Date object
      const date = zonedTimeToUtc(selectedDate, selectedTimeZone);
      const seconds = Math.floor(date.getTime() / 1000);

      // Ensure we return a positive BigInt for the contract's u64 field
      return seconds >= 0 ? BigInt(seconds) : undefined;
    } catch (error) {
      return undefined;
    }
  }, [selectedDate, selectedTimeZone]);

  return {
    selectedDate,
    setSelectedDate,
    selectedTimeZone,
    setSelectedTimeZone,
    unixTimestamp,
  };
};