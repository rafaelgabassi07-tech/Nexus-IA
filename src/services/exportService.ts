
import { ChatSession, AgentDefinition } from '../types';

export type ExportFormat = 'markdown' | 'file-bundle' | 'nexus-archive' | 'html-bundle' | 'json';

interface ExportData {
  session: ChatSession;
  agent: AgentDefinition;
  files: { name: string, lang: string, code: string }[];
}

export const exportService = {
  async export(format: ExportFormat, data: ExportData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = `nexus-project-${timestamp}`;

    switch (format) {
      case 'markdown':
        return this.downloadMarkdown(baseName, data);
      case 'file-bundle':
        return this.downloadFilesAsIndividual(data);
      case 'nexus-archive':
        return this.downloadNexusArchive(baseName, data);
      case 'html-bundle':
        return this.downloadHtmlBundle(baseName, data);
      case 'json':
        return this.downloadJson(baseName, data);
    }
  },

  downloadMarkdown(name: string, data: ExportData) {
    let content = `# Nexus IA — Export\n\n`;
    content += `## Metadados\n`;
    content += `| Atributo | Valor |\n`;
    content += `| :--- | :--- |\n`;
    content += `| Projeto | ${data.session.title} |\n`;
    content += `| Agente | ${data.agent.name} |\n`;
    content += `| Data | ${new Date(data.session.timestamp || data.session.updatedAt || Date.now()).toLocaleString()} |\n\n`;
    
    content += `## Código Gerado\n\n`;
    data.files.forEach(file => {
      content += `### ${file.name}\n`;
      content += `\`\`\`${file.lang}\n${file.code}\n\`\`\`\n\n`;
    });

    this.triggerDownload(`${name}.md`, content, 'text/markdown');
  },

  downloadFilesAsIndividual(data: ExportData) {
    data.files.forEach(file => {
      const mime = file.lang === 'html' ? 'text/html' : 
                   file.lang === 'css' ? 'text/css' :
                   file.lang === 'javascript' || file.lang === 'js' ? 'application/javascript' :
                   file.lang === 'typescript' || file.lang === 'ts' ? 'application/x-typescript' : 'text/plain';
      this.triggerDownload(file.name, file.code, mime);
    });
  },

  downloadNexusArchive(name: string, data: ExportData) {
    // A simplified 'archive' for this environment: a JSON summarizing all files
    const archive = {
      version: '2.0',
      type: 'NexusArchive',
      metadata: {
        title: data.session.title,
        agent: data.agent.id,
        timestamp: data.session.timestamp || data.session.updatedAt || Date.now()
      },
      files: data.files
    };
    this.triggerDownload(`${name}.nxs`, JSON.stringify(archive, null, 2), 'application/json');
  },

  downloadHtmlBundle(name: string, data: ExportData) {
    const filesJson = JSON.stringify(data.files);
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${data.session.title} — Nexus Bundle</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #0d0d0e; color: #fff; padding: 2rem; }
      pre { background: #1a1b1e; padding: 1rem; border-radius: 8px; overflow: auto; }
      .file { margin-bottom: 2rem; border-bottom: 1px solid #333; padding-bottom: 2rem; }
    </style>
</head>
<body>
    <h1>${data.session.title}</h1>
    <p>Agente: ${data.agent.name}</p>
    <div id="content"></div>
    <script>
      const files = ${filesJson};
      const container = document.getElementById('content');
      files.forEach(f => {
        const div = document.createElement('div');
        div.className = 'file';
        div.innerHTML = '<h2>' + f.name + '</h2><pre><code>' + f.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>';
        container.appendChild(div);
      });
    </script>
</body>
</html>`;
    this.triggerDownload(`${name}.html`, html, 'text/html');
  },

  downloadJson(name: string, data: ExportData) {
    this.triggerDownload(`${name}.json`, JSON.stringify(data, null, 2), 'application/json');
  },

  triggerDownload(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
