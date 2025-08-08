import Prism from 'prismjs';

// Expose Prism to global scope for component plugins to attach correctly
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Prism = Prism;
}

// Base languages first
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';

// Common extras
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';

// Theme (dark-friendly)
import 'prismjs/themes/prism-tomorrow.css';

export default Prism;
