'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Textarea } from '@massage/ui';
import {
  useSOAPAutocomplete,
  useSOAPImprove,
  SOAPSection,
} from '@/lib/hooks/use-soap-assist';
import { AIAutocompleteSuggestion, AIImproveButton } from '@/components/ai';

interface AIEnhancedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  section: SOAPSection;
  placeholder: string;
  rows?: number;
  userId: string;
}

/**
 * SOAP note textarea with AI autocomplete and improve functionality
 */
export const AIEnhancedTextarea: React.FC<AIEnhancedTextareaProps> = ({
  value,
  onChange,
  section,
  placeholder,
  rows = 5,
  userId,
}) => {
  const [suggestion, setSuggestion] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autocomplete = useSOAPAutocomplete();
  const improve = useSOAPImprove();

  // Trigger autocomplete after user stops typing
  const handleTextChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      setShowSuggestion(false);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Only suggest if there's enough context (at least 20 characters)
      if (newValue.length < 20) {
        return;
      }

      // Debounce autocomplete request
      typingTimeoutRef.current = setTimeout(() => {
        autocomplete.mutate(
          {
            context: newValue,
            section,
            userId,
          },
          {
            onSuccess: (data) => {
              setSuggestion(data.text);
              setShowSuggestion(true);
            },
            onError: (error) => {
              console.error('Autocomplete error:', error);
            },
          }
        );
      }, 1500); // Wait 1.5 seconds after user stops typing
    },
    [section, userId, autocomplete, onChange]
  );

  // Handle accepting suggestion
  const handleAcceptSuggestion = useCallback(() => {
    if (suggestion) {
      const newValue = value + ' ' + suggestion;
      onChange(newValue);
      setSuggestion('');
      setShowSuggestion(false);
      // Focus back on textarea
      textareaRef.current?.focus();
    }
  }, [suggestion, value, onChange]);

  // Handle dismissing suggestion
  const handleDismissSuggestion = useCallback(() => {
    setSuggestion('');
    setShowSuggestion(false);
  }, []);

  // Handle improve text
  const handleImprove = useCallback(() => {
    if (!value.trim()) return;

    improve.mutate(
      {
        text: value,
        section,
        userId,
      },
      {
        onSuccess: (data) => {
          onChange(data.text);
        },
        onError: (error) => {
          console.error('Improve text error:', error);
        },
      }
    );
  }, [value, section, userId, improve, onChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full"
        />
        <div className="absolute top-2 right-2">
          <AIImproveButton
            onImprove={handleImprove}
            isLoading={improve.isPending}
            hasText={!!value.trim()}
          />
        </div>
      </div>

      {showSuggestion && (
        <AIAutocompleteSuggestion
          suggestion={suggestion}
          onAccept={handleAcceptSuggestion}
          onDismiss={handleDismissSuggestion}
          isLoading={autocomplete.isPending}
        />
      )}
    </div>
  );
};
