import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const exportChatToPDF = async (elementId: string, filename: string = 'chat-nexus.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#131314',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

export const exportChatToMarkdown = (messages: any[], agentName: string) => {
  let md = `# Histórico de Conversa - Nexus IA\n`;
  md += `**Agente:** ${agentName}\n`;
  md += `**Data:** ${new Date().toLocaleString()}\n\n---\n\n`;

  messages.forEach(msg => {
    const role = msg.role === 'user' ? '👤 Usuário' : '🤖 Nexus';
    md += `### ${role}\n${msg.content}\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-nexus-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
