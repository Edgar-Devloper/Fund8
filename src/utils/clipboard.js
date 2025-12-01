export const copyToClipboard = async (text, onSuccess, onError) => {
  if (!text || typeof text !== 'string') {
    const error = new Error('Invalid text to copy');
    if (onError) onError(error);
    return;
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      if (onSuccess) onSuccess();
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.width = '2em';
      ta.style.height = '2em';
      ta.style.padding = '0';
      ta.style.border = 'none';
      ta.style.outline = 'none';
      ta.style.boxShadow = 'none';
      ta.style.background = 'transparent';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(ta);
      
      if (successful) {
        if (onSuccess) onSuccess();
      } else {
        throw new Error('execCommand copy failed');
      }
    }
  } catch (err) {
    console.error('Error copying to clipboard:', err);
    if (onError) onError(err);
    throw err;
  }
};

