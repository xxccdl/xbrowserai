import fs from 'fs/promises';
import path from 'path';

class DataExporter {
  constructor(outputDir = './output') {
    this.outputDir = outputDir;
  }

  async ensureOutputDir() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  async toJSON(data, filename) {
    await this.ensureOutputDir();
    const filePath = path.join(this.outputDir, `${filename}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`已导出JSON: ${filePath}`);
    return filePath;
  }

  async toCSV(data, filename, headers = null) {
    await this.ensureOutputDir();
    const filePath = path.join(this.outputDir, `${filename}.csv`);
    
    let csvContent = '';
    
    if (Array.isArray(data)) {
      if (data.length > 0) {
        if (headers) {
          csvContent = headers.join(',') + '\n';
        } else if (typeof data[0] === 'object') {
          const keys = Object.keys(data[0]);
          csvContent = keys.join(',') + '\n';
          data.forEach(item => {
            const values = keys.map(key => {
              let val = item[key];
              if (typeof val === 'string') {
                val = val.replace(/"/g, '""');
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                  val = `"${val}"`;
                }
              }
              return val;
            });
            csvContent += values.join(',') + '\n';
          });
        } else {
          data.forEach(item => {
            csvContent += item + '\n';
          });
        }
      }
    } else {
      csvContent = JSON.stringify(data);
    }
    
    await fs.writeFile(filePath, '\uFEFF' + csvContent, 'utf-8');
    console.log(`已导出CSV: ${filePath}`);
    return filePath;
  }

  async toTXT(data, filename) {
    await this.ensureOutputDir();
    const filePath = path.join(this.outputDir, `${filename}.txt`);
    let content = '';
    
    if (typeof data === 'string') {
      content = data;
    } else if (Array.isArray(data)) {
      content = data.join('\n');
    } else {
      content = JSON.stringify(data, null, 2);
    }
    
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`已导出TXT: ${filePath}`);
    return filePath;
  }

  async toHTML(data, filename, title = '报告') {
    await this.ensureOutputDir();
    const filePath = path.join(this.outputDir, `${filename}.html`);
    
    let htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:hover { background-color: #f5f5f5; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .timestamp { color: #666; font-size: 14px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="timestamp">生成时间: ${new Date().toLocaleString('zh-CN')}</div>
`;
    
    if (Array.isArray(data) && data.length > 0) {
      if (typeof data[0] === 'object') {
        const keys = Object.keys(data[0]);
        htmlContent += '<table><thead><tr>';
        keys.forEach(key => htmlContent += `<th>${key}</th>`);
        htmlContent += '</tr></thead><tbody>';
        
        data.forEach(item => {
          htmlContent += '<tr>';
          keys.forEach(key => {
            htmlContent += `<td>${item[key] || ''}</td>`;
          });
          htmlContent += '</tr>';
        });
        
        htmlContent += '</tbody></table>';
      } else {
        htmlContent += '<ul>';
        data.forEach(item => {
          htmlContent += `<li>${item}</li>`;
        });
        htmlContent += '</ul>';
      }
    } else if (typeof data === 'object') {
      htmlContent += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    } else {
      htmlContent += `<p>${data}</p>`;
    }
    
    htmlContent += '</body></html>';
    
    await fs.writeFile(filePath, htmlContent, 'utf-8');
    console.log(`已导出HTML: ${filePath}`);
    return filePath;
  }

  async toMarkdown(data, filename, title = '报告') {
    await this.ensureOutputDir();
    const filePath = path.join(this.outputDir, `${filename}.md`);
    
    let mdContent = `# ${title}\n\n`;
    mdContent += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
    
    if (Array.isArray(data) && data.length > 0) {
      if (typeof data[0] === 'object') {
        const keys = Object.keys(data[0]);
        mdContent += '| ' + keys.join(' | ') + ' |\n';
        mdContent += '|' + keys.map(() => '---').join('|') + '|\n';
        
        data.forEach(item => {
          mdContent += '| ' + keys.map(key => item[key] || '').join(' | ') + ' |\n';
        });
      } else {
        data.forEach(item => {
          mdContent += `- ${item}\n`;
        });
      }
    } else if (typeof data === 'object') {
      mdContent += '```json\n' + JSON.stringify(data, null, 2) + '\n```';
    } else {
      mdContent += data;
    }
    
    await fs.writeFile(filePath, mdContent, 'utf-8');
    console.log(`已导出Markdown: ${filePath}`);
    return filePath;
  }
}

export default DataExporter;
