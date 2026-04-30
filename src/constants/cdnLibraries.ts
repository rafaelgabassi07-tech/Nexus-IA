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
    // Global Safety Shim - Prevents "Cannot read properties of undefined"
    (function() {
      const createSafeProxy = (name) => new Proxy({}, {
        get: (target, prop) => {
          if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
            const Mock = (props) => null;
            Mock.displayName = "Mock(" + name + "." + prop + ")";
            return Mock;
          }
          if (prop === 'motion') return (props) => null;
          return undefined;
        }
      });

      // Pre-initialize globals with proxies to handle race conditions
      window.Recharts = window.Recharts || createSafeProxy('Recharts');
      window.Motion = window.Motion || createSafeProxy('Motion');
      window.FramerMotion = window.FramerMotion || window.Motion;
      window.LucideReact = window.LucideReact || createSafeProxy('LucideReact');
      window.React = window.React || createSafeProxy('React');
      window.ReactDOM = window.ReactDOM || createSafeProxy('ReactDOM');
    })();
  </script>
  <script crossorigin="anonymous" src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
  <script crossorigin="anonymous" src="https://unpkg.com/framer-motion@12/dist/framer-motion.js"></script>
  <script crossorigin="anonymous" src="https://unpkg.com/recharts@2/umd/Recharts.js"></script>
  <script crossorigin="anonymous" src="https://cdn.jsdelivr.net/npm/chart.js"></script>
`;
