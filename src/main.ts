
import { CachedJSONData } from './data/CachedJSONData';
import { DrawingSurface } from './graphics/DrawingSurface';
import { UserAgent } from './UserAgent';

export class Application {
  private data: CachedJSONData;
  private canvas: DrawingSurface;
  private readonly maxFPS: number = 21;
  private frameTimestamp: number = Date.now();
  private FPSCounter: HTMLElement;
  private isMobile: boolean = UserAgent.hasTouchScreen();

  private gameState: GameState;
  private wordLength: number = 5;
  private wordCount: number = 0;
  private charHorizontal = 22;
  private charVertical = 53;
  private lines: string[] = [];
  private statusLines: string[] = [];
  private attemptsLeft: number = 4;
  private charMouseX = 0;
  private charMouseY = 0;
  private passwords: {[index: number]: string} = {};
  private correctPassword: string;
  private highlightedWord: string;
  private highlightedBlockStart: number;
  private highlightedBlockEnd: number;
  private addresses: string[] = [
    '0xF964',
    '0xF970',
    '0xF97C',
    '0xF988',
    '0xF994',
    '0xF9A0',
    '0xF9AC',
    '0xF9B8',
    '0xF9C4',
    '0xF9D0',
    '0xF9DC',
    '0xF9E8',
    '0xF9F4',
    '0xFA00',
    '0xFA0C',
    '0xFA18',
    '0xFA24',
    '0xFA30',
    '0xFA3C',
    '0xFA48',
    '0xFA54',
    '0xFA60',
    '0xFA6C',
    '0xFA78',
    '0xFA84',
    '0xFA90',
    '0xFA9C',
    '0xFAA8',
    '0xFAB4',
    '0xFAC0',
    '0xFACC',
    '0xFAD8',
    '0xFAE4',
    '0xFAF0'                                                                                                                                    
  ];
  private punctuation: string[] = [
    '<', '>', '{', '}', '(', ')', '=', '$', ',',
    '\'', ';', ':', '_', '"', '!', '[', ']', '^',
    '#', '|', '+', '-', '*', '@', '\\', '/', '%'
  ];
  private punctuationNonBlocky: string[] = [
    '=', '$', ',',
    '\'', ';', ':', '_', '"', '!', '^',
    '#', '|', '+', '-', '*', '@', '\\', '/', '%'
  ];

  private displayHighlightImage: HTMLImageElement;
  private displayGaussImage: HTMLImageElement;
  private gaussY: number = -1;

  constructor() {
    this.displayHighlightImage = new Image(640, 480);
    this.displayHighlightImage.src = 'assets/images/display-highlight.png';
    this.displayGaussImage = new Image(640, 120);
    this.displayGaussImage.src = 'assets/images/display-gauss.png';

    this.data = new CachedJSONData('fo-hacking-data.json');
    this.canvas = new DrawingSurface(640, 480, 'fo-hacking');
    this.canvas.registerFont('VCR_OSD_MONO_1.001');
    this.FPSCounter = document.querySelector("#fps");

    document.querySelector("#reset").addEventListener('click', () => {
      this.reset();
    });
    document.querySelector("#letters").addEventListener('change', (event) => {
      this.wordLength = parseInt((event.target as HTMLSelectElement).value);
      this.reset();
    });
    this.canvas.onMouseMove((event: MouseEvent) => {
      this.onMouseMove(event);
    });
    this.canvas.onClick((event: MouseEvent) => {
      this.onMouseMove(event); // Mobile patch
      this.drawCharHighlight();

      // Words
      if (this.highlightedWord !== null && this.gameState === GameState.ATTEMPT) {
        if (this.highlightedWord === this.correctPassword) {
          // Correct Password, Won
          this.appendStatusLines(['', 'is accessed.', 'while system', 'Please wait', 'Exact match!', '']);
          this.lines[1] = '';
          this.lines[3] = 'ACCESS GRANTED';
          this.gameState = GameState.MATCH;
        } else {
          // Incorrect password
          let numCorrect: number = 0;
          for (let i = 0; i < this.correctPassword.length; i++) {
            if (this.correctPassword.charAt(i) === this.highlightedWord.charAt(i)) numCorrect++;
          }
          this.appendStatusLines(['', `>${numCorrect.toString()}/${this.wordLength} correct.`, '>Entry denied', '>' + this.highlightedWord.toUpperCase()]);
          this.deductAttempt();
        }
      }
      // Blocks
      if (this.highlightedBlockStart !== null && this.highlightedBlockEnd !== null) {
        let wordSoupPos: {x: number, y: number} = this.wordSoupPosToCharAbs(this.highlightedBlockStart);
        let substituteText: string = '';
        for (let i = 0; i < this.highlightedBlockEnd - this.highlightedBlockStart; i++) {
          substituteText += this.punctuationNonBlocky[Math.floor(Math.random() * this.punctuationNonBlocky.length)];
        }
        this.lines[wordSoupPos.y] = this.lines[wordSoupPos.y].substring(0, wordSoupPos.x) + substituteText + this.lines[wordSoupPos.y].substring(wordSoupPos.x + substituteText.length);

        if (Math.floor(Math.random() * 3) < 1) {
          // Reset Tries
          this.resetTries();
        } else {
          // Remove dud
          this.removeDud();
        }
      }
    });

    if (this.isMobile) {
      window.addEventListener("deviceorientation", () => {
        this.onDeviceOrientation();
      }, true);
      this.onDeviceOrientation();
    }

    setTimeout(() => {
      this.reset();
      this.draw(1000 / this.maxFPS);
    }, 1200);
  }

