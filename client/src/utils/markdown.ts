
/**
 * Simple Markdown to HTML parser focused on RPG content (Tables, Lists, Basic Formatting).
 * Tailored for D&D 5e SRD content structure.
 */

export const formatMarkdown = (text: string): string => {
  if (!text) return '';

  let html = text;

  // 1. Tables (The tricky part)
  // Looks for blocks that look like markdown tables
  // | Header | Header |
  // | --- | --- |
  // | Cell | Cell |
  
  // Simple table parser: looks for lines starting with |
  const tableRegex = /((?:\|.*\|\r?\n)+)/g;
  
  html = html.replace(tableRegex, (match) => {
      const lines = match.trim().split('\n');
      if (lines.length < 2) return match;

      // Check for separator line (---|---)
      const separatorIndex = lines.findIndex(l => l.includes('---'));
      if (separatorIndex === -1) return match;

      const headerLines = lines.slice(0, separatorIndex);
      const bodyLines = lines.slice(separatorIndex + 1);

      let tableHtml = '<div class="overflow-x-auto my-4 rounded-lg border border-zinc-700 shadow-sm"><table class="w-full text-sm text-left border-collapse">';
      
      // Headers
      tableHtml += '<thead class="bg-zinc-800 text-zinc-100 uppercase text-[10px] font-bold tracking-wider">';
      headerLines.forEach(row => {
          tableHtml += '<tr>';
          const cells = row.split('|').filter(c => c.trim() !== '');
          cells.forEach(cell => {
              tableHtml += `<th class="px-4 py-3 border-b border-zinc-600">${cell.trim()}</th>`;
          });
          tableHtml += '</tr>';
      });
      tableHtml += '</thead>';

      // Body
      tableHtml += '<tbody class="divide-y divide-zinc-700/50">';
      bodyLines.forEach((row, index) => {
          if (!row.trim()) return;
          // Zebra striping for readability
          const bgClass = index % 2 === 0 ? 'bg-zinc-900/40' : 'bg-zinc-900/80';
          tableHtml += `<tr class="${bgClass} hover:bg-zinc-800/50 transition-colors">`;
          const cells = row.split('|');
          // Remove first and last empty splits if pipes are at edges
          if (row.trim().startsWith('|')) cells.shift();
          if (row.trim().endsWith('|')) cells.pop();
          
          cells.forEach(cell => {
              // Highlights bold text inside cells
              let content = cell.trim();
              content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
              tableHtml += `<td class="px-4 py-2 text-zinc-300">${content}</td>`;
          });
          tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table></div>';

      return tableHtml;
  });

  // 2. Headers
  html = html
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold font-fantasy mt-5 mb-2 text-white border-b border-zinc-800 pb-1">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold font-fantasy mt-6 mb-3 text-primary border-b border-zinc-700 pb-1">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold font-fantasy mt-6 mb-4 text-white">$1</h1>');

  // 3. Formatting
  html = html
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong class="italic text-white">$1</strong>') // Bold Italic
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-zinc-100">$1</strong>') // Bold
    .replace(/\*(.*?)\*/gim, '<em class="italic text-zinc-400">$1</em>') // Italic
    .replace(/~~(.*?)~~/gim, '<del class="opacity-60">$1</del>') // Strikethrough
    .replace(/`(.*?)`/gim, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-400 border border-zinc-700 shadow-sm">$1</code>'); // Code

  // 4. Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-primary/50 pl-4 py-2 my-4 italic bg-zinc-900/50 text-zinc-300 rounded-r shadow-inner">$1</blockquote>');

  // 5. Lists
  // Unordered
  html = html.replace(/^\s*[\-\*] (.*)/gm, '<ul class="list-disc list-outside my-1 pl-5 text-zinc-300 marker:text-zinc-500"><li class="pl-1">$1</li></ul>');
  // Ordered
  html = html.replace(/^\s*\d+\. (.*)/gm, '<ol class="list-decimal list-outside my-1 pl-5 text-zinc-300 marker:text-zinc-500"><li class="pl-1">$1</li></ol>');
  
  // Fix nested lists (crude) - reduce double ul/ol wrapping if regex creates them adjacent
  html = html.replace(/<\/ul>\s*<ul[^>]*>/g, '');
  html = html.replace(/<\/ol>\s*<ol[^>]*>/g, '');

  // 6. Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline hover:text-primary/80 transition-colors font-medium">$1</a>');

  // 7. Newlines to breaks (only if not inside table or lists to avoid mess)
  // We split by block tags to avoid adding <br> inside specific structures
  html = html.replace(/\n/gim, '<br />');
  
  // Cleanup excessive breaks around block elements
  html = html.replace(/<br \/>\s*<h/gim, '<h');
  html = html.replace(/<\/h(\d)>\s*<br \/>/gim, '</h$1>');
  html = html.replace(/<br \/>\s*<div/gim, '<div');
  html = html.replace(/<\/div>\s*<br \/>/gim, '</div>');
  html = html.replace(/<br \/>\s*<ul/gim, '<ul');
  html = html.replace(/<\/ul>\s*<br \/>/gim, '</ul>');
  html = html.replace(/<br \/>\s*<ol/gim, '<ol');
  html = html.replace(/<\/ol>\s*<br \/>/gim, '</ul>');
  html = html.replace(/<br \/>\s*<blockquote/gim, '<blockquote');
  html = html.replace(/<\/blockquote>\s*<br \/>/gim, '</blockquote>');

  return html;
};
