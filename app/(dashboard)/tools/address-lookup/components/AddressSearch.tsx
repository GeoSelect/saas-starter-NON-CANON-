'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Loader, AlertCircle, X } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { logger } from '@/lib/logger';

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
}

interface AddressSearchProps {
  workspaceId: string;
  onSelect?: (result: {
    address: string;
    lat: number;
    lng: number;
    parcel?: {
      id: string;
      address: string;
      owner?: string;
      zoning?: string;
      apn?: string;
    };
  }) => void;
  placeholder?: string;
  className?: string;
}

export function AddressSearch({
  workspaceId,
  onSelect,
  placeholder = 'Search for an address...',
  className = '',
}: AddressSearchProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedInput = useDebounce(input, 300);

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/address-search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: query, type: 'autocomplete' }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.details || `HTTP ${response.status}`
        );
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);

      logger.info('autocomplete-loaded', {
        query,
        count: data.suggestions?.length || 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load suggestions';
      setError(message);
      logger.error('autocomplete-error', { query, error: message });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  // Debounce effect
  useEffect(() => {
    if (debouncedInput) {
      fetchSuggestions(debouncedInput);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedInput, fetchSuggestions]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    async (suggestion: Suggestion) => {
      setInput(suggestion.description);
      setShowSuggestions(false);
      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/address-search`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: suggestion.description,
              type: 'search',
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData?.details || `HTTP ${response.status}`
          );
        }

        const data = await response.json();

        logger.info('address-search-result', {
          address: data.address,
          hasParcels: !!data.parcel,
        });

        onSelect?.({
          address: data.address,
          lat: data.coordinates.lat,
          lng: data.coordinates.lng,
          parcel: data.parcel,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to search address';
        setError(message);
        logger.error('address-search-error', { address: suggestion.description, error: message });
      } finally {
        setIsSearching(false);
      }
    },
    [workspaceId, onSelect]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleSelectSuggestion(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          break;
      }
    },
    [suggestions, selectedIndex, showSuggestions, handleSelectSuggestion]
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => input.length >= 3 && setShowSuggestions(true)}
            placeholder={placeholder}
            disabled={isSearching}
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 py-3 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition disabled:bg-gray-50 disabled:text-gray-500"
            autoComplete="off"
          />
          {input && (
            <button
              onClick={() => {
                setInput('');
                setSuggestions([]);
                setShowSuggestions(false);
                setError(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {isLoading && (
            <Loader className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 transform animate-spin text-blue-500" />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.placeId}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`w-full px-4 py-3 text-left transition ${
                  index === selectedIndex
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                } ${
                  index > 0 ? 'border-t border-gray-200' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {suggestion.mainText}
                    </p>
                    {suggestion.secondaryText && (
                      <p className="text-sm text-gray-500 truncate">
                        {suggestion.secondaryText}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No suggestions message */}
        {showSuggestions &&
          suggestions.length === 0 &&
          input.length >= 3 &&
          !isLoading && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-gray-300 bg-white p-4 text-center text-gray-500 shadow-lg">
              No addresses found
            </div>
          )}
      </div>
    </div>
  );
}
