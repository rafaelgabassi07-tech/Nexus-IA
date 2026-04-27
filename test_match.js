const content = `Here is your code:

\`\`\`tsx file:App.tsx
const App = () => <div>Hello</div>
export default App;
\`\`\`

And another one:
\`\`\`css
body { color: red; }
\`\`\`
`

const extractFilesFromMarkdown = (content) => {
  const files = [];
  const lineRegex = /\`\`\`(\w+)?([^\n]*)\n([\s\S]*?)(?:\`\`\`|$)/g;
  let match;
  while ((match = lineRegex.exec(content)) !== null) {
    const lang = match[1] || 'text';
    const meta = (match[2] || '').trim();
    let name = '';
    
    if (meta) {
      const fileMatch = meta.match(/(?:file:\s*)?([\w.-/:\\\\]+\.\w+)/i);
      if (fileMatch) {
        name = fileMatch[1];
      } else {
        const fallbackMatch = meta.match(/([\w.-/:\\\\]+)/);
        if (fallbackMatch) name = fallbackMatch[1];
      }
    }
    
    if (!name) {
      name = `file_${files.length + 1}.${lang === 'typescript' ? 'ts' : lang === 'javascript' ? 'js' : lang}`;
    }

    files.push({
      lang: lang,
      name: name,
      code: match[3]
    });
  }
  return files;
};

console.log(extractFilesFromMarkdown(content));
