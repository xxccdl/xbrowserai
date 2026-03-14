import chalk from 'chalk';
import readline from 'readline';

class Spinner {
  constructor(text = 'Loading...') {
    this.text = text;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.interval = 80;
    this.timer = null;
    this.frameIndex = 0;
    this.isRunning = false;
  }

  start(text) {
    if (text) this.text = text;
    if (this.isRunning) return this;
    
    this.isRunning = true;
    this.frameIndex = 0;
    
    // 隐藏光标
    process.stdout.write('\x1B[?25l');
    
    this.timer = setInterval(() => {
      this.render();
    }, this.interval);
    
    return this;
  }

  render() {
    const frame = this.frames[this.frameIndex];
    const color = chalk.cyan;
    
    // 清除当前行
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    
    // 输出动画
    process.stdout.write(color(`${frame} ${this.text}`));
    
    this.frameIndex = (this.frameIndex + 1) % this.frames.length;
  }

  stop(finalText = null) {
    if (!this.isRunning) return this;
    
    this.isRunning = false;
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // 清除当前行
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    
    // 显示光标
    process.stdout.write('\x1B[?25h');
    
    // 输出最终文本
    if (finalText) {
      console.log(finalText);
    }
    
    return this;
  }

  succeed(text) {
    this.stop();
    console.log(chalk.green(`✓ ${text || this.text}`));
    return this;
  }

  fail(text) {
    this.stop();
    console.log(chalk.red(`✗ ${text || this.text}`));
    return this;
  }

  warn(text) {
    this.stop();
    console.log(chalk.yellow(`⚠ ${text || this.text}`));
    return this;
  }

  info(text) {
    this.stop();
    console.log(chalk.blue(`ℹ ${text || this.text}`));
    return this;
  }

  setText(text) {
    this.text = text;
    if (this.isRunning) {
      this.render();
    }
    return this;
  }
}

export default Spinner;