  private draw(refreshPeriod: number) {
    this.FPSCounter.innerText = "FPS: " + Math.ceil((1000 / (Date.now() - this.frameTimestamp))).toString();
    this.frameTimestamp = Date.now();

    setTimeout(() => {
      this.canvas.clear();

      let bandColorDark: string = '#0b1f10';
      let bandColorLight: string = '#162918';
      for (let by = 0; by < 240; by++) {
        this.canvas.drawRectangle(0, by * 2, 640, by * 2 + 2, by % 2 ? bandColorDark : bandColorLight);
      }

      this.drawCharHighlight();

      for (let y = 0; y < this.charHorizontal; y++) {
        this.canvas.drawText(this.lines[y], 15, 21 + 21 * y, 'VCR_OSD_MONO_1.001', 21, '#36fc9b');

        // Status lines
        if (y >= 5 && this.statusLines.length >= this.charHorizontal - y) {
          this.canvas.drawText(this.statusLines[this.charHorizontal - y - 1], 480, 21 + 21 * y, 'VCR_OSD_MONO_1.001', 21, '#36fc9b');
        }
      }

      if (this.gaussY === -1 && Math.floor(Math.random() * 70) === 0) {
        this.gaussY = 0;
      }
      if (this.gaussY > -1) {
        this.canvas.drawImage(this.displayGaussImage, 0, Math.floor(this.gaussY), 640, 120);
        this.gaussY += 6;
        if (this.gaussY >= 480) this.gaussY = -1;
      }

      this.canvas.drawImage(this.displayHighlightImage, 0, 0);

      this.draw(refreshPeriod);
    }, refreshPeriod);
  }

  private onMouseMove(event: MouseEvent) {
    let canvasElement = this.canvas.getCanvasElement().getBoundingClientRect();
    let scaleX = this.canvas.getWidth() / canvasElement.width;
    let scaleY = this.canvas.getHeight() / canvasElement.height;

    this.charMouseX = Math.ceil((event.clientX - canvasElement.left) * scaleX / 12.3) - 2;
    this.charMouseY = Math.ceil((event.clientY - canvasElement.top) * scaleY / 21) - 1;
  }

  private drawCharHighlight() {
    if ((this.charMouseX >= 7 && this.charMouseX <= 17 && this.charMouseY >= 5 && this.charMouseY <= 21) ||
      (this.charMouseX >= 26 && this.charMouseX <= 36 && this.charMouseY >= 5 && this.charMouseY <= 21)) {
        this.highlightCharAbs(this.charMouseX, this.charMouseY);
    }
  }

