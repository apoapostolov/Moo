import { useEffect, useRef, useState } from 'react';

import { parseNatural } from './natural';

/**
 * Reads the title a moment after typing stops, then hands the result to the
 * dialog so the other fields can follow. The delay is what makes it feel like
 * the box is listening rather than reacting to every keystroke: filling a date
 * mid-word would fight the person typing.
 */
export const useNaturalTitle = (text, kind, apply) => {
  const [parsed, setParsed] = useState(null);
  const applyRef = useRef(apply);

  applyRef.current = apply;

  useEffect(() => {
    if (!text || text.trim().length < 3) {
      setParsed(null);

      return undefined;
    }

    const timer = setTimeout(() => {
      const result = parseNatural(text, { kind });

      if (!result.understood) {
        setParsed(null);

        return;
      }

      setParsed(result);
      applyRef.current(result);
    }, 700);

    return () => clearTimeout(timer);
  }, [text, kind]);

  return parsed;
};
