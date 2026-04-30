// src/components/workbench/preview/cdnMap.ts
export const libraryGlobals: Record<string, string> = {
  'react': 'window.React',
  'react-dom': 'window.ReactDOM',
  'react-dom/client': 'window.ReactDOM',
  'react/jsx-runtime': 'window.React',
  'lucide-react': 'window.LucideReact || window.lucideFallback || {}',
  'recharts': 'window.Recharts || {}',
  'framer-motion': 'window.FramerMotion || window.Motion || {}',
  'motion/react': 'window.Motion || window.FramerMotion || {}',
  'motion': 'window.Motion || {}',
  'chart.js': 'window.Chart',
  'chartjs-plugin-datalabels': 'window.ChartDataLabels || {}',
  'date-fns': 'window.dateFns || {}',
  'lodash': 'window._',
  'axios': 'window.axios',
  'zustand': 'window.zustand || {}',
  'clsx': 'window.clsx || ((...c) => c.filter(Boolean).join(" "))',
  'classnames': 'window.classnames || ((...c) => c.filter(Boolean).join(" "))',
};

export const cdns = `
  <script crossorigin="anonymous" src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin="anonymous" src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script crossorigin="anonymous" src="https://unpkg.com/react-is@18/umd/react-is.development.js"></script>
  <script crossorigin="anonymous" src="https://unpkg.com/prop-types@15.8.1/prop-types.min.js"></script>
  <script crossorigin="anonymous" src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    // Global Safety Shim
    window.Motion = window.Motion || window.FramerMotion || {};
    window.FramerMotion = window.FramerMotion || window.Motion || {};
    window.LucideReact = window.LucideReact || {};
    
    // Proxy fallback to prevent "Cannot read properties of undefined"
    const createSafeProxy = (name) => new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'motion' || prop === 'AnimatePresence' || prop === 'LayoutGroup') return () => null;
        return target[prop];
      }
    });

    if (Object.keys(window.Motion).length === 0) window.Motion = createSafeProxy('Motion');
  </script>
  <script crossorigin="anonymous" src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
  <script crossorigin="anonymous" src="https://unpkg.com/framer-motion@12/dist/framer-motion.js"></script>
  <script crossorigin="anonymous" src="https://unpkg.com/recharts@2/umd/Recharts.js"></script>
  <script crossorigin="anonymous" src="https://cdn.jsdelivr.net/npm/chart.js"></script>
`;