  private highlightCharAbs(x: number, y: number) {
    this.canvas.drawRectangle(Math.ceil(x * 12.3) + 15, y * 21, 13, 21, 'white');
    let cursorPos: number = this.charAbsToWordSoupPos(x, y);
    this.highlightedWord = null;
    if (this.gameState === GameState.ATTEMPT) this.statusLines[0] = '>' + this.lines[y][x];
    if (cursorPos === null) return;

    // Passwords
    Object.keys(this.passwords).forEach((startPos) => {
      let password: string = this.passwords[parseInt(startPos)];
      let endPos: number = parseInt(startPos) + password.length;
      
      if (cursorPos >= parseInt(startPos) && cursorPos < endPos) {
        for (let i = parseInt(startPos); i < endPos; i++) {
          let wordSoupPos: {x: number, y: number} = this.wordSoupPosToCharAbs(i);
          this.canvas.drawRectangle(Math.ceil(wordSoupPos.x * 12.3) + 15, wordSoupPos.y * 21, 13, 21, 'white');
        }
        this.highlightedWord = password;
        if (this.gameState === GameState.ATTEMPT) this.statusLines[0] = '>' + password;
      }
    });

    // Blocks
    this.highlightedBlockStart = null;
    this.highlightedBlockEnd = null;
    let startPos: number = this.charAbsToWordSoupPos(x, y);
    let endPos: number = null;
    // Forward
    for (let lx = x; lx < this.charVertical; lx++) {
      if (this.lines[y].charAt(lx) === ' ' || this.lines[y].charAt(lx).match(/[a-zA-Z]/i)) break;

      if (this.lines[y].charAt(x) === '(' && this.lines[y].charAt(lx) === ')') {
        endPos = this.charAbsToWordSoupPos(lx, y) + 1;
        break;
      }
      if (this.lines[y].charAt(x) === '[' && this.lines[y].charAt(lx) === ']') {
        endPos = this.charAbsToWordSoupPos(lx, y) + 1;
        break;
      }
      if (this.lines[y].charAt(x) === '<' && this.lines[y].charAt(lx) === '>') {
        endPos = this.charAbsToWordSoupPos(lx, y) + 1;
        break;
      }
      if (this.lines[y].charAt(x) === '{' && this.lines[y].charAt(lx) === '}') {
        endPos = this.charAbsToWordSoupPos(lx, y) + 1;
        break;
      }
    }
    // Backward
    if (endPos === null) {
      for (let lx = x; lx > 0; lx--) {
        if (this.lines[y].charAt(lx) === ' ' || this.lines[y].charAt(lx).match(/[a-zA-Z]/i)) break;
  
        if (this.lines[y].charAt(x) === ')' && this.lines[y].charAt(lx) === '(') {
          endPos = this.charAbsToWordSoupPos(lx, y);
          break;
        }
        if (this.lines[y].charAt(x) === ']' && this.lines[y].charAt(lx) === '[') {
          endPos = this.charAbsToWordSoupPos(lx, y);
          break;
        }
        if (this.lines[y].charAt(x) === '>' && this.lines[y].charAt(lx) === '<') {
          endPos = this.charAbsToWordSoupPos(lx, y);
          break;
        }
        if (this.lines[y].charAt(x) === '}' && this.lines[y].charAt(lx) === '{') {
          endPos = this.charAbsToWordSoupPos(lx, y);
          break;
        }
      }
    }
    // Highlighting
    if (endPos !== null) {
      if (startPos < endPos) {
        this.highlightedBlockStart = startPos;
        this.highlightedBlockEnd = endPos;
        for (let i = startPos; i < endPos; i++) {
          let wordSoupPos: {x: number, y: number} = this.wordSoupPosToCharAbs(i);
          this.canvas.drawRectangle(Math.ceil(wordSoupPos.x * 12.3) + 15, wordSoupPos.y * 21, 13, 21, 'white');
        }
      } else {
        this.highlightedBlockStart = endPos;
        this.highlightedBlockEnd = startPos + 1;
        for (let i = endPos; i < startPos; i++) {
          let wordSoupPos: {x: number, y: number} = this.wordSoupPosToCharAbs(i);
          this.canvas.drawRectangle(Math.ceil(wordSoupPos.x * 12.3) + 15, wordSoupPos.y * 21, 13, 21, 'white');
        }
      }
    }
  }

  private charAbsToWordSoupPos(x: number, y: number): number {
    if (y < 5 || y > 21) return null;

    if (x >= 7 && x <= 17) {
      // Left column
      return x - 7 + ((y - 5) * 11);
    } else if (x >= 26 && x <= 36) {
      // Right column
      return x - 26 + ((y - 5) * 11) + 187;
    } else {
      return null;
    }
  }

  private wordSoupPosToCharAbs(pos: number): {x: number, y: number} {
    if (pos < 187) {
      // Left column
      return {
        x: 7 + Math.floor(pos % 11),
        y: 5 + Math.floor(pos / 11)
      }
    } else {
      // Right column
      return {
        x: 26 + Math.floor((pos - 187) % 11),
        y: 5 + Math.floor((pos - 187) / 11)
      }
    }
  }

  private appendStatusLines(lines: string[]) {
    this.statusLines = lines.concat(this.statusLines.slice(1, this.statusLines.length));
  }

  private deductAttempt() {
    let tries: number = parseInt(this.lines[3].slice(0, 1));

    if (tries > 0) {
      this.lines[3] = this.lines[3].slice(0, -2);
      this.lines[3] = (tries - 1).toString() + this.lines[3].slice(1, this.lines[3].length);
    }
    if (tries === 2) {
      this.lines[1] = '!!! WARNING: LOCKOUT IMMINENT !!!';
    }
    if (tries === 1) {
      this.gameState = GameState.LOCKOUT;
      this.lines[1] = '';
      this.lines[3] = 'PERMISSION DENIED. Lockout initiated.';
      this.appendStatusLines(['', '>DENIED', '>PERMISSION']);
    }
  }

  private reset() {
    this.gaussY = -1;
    this.passwords = {};
    this.gameState = GameState.ATTEMPT;
    this.statusLines = [];

    let attemptBlocks: string = '';
    for (let i = 0; i < this.attemptsLeft; i++) {
      attemptBlocks += ' ∎';
    }

    this.lines = [];
    this.lines.push('kodenkel (TM) RETCON PROTOCOL');
    this.lines.push('ENTER PASSWORD NOW');
    this.lines.push('');
    this.lines.push(this.attemptsLeft.toString() + ' ATTEMPT(S) LEFT: ' + attemptBlocks);
    this.lines.push('');

    let addressPointer: number = 0;
    let wordSoupPointerLeft: number = 0;
    let wordSoupPointerRight: number = 187;
    let wordSoup: string = '';
    let randomWord: string;
    this.wordCount = 0;
    let possibleWords: string[] = this.data.getArrayByKey(this.wordLength.toString());
    let wordSpacing = 0;

    for (let i = 0; i < 374; i++) {
      if (Math.floor(Math.random() * 12) === 0) {
        if (wordSpacing < 4 || i + this.wordLength > 374) {
          // Punctuation
          wordSoup += this.punctuation[Math.floor(Math.random() * this.punctuation.length)];
        } else {
          // Word
          randomWord = possibleWords[Math.floor(Math.random() * possibleWords.length)];
          wordSoup += randomWord;
          this.passwords[i] = randomWord;
          this.wordCount++;
          wordSpacing = 0;
          i += randomWord.length - 1;
        }
      } else {
        // Punctuation
        wordSoup += this.punctuation[Math.floor(Math.random() * this.punctuation.length)];
      }

      wordSpacing++;
    }

    this.correctPassword = Object.values(this.passwords)[Math.floor(Math.random() * Object.values(this.passwords).length)];

    for (let i = 1; i <= 17; i++) {
      this.lines.push(`${this.addresses[addressPointer]} ${wordSoup.slice(wordSoupPointerLeft, wordSoupPointerLeft + 11)} ${this.addresses[addressPointer + 1]} ${wordSoup.slice(wordSoupPointerRight, wordSoupPointerRight + 11)}`);
      addressPointer += 2;
      wordSoupPointerLeft += 11;
      wordSoupPointerRight += 11;
    }
  }

  private resetTries() {
    this.appendStatusLines(['', '>Tries reset.']);

    let attemptBlocks: string = '';
    for (let i = 0; i < this.attemptsLeft; i++) {
      attemptBlocks += ' ∎';
    }
    this.lines[3] = this.attemptsLeft.toString() + ' ATTEMPT(S) LEFT: ' + attemptBlocks;
  }

  private removeDud() {
    let randomPasswordKeys = Object.keys(this.passwords);
    let randomPasswordIndex: number = parseInt(randomPasswordKeys[randomPasswordKeys.length * Math.random() << 0]);
    let randomPassword: string = this.passwords[randomPasswordIndex];
    if (randomPassword === this.correctPassword) {
      this.removeDud();
      return;
    }

    let wordSoupPos: {x: number, y: number};
    let nonBlockyChar: string = '';

    for (let i = randomPasswordIndex; i < randomPasswordIndex + randomPassword.length; i++) {
      wordSoupPos = this.wordSoupPosToCharAbs(i);
      nonBlockyChar = this.punctuationNonBlocky[Math.floor(Math.random() * this.punctuationNonBlocky.length)];
      this.lines[wordSoupPos.y] = this.lines[wordSoupPos.y].substring(0, wordSoupPos.x) + nonBlockyChar + this.lines[wordSoupPos.y].substring(wordSoupPos.x + nonBlockyChar.length);
    }

    this.appendStatusLines(['', '>Dud removed.']);
    delete this.passwords[randomPasswordIndex];
  }

  private onDeviceOrientation() {
    let portrait: boolean = window.innerHeight > window.innerWidth;

    let displayElement: HTMLElement = document.querySelector('#display');
    displayElement.style.padding = '0';
    displayElement.style.width = portrait ? '100%' : 'auto';
    displayElement.style.height = portrait ? 'auto' : '100%';
    let displayBorderElement: HTMLElement = document.querySelector('#border');
    displayBorderElement.style.width = portrait ? '100%' : 'auto';
    displayBorderElement.style.height = portrait ? 'auto' : '100%';
    displayBorderElement.style.boxSizing = 'border-box';
    let canvasElement: HTMLElement = document.querySelector('canvas');
    canvasElement.style.width = portrait ? '100%' : 'auto';
    canvasElement.style.height = portrait ? 'auto' : '100%';
    let headerElement: HTMLElement = document.querySelector('header');
    headerElement.style.display = portrait ? 'block' : 'none';
  }
}

enum GameState {
  ATTEMPT,
  MATCH,
  LOCKOUT
}
